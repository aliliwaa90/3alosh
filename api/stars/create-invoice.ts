import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getMongoDb } from '../../lib/mongodb.js';
import { jsonBody, methodNotAllowed } from '../../lib/http.js';

interface CreateInvoiceBody {
  userId?: string;
  productId?: string;
  title?: string;
  description?: string;
  starsAmount?: number | string;
}

type UserDoc = Record<string, unknown> & { _id: string };

const getTelegramToken = (): string =>
  (process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN || '').trim();

const safeText = (value: unknown, fallback: string): string => {
  const text = typeof value === 'string' ? value.trim() : '';
  return text || fallback;
};

const toPositiveInteger = (value: number | string | undefined): number => {
  const n = typeof value === 'string' ? Number(value) : Number(value || 0);
  if (!Number.isFinite(n)) return 0;
  return Math.floor(n);
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    methodNotAllowed(res, ['POST']);
    return;
  }

  const token = getTelegramToken();
  if (!token) {
    res.status(500).json({ error: 'TELEGRAM_BOT_TOKEN is missing' });
    return;
  }

  const db = await getMongoDb();
  if (!db) {
    res.status(500).json({ error: 'Database is not configured' });
    return;
  }

  const body = jsonBody<CreateInvoiceBody>(req);
  const userId = safeText(body.userId, '');
  const productId = safeText(body.productId, '');
  const title = safeText(body.title, 'Digital Product').slice(0, 32);
  const description = safeText(body.description, `Purchase ${title}`).slice(0, 255);
  const starsAmount = toPositiveInteger(body.starsAmount);

  if (!/^\d{3,32}$/.test(userId)) {
    res.status(400).json({ error: 'Invalid userId' });
    return;
  }

  if (!/^[a-zA-Z0-9_-]{1,120}$/.test(productId)) {
    res.status(400).json({ error: 'Invalid productId' });
    return;
  }

  if (starsAmount <= 0) {
    res.status(400).json({ error: 'starsAmount must be greater than zero' });
    return;
  }

  try {
    const users = db.collection<UserDoc>('users');
    const user = await users.findOne({ _id: userId }, { projection: { _id: 1, ownedProducts: 1 } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (Array.isArray(user.ownedProducts) && user.ownedProducts.includes(productId)) {
      res.status(409).json({ error: 'Product already owned' });
      return;
    }

    const payload = `stars|${userId}|${productId}|${Date.now()}`;
    const tgRes = await fetch(`https://api.telegram.org/bot${token}/createInvoiceLink`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        description,
        payload,
        provider_token: '',
        currency: 'XTR',
        prices: [
          {
            label: title,
            amount: starsAmount,
          },
        ],
      }),
    });

    const tgData = (await tgRes.json().catch(() => ({}))) as {
      ok?: boolean;
      result?: string;
      description?: string;
    };

    if (!tgRes.ok || !tgData.ok || !tgData.result) {
      res.status(502).json({
        error: tgData.description || 'Failed to create Telegram invoice',
      });
      return;
    }

    res.status(200).json({
      success: true,
      invoiceLink: tgData.result,
      payload,
    });
  } catch (error) {
    console.error('POST /api/stars/create-invoice failed', error);
    res.status(500).json({ error: 'Unable to create Stars invoice' });
  }
}
