import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getMongoDb } from '../lib/mongodb.js';
import { jsonBody, methodNotAllowed } from '../lib/http.js';

interface TelegramUser {
  id: number | string;
  first_name?: string;
  username?: string;
}

interface TelegramMessage {
  chat?: { id?: number | string };
  from?: TelegramUser;
  text?: string;
}

interface TelegramUpdate {
  message?: TelegramMessage;
}

type UserDoc = Record<string, any> & { _id: string };

const getBotToken = (): string =>
  (process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN || '').trim();

const getAppUrl = (): string => (process.env.APP_URL || '').trim();

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    res.status(200).json({
      status: 'online',
      botTokenConfigured: Boolean(getBotToken()),
      appUrlConfigured: Boolean(getAppUrl()),
    });
    return;
  }

  if (req.method !== 'POST') {
    methodNotAllowed(res, ['GET', 'POST']);
    return;
  }

  const botToken = getBotToken();
  if (!botToken) {
    // Keep 200 so Telegram does not retry aggressively.
    res.status(200).send('No token configured');
    return;
  }

  const update = jsonBody<TelegramUpdate>(req);
  const message = update?.message;
  const chatId = message?.chat?.id;
  const telegramUser = message?.from;
  const text = (message?.text || '').trim();
  const appUrl = getAppUrl();

  if (!message || !chatId || !telegramUser) {
    res.status(200).send('No actionable message');
    return;
  }

  // Never block webhook response on DB write.
  void upsertTelegramUser(telegramUser, chatId);

  if (text === '/ping') {
    await sendMessage(botToken, chatId, 'Pong. Bot is alive.');
    res.status(200).send('OK');
    return;
  }

  if (text.startsWith('/start')) {
    const keyboard = appUrl
      ? {
          inline_keyboard: [[{ text: 'Open App', web_app: { url: appUrl } }]],
        }
      : undefined;

    await sendMessage(
      botToken,
      chatId,
      `Hello ${telegramUser.first_name || 'Friend'}.\n\nUse the button below to open Tliker.`,
      keyboard,
    );
  }

  if (text === '/admin') {
    if (!appUrl) {
      await sendMessage(botToken, chatId, 'APP_URL is not configured on the server.');
      res.status(200).send('OK');
      return;
    }

    await sendMessage(botToken, chatId, 'Admin panel link:', {
      inline_keyboard: [[{ text: 'Open Admin Panel', web_app: { url: `${appUrl}?start_param=admin_panel` } }]],
    });
  }

  res.status(200).send('OK');
}
