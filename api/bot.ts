import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getMongoDb, isMongoConfigured } from '../lib/mongodb.js';
import { jsonBody, methodNotAllowed } from '../lib/http.js';
import { normalizeProductDoc } from '../lib/catalogData.js';

interface TelegramUser {
  id: number | string;
  first_name?: string;
  username?: string;
}

interface TelegramSuccessfulPayment {
  currency?: string;
  total_amount?: number;
  invoice_payload?: string;
  telegram_payment_charge_id?: string;
  provider_payment_charge_id?: string;
}

interface TelegramMessage {
  chat?: { id?: number | string };
  from?: TelegramUser;
  text?: string;
  successful_payment?: TelegramSuccessfulPayment;
}

interface TelegramPreCheckoutQuery {
  id?: string;
  from?: TelegramUser;
  currency?: string;
  total_amount?: number;
  invoice_payload?: string;
}

interface TelegramUpdate {
  message?: TelegramMessage;
  pre_checkout_query?: TelegramPreCheckoutQuery;
}

type UserDoc = Record<string, any> & { _id: string };
type StarPaymentDoc = {
  _id: string;
  userId: string;
  productId: string;
  payload: string;
  amount: number;
  currency: string;
  createdAt: string;
};

const getBotToken = (): string =>
  (process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN || '').trim();

const normalizeUrl = (value: string): string => value.replace(/\/+$/, '');

const getHeaderValue = (header: string | string[] | undefined): string => {
  if (!header) return '';
  if (Array.isArray(header)) return header[0] || '';
  return header.split(',')[0]?.trim() || '';
};

const getAppUrl = (req: VercelRequest): string => {
  const fromEnv = (process.env.APP_URL || '').trim();
  if (fromEnv) return normalizeUrl(fromEnv);

  const forwardedHost = getHeaderValue(req.headers['x-forwarded-host']);
  const host = forwardedHost || getHeaderValue(req.headers.host);
  if (!host) return '';

  const proto = getHeaderValue(req.headers['x-forwarded-proto']) || 'https';
  return normalizeUrl(`${proto}://${host}`);
};

const sendMessage = async (
  token: string,
  chatId: number | string,
  text: string,
  replyMarkup?: Record<string, unknown>,
): Promise<void> => {
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
        reply_markup: replyMarkup,
      }),
    });
  } catch (error) {
    console.error('Telegram sendMessage failed', error);
  }
};

const extractStartParam = (text: string): string => {
  const match = text.match(/^\/start(?:@\w+)?(?:\s+(.+))?$/i);
  return (match?.[1] || '').trim();
};

const parseReferralUserId = (startParam: string): string | null => {
  if (!startParam) return null;
  const raw = startParam.startsWith('ref_') ? startParam.slice(4) : startParam;
  if (!/^\d{3,32}$/.test(raw)) return null;
  return raw;
};

const parseStarsPayload = (payload: string): { userId: string; productId: string } | null => {
  const parts = payload.split('|');
  if (parts.length < 4 || parts[0] !== 'stars') return null;

  const userId = (parts[1] || '').trim();
  const productId = (parts[2] || '').trim();
  if (!/^\d{3,32}$/.test(userId)) return null;
  if (!/^[a-zA-Z0-9_-]{1,120}$/.test(productId)) return null;

  return { userId, productId };
};

const BOT_DISPLAY_NAME = (process.env.BOT_DISPLAY_NAME || 'FBJNKMLBOT').trim() || 'FBJNKMLBOT';
const DEFAULT_CHANNEL_URL = 'https://t.me/Tleker';
const DEFAULT_REFERRAL_REWARD_POINTS = 1000;

const getReferralRewardPoints = (): number => {
  const raw = String(
    process.env.REFERRAL_REWARD_POINTS ||
      process.env.REFERRAL_REWARD ||
      DEFAULT_REFERRAL_REWARD_POINTS,
  ).trim();
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return DEFAULT_REFERRAL_REWARD_POINTS;
  return Math.max(0, Math.floor(parsed));
};

const getStartChannelUrl = (): string => {
  const raw = (process.env.TELEGRAM_CHANNEL_URL || DEFAULT_CHANNEL_URL).trim();
  if (!raw) return DEFAULT_CHANNEL_URL;
  if (/^https?:\/\/t\.me\/[^\s]+$/i.test(raw)) return raw;
  return DEFAULT_CHANNEL_URL;
};

