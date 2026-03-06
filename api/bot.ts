import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getMongoDb, isMongoConfigured } from '../lib/mongodb.js';
import { jsonBody, methodNotAllowed } from '../lib/http.js';

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

const answerPreCheckoutQuery = async (
  token: string,
  preCheckoutQueryId: string,
  ok: boolean,
  errorMessage?: string,
): Promise<void> => {
  try {
    await fetch(`https://api.telegram.org/bot${token}/answerPreCheckoutQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pre_checkout_query_id: preCheckoutQueryId,
        ok,
        ...(ok ? {} : { error_message: errorMessage || 'Payment validation failed' }),
      }),
    });
  } catch (error) {
    console.error('answerPreCheckoutQuery failed', error);
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

    await users.updateOne(
      { _id: referrerId },
      {
        $inc: { referrals: 1 },
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
    const nowIso = new Date().toISOString();

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
      if (error?.code === 11000) {
        // Duplicate webhook event for same payment.
        return true;
      }
      throw error;
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
          ownedProducts: [],
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
    if (isMongoConfigured()) {
      const db = await getMongoDb();
      mongoConnected = Boolean(db);
    }

    res.status(200).json({
      status: 'online',
      botTokenConfigured: Boolean(getBotToken()),
      appUrlConfigured: Boolean(appUrl),
      appUrlPreview: appUrl || null,
      mongoConfigured: isMongoConfigured(),
      mongoConnected,
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
    const isStars = (preCheckoutQuery.currency || '').toUpperCase() === 'XTR';
    await answerPreCheckoutQuery(
      botToken,
      preCheckoutQuery.id,
      isStars,
      'Only Telegram Stars (XTR) payments are supported.',
    );
    res.status(200).send('OK');
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

  if (successfulPayment && String(successfulPayment.currency || '').toUpperCase() === 'XTR') {
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
    await upsertTelegramUser(telegramUser, chatId);
    const startParam = extractStartParam(text);
    const referralApplied = await applyReferralIfNeeded(String(telegramUser.id), startParam);

    const webAppUrl = appUrl
      ? startParam
        ? `${appUrl}?startapp=${encodeURIComponent(startParam)}`
        : appUrl
      : '';

    const keyboard = webAppUrl
      ? {
          inline_keyboard: [[{ text: 'Open Mini App', web_app: { url: webAppUrl } }]],
        }
      : undefined;

    const referralText = referralApplied ? 'Referral has been registered successfully.\n\n' : '';
    await sendMessage(
      botToken,
      chatId,
      `${referralText}Welcome ${telegramUser.first_name || 'friend'}.\n\nTap the button below to open the mini app.`,
      keyboard,
    );

    res.status(200).send('OK');
    return;
  }

  // Non-/start messages should still keep chat id synced.
  void upsertTelegramUser(telegramUser, chatId);

  if (text === '/admin') {
    if (!appUrl) {
      await sendMessage(botToken, chatId, 'APP_URL is not configured on the server.');
      res.status(200).send('OK');
      return;
    }

    const adminUrl = `${appUrl}/#/admin`;
    await sendMessage(botToken, chatId, 'Admin panel link:', {
      inline_keyboard: [[{ text: 'Open Admin Panel', web_app: { url: adminUrl } }]],
    });
  }

  res.status(200).send('OK');
}
