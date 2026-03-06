import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAdminToken } from '../../lib/adminAuth';
import { getMongoDb } from '../../lib/mongodb';
import { jsonBody, methodNotAllowed } from '../../lib/http';

interface BroadcastBody {
  message?: string;
}

const getTelegramToken = (): string =>
  (process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN || '').trim();

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
  if (!message) {
    res.status(400).json({ error: 'Message is required' });
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
        { chatId: { $exists: true, $ne: null } },
        { projection: { chatId: 1 } },
      )
      .toArray();

    const allChatIds = userDocs
      .map((entry) => entry.chatId)
      .filter((chatId) => typeof chatId === 'number' || typeof chatId === 'string') as Array<number | string>;

    const limitFromEnv = Number(process.env.BROADCAST_LIMIT || 300);
    const maxUsers = Number.isFinite(limitFromEnv) && limitFromEnv > 0 ? limitFromEnv : 300;
    const targetChatIds = allChatIds.slice(0, maxUsers);

    const sendResults = await Promise.all(targetChatIds.map((chatId) => sendTelegramMessage(telegramToken, chatId, message)));
    const sentCount = sendResults.filter(Boolean).length;
    const failedCount = sendResults.length - sentCount;

    res.status(200).json({
      success: true,
      sentCount,
      failedCount,
      totalUsersWithChatId: allChatIds.length,
      limitedTo: maxUsers,
    });
  } catch (error) {
    console.error('POST /api/admin/broadcast failed', error);
    res.status(500).json({ error: 'Broadcast failed' });
  }
}