const buildStartWebAppUrl = (appUrl: string, startParam: string): string =>
  appUrl ? (startParam ? `${appUrl}?startapp=${encodeURIComponent(startParam)}` : appUrl) : '';

const buildStartKeyboard = (
  webAppUrl: string,
  channelUrl: string,
): Record<string, unknown> | undefined => {
  const firstRow: Array<Record<string, unknown>> = [];
  if (webAppUrl) {
    firstRow.push({ text: 'ابدأ الآن 🚀', web_app: { url: webAppUrl } });
  }
  if (channelUrl) {
    firstRow.push({ text: 'قناة تيليجرام 📣', url: channelUrl });
  }

  if (!firstRow.length) return undefined;
  return { inline_keyboard: [firstRow] };
};

const buildStartMessage = (firstName: string | undefined, referralApplied: boolean): string => {
  const name = (firstName || '').trim() || 'صديقي';
  const referralText = referralApplied ? 'تم تسجيلك عبر رابط الإحالة بنجاح.\n\n' : '';
  return `${referralText}أهلًا ${name} في ${BOT_DISPLAY_NAME} 🌟\n\nاضغط زر البدء بالأسفل للدخول إلى التطبيق.`;
};

const upsertTelegramUser = async (telegramUser: TelegramUser, chatId: number | string): Promise<void> => {
  let db = null;
  try {
    db = await getMongoDb();
  } catch (error) {
    console.error('Mongo unavailable in webhook:', error);
  }
  if (!db) return;

  try {
    const userId = String(telegramUser.id);
    const users = db.collection<UserDoc>('users');
    const existing: Record<string, any> = (await users.findOne({ _id: userId })) || {};
    const { _id: _ignoredMongoId, ...safeExisting } = existing;
    const nowIso = new Date().toISOString();

    const data = {
      ...safeExisting,
      id: userId,
      name: telegramUser.first_name || safeExisting?.name || 'User',
      username: telegramUser.username || safeExisting?.username || '',
      chatId,
      role: safeExisting?.role || 'user',
      balance: typeof safeExisting?.balance === 'number' ? safeExisting.balance : 1000,
      energy: typeof safeExisting?.energy === 'number' ? safeExisting.energy : 1000,
      maxEnergy: typeof safeExisting?.maxEnergy === 'number' ? safeExisting.maxEnergy : 1000,
      referrals: typeof safeExisting?.referrals === 'number' ? safeExisting.referrals : 0,
      joinDate: safeExisting?.joinDate || new Date().toLocaleDateString('en-US'),
      language: safeExisting?.language || 'ar',
      theme: safeExisting?.theme || 'dark',
      ownedProducts: Array.isArray(safeExisting?.ownedProducts) ? safeExisting.ownedProducts : [],
      completedTaskIds: Array.isArray(safeExisting?.completedTaskIds) ? safeExisting.completedTaskIds : [],
      isBanned: Boolean(safeExisting?.isBanned),
      notificationsEnabled: safeExisting?.notificationsEnabled ?? true,
      createdAt: safeExisting?.createdAt || nowIso,
      updatedAt: nowIso,
      lastSeenAt: nowIso,
    };

    await users.updateOne(
      { _id: userId },
      { $set: data },
      { upsert: true },
    );
  } catch (error) {
    console.error('Failed to upsert Telegram user', error);
  }
};

const applyReferralIfNeeded = async (newUserId: string, startParam: string): Promise<boolean> => {
  const referrerId = parseReferralUserId(startParam);
  if (!referrerId || referrerId === newUserId) return false;

  const db = await getMongoDb();
  if (!db) return false;

  try {
    const users = db.collection<UserDoc>('users');
    const existingNewUser = await users.findOne({ _id: newUserId }, { projection: { referredBy: 1 } });
    if (existingNewUser?.referredBy) return false;

    const referrer = await users.findOne({ _id: referrerId }, { projection: { _id: 1 } });
    if (!referrer) return false;

    const nowIso = new Date().toISOString();
    const referralRewardPoints = getReferralRewardPoints();
    const setResult = await users.updateOne(
      {
        _id: newUserId,
        $or: [{ referredBy: { $exists: false } }, { referredBy: null }, { referredBy: '' }],
      },
      {
        $set: {
          referredBy: referrerId,
          updatedAt: nowIso,
        },
      },
    );

    if (!setResult.modifiedCount) return false;

    const incFields: Record<string, number> = {
      referrals: 1,
      referralRewardClaimedCount: 1,
    };
    if (referralRewardPoints > 0) {
      incFields.balance = referralRewardPoints;
    }

    await users.updateOne(
      { _id: referrerId },
      {
        $inc: incFields,
        $set: { updatedAt: nowIso },
      },
    );

    return true;
  } catch (error) {
    console.error('Failed to apply referral', error);
    return false;
  }
};

