import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAdminToken } from '../../lib/adminAuth.js';
import { getMongoDb } from '../../lib/mongodb.js';
import { jsonBody, methodNotAllowed } from '../../lib/http.js';

interface BroadcastBody {
  message?: string;
  imageData?: string;
}

const getTelegramToken = (): string =>
  (process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN || '').trim();

const isIntegerLike = (value: string): boolean => /^-?\d+$/.test(value);

const normalizeChatId = (value: unknown): number | string | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed || !isIntegerLike(trimmed)) {
      return null;
    }
    return trimmed;
  }

  return null;
};

const collectChatIds = (records: Array<Record<string, unknown>>): Array<number | string> => {
  const output: Array<number | string> = [];
  const seen = new Set<string>();

  const add = (value: unknown): void => {
    const normalized = normalizeChatId(value);
    if (normalized === null) return;
    const key = String(normalized);
    if (seen.has(key)) return;
    seen.add(key);
    output.push(normalized);
  };

  for (const row of records) {
    add(row.chatId);

    if (row.chatId === undefined || row.chatId === null || row.chatId === '') {
      add(row.id);
      add(row._id);
    }
  }

  return output;
};

const sendTelegramMessage = async (token: string, chatId: number | string, message: string): Promise<boolean> => {
  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
      }),
    });

    if (!response.ok) return false;
    const data = (await response.json()) as { ok?: boolean };
    return Boolean(data.ok);
  } catch {
    return false;
  }
};

const sendTelegramPhoto = async (
  token: string,
  chatId: number | string,
  imageData: string,
  caption?: string,
): Promise<boolean> => {
  try {
    const trimmedImageData = imageData.trim();
    if (!trimmedImageData) return false;

    const safeCaption = caption?.slice(0, 1024);

    if (/^https?:\/\//i.test(trimmedImageData)) {
      const response = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          photo: trimmedImageData,
          ...(safeCaption ? { caption: safeCaption } : {}),
        }),
      });

      if (!response.ok) return false;
      const data = (await response.json()) as { ok?: boolean };
      return Boolean(data.ok);
    }

    const dataUriMatch = trimmedImageData.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$/);
    if (!dataUriMatch) return false;

    const mimeType = dataUriMatch[1].toLowerCase();
    const bytes = Buffer.from(dataUriMatch[2], 'base64');
    if (!bytes.length) return false;

    const extension = mimeType.split('/')[1]?.split('+')[0] || 'jpg';
    const formData = new FormData();
    formData.set('chat_id', String(chatId));
    if (safeCaption) {
      formData.set('caption', safeCaption);
    }
    formData.set('photo', new Blob([bytes], { type: mimeType }), `broadcast.${extension}`);

    const response = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) return false;
    const data = (await response.json()) as { ok?: boolean };
    return Boolean(data.ok);
  } catch {
    return false;
  }
};

const sendBroadcast = async (
  token: string,
  chatId: number | string,
  message: string,
  imageData: string,
): Promise<boolean> => {
  if (imageData) {
    const sentPhoto = await sendTelegramPhoto(token, chatId, imageData, message || undefined);
    if (sentPhoto) return true;

    if (message) {
      return sendTelegramMessage(token, chatId, message);
    }

    return false;
  }

  return sendTelegramMessage(token, chatId, message);
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    methodNotAllowed(res, ['POST']);
    return;
  }

  if (!verifyAdminToken(req.headers.authorization)) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const body = jsonBody<BroadcastBody>(req);
  const message = (body.message || '').trim();
  const imageData = typeof body.imageData === 'string' ? body.imageData.trim() : '';
  if (!message && !imageData) {
    res.status(400).json({ error: 'Message or image is required' });
    return;
  }

  const telegramToken = getTelegramToken();
  if (!telegramToken) {
    res.status(500).json({ error: 'TELEGRAM_BOT_TOKEN is missing' });
    return;
  }

  const db = await getMongoDb();
  if (!db) {
    res.status(500).json({ error: 'Database is not configured' });
    return;
  }

  try {
    const users = db.collection<Record<string, unknown>>('users');
    const userDocs = await users
      .find(
        {},
        { projection: { chatId: 1, id: 1 } },
      )
      .toArray();

    const allChatIds = collectChatIds(userDocs);

    const limitFromEnv = Number(process.env.BROADCAST_LIMIT || 300);
    const maxUsers = Number.isFinite(limitFromEnv) && limitFromEnv > 0 ? limitFromEnv : 300;
    const targetChatIds = allChatIds.slice(0, maxUsers);

    const sendResults = await Promise.all(
      targetChatIds.map((chatId) => sendBroadcast(telegramToken, chatId, message, imageData)),
    );
    const sentCount = sendResults.filter(Boolean).length;
    const failedCount = sendResults.length - sentCount;

    res.status(200).json({
      success: true,
      sentCount,
      failedCount,
      totalUsersWithChatId: allChatIds.length,
      limitedTo: maxUsers,
      mode: imageData ? 'photo' : 'text',
    });
  } catch (error) {
    console.error('POST /api/admin/broadcast failed', error);
    res.status(500).json({ error: 'Broadcast failed' });
  }
}