const processSuccessfulStarsPayment = async (
  telegramUser: TelegramUser,
  payment: TelegramSuccessfulPayment,
): Promise<boolean> => {
  const payload = String(payment.invoice_payload || '').trim();
  const parsed = parseStarsPayload(payload);
  if (!parsed) return false;

  const payerId = String(telegramUser.id);
  if (parsed.userId !== payerId) return false;

  const db = await getMongoDb();
  if (!db) return false;

  try {
    const payments = db.collection<StarPaymentDoc>('starPayments');
    const users = db.collection<UserDoc>('users');
    const products = db.collection<Record<string, unknown> & { _id: string }>('products');
    const nowIso = new Date().toISOString();

    const productDoc = await products.findOne({ _id: parsed.productId });
    const product = normalizeProductDoc(productDoc);
    if (!product || !product.allowStars || product.priceStars <= 0) {
      return false;
    }

    const paidAmount = Number(payment.total_amount || 0);
    const expectedAmount = Math.floor(product.priceStars);
    if (!Number.isFinite(paidAmount) || paidAmount < expectedAmount) {
      return false;
    }

    const paymentId =
      String(payment.telegram_payment_charge_id || payment.provider_payment_charge_id || `xtr_${payload}_${payerId}`);

    try {
      await payments.insertOne({
        _id: paymentId,
        userId: payerId,
        productId: parsed.productId,
        payload,
        amount: Number(payment.total_amount || 0),
        currency: payment.currency || 'XTR',
        createdAt: nowIso,
      });
    } catch (error: any) {
      if (error?.code !== 11000) {
        throw error;
      }
      // Duplicate webhook event for same payment.
      // Continue to user update so previously missed ownership grants can be recovered.
    }

    await users.updateOne(
      { _id: payerId },
      {
        $setOnInsert: {
          id: payerId,
          name: telegramUser.first_name || 'User',
          username: telegramUser.username || '',
          balance: 1000,
          energy: 1000,
          maxEnergy: 1000,
          referrals: 0,
          joinDate: new Date().toLocaleDateString('en-US'),
          role: 'user',
          completedTaskIds: [],
          isBanned: false,
          notificationsEnabled: true,
          language: 'ar',
          theme: 'dark',
          createdAt: nowIso,
        },
        $set: { updatedAt: nowIso, lastSeenAt: nowIso },
        $addToSet: { ownedProducts: parsed.productId },
      },
      { upsert: true },
    );

    return true;
  } catch (error) {
    console.error('Failed to process Stars payment', error);
    return false;
  }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const appUrl = getAppUrl(req);

  if (req.method === 'GET') {
    let mongoConnected = false;
    let webhookInfo: Record<string, unknown> | null = null;
    const botTokenConfigured = Boolean(getBotToken());
    if (isMongoConfigured()) {
      const db = await getMongoDb();
      mongoConnected = Boolean(db);
    }

    const includeWebhookInfo =
      String(Array.isArray(req.query.includeWebhookInfo) ? req.query.includeWebhookInfo[0] : req.query.includeWebhookInfo || '')
        .trim()
        .toLowerCase() === '1';

    if (includeWebhookInfo && botTokenConfigured) {
      try {
        const botToken = getBotToken();
        const webhookRes = await fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`);
        const webhookData = (await webhookRes.json().catch(() => ({}))) as {
          ok?: boolean;
          result?: {
            url?: string;
            pending_update_count?: number;
            has_custom_certificate?: boolean;
            last_error_date?: number;
            last_error_message?: string;
            allowed_updates?: string[];
          };
          description?: string;
        };

        if (webhookRes.ok && webhookData.ok) {
          webhookInfo = {
            url: String(webhookData?.result?.url || ''),
            pendingUpdateCount: Number(webhookData?.result?.pending_update_count || 0),
            hasCustomCertificate: Boolean(webhookData?.result?.has_custom_certificate),
            lastErrorDate: Number(webhookData?.result?.last_error_date || 0),
            lastErrorMessage: String(webhookData?.result?.last_error_message || ''),
            allowedUpdates: Array.isArray(webhookData?.result?.allowed_updates)
              ? webhookData.result.allowed_updates.map((value) => String(value))
              : [],
          };
        } else {
          webhookInfo = {
            error: webhookData?.description || 'Failed to fetch webhook info',
          };
        }
      } catch (error) {
        webhookInfo = {
          error: error instanceof Error ? error.message : 'Unable to fetch webhook info',
        };
      }
    }

    res.status(200).json({
      status: 'online',
      botTokenConfigured,
      appUrlConfigured: Boolean(appUrl),
      appUrlPreview: appUrl || null,
      mongoConfigured: isMongoConfigured(),
      mongoConnected,
      ...(includeWebhookInfo ? { webhookInfo } : {}),
    });
    return;
  }

  if (req.method !== 'POST') {
    methodNotAllowed(res, ['GET', 'POST']);
    return;
  }

  const botToken = getBotToken();
  if (!botToken) {
    res.status(200).send('No token configured');
    return;
  }

  const update = jsonBody<TelegramUpdate>(req);
  const preCheckoutQuery = update?.pre_checkout_query;

  if (preCheckoutQuery?.id) {
    const currency = String(preCheckoutQuery.currency || '').trim().toUpperCase();
    const payload = String(preCheckoutQuery.invoice_payload || '').trim();
    const parsedPayload = parseStarsPayload(payload);
    const payerId = String(preCheckoutQuery.from?.id || '').trim();
    const isStars = currency === 'XTR' || currency === 'STARS';
    const payloadMatchesPayer = Boolean(parsedPayload && payerId && parsedPayload.userId === payerId);
    const isValid = isStars && payloadMatchesPayer;
    const errorMessage = !isStars
      ? 'Only Telegram Stars (XTR) payments are supported.'
      : 'Unable to validate payment payload. Please retry.';

    if (!isValid) {
      console.warn('Rejected pre_checkout_query', {
        queryId: preCheckoutQuery.id,
        currency,
        payerId,
        payload,
      });
    }

    // Reply directly in webhook response to minimize payment latency.
    res.status(200).json({
      method: 'answerPreCheckoutQuery',
      pre_checkout_query_id: String(preCheckoutQuery.id),
      ok: isValid,
      ...(isValid ? {} : { error_message: errorMessage }),
    });
    return;
  }

  const message = update?.message;
  const chatId = message?.chat?.id;
  const telegramUser = message?.from;
  const text = (message?.text || '').trim();
  const successfulPayment = message?.successful_payment;

  if (!message || !chatId || !telegramUser) {
    res.status(200).send('No actionable message');
    return;
  }

  const paymentCurrency = String(successfulPayment?.currency || '').trim().toUpperCase();
  if (successfulPayment && (paymentCurrency === 'XTR' || paymentCurrency === 'STARS')) {
    const granted = await processSuccessfulStarsPayment(telegramUser, successfulPayment);
    if (granted) {
      await sendMessage(botToken, chatId, 'Stars payment received. Product activated successfully.');
    }
    res.status(200).send('OK');
    return;
  }

  if (text === '/ping') {
    await sendMessage(botToken, chatId, 'Pong. Bot is alive.');
    res.status(200).send('OK');
    return;
  }

  if (/^\/start(?:@\w+)?(?:\s+.*)?$/i.test(text)) {
    const startParam = extractStartParam(text);
    const channelUrl = getStartChannelUrl();

    const webAppUrl = buildStartWebAppUrl(appUrl, startParam);
    const keyboard = buildStartKeyboard(webAppUrl, channelUrl);
    await sendMessage(
      botToken,
      chatId,
      buildStartMessage(telegramUser.first_name, false),
      keyboard,
    );

    // Keep reply fast (message already sent), then persist user/referral reliably.
    await upsertTelegramUser(telegramUser, chatId);
    if (startParam) {
      await applyReferralIfNeeded(String(telegramUser.id), startParam);
    }

    res.status(200).send('OK');
    return;
  }

  // Non-/start messages should still keep chat id synced.
  void upsertTelegramUser(telegramUser, chatId);

  if (text === '/admin') {
    // Intentionally return only the public start button (no admin link shown in chat).
    const channelUrl = getStartChannelUrl();
    const webAppUrl = buildStartWebAppUrl(appUrl, '');
    const keyboard = buildStartKeyboard(webAppUrl, channelUrl);
    await sendMessage(
      botToken,
      chatId,
      buildStartMessage(telegramUser.first_name, false),
      keyboard,
    );
    res.status(200).send('OK');
    return;
  }

  res.status(200).send('OK');
}
