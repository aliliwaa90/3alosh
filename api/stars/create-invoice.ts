import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getMongoDb } from '../../lib/mongodb.js';
import { jsonBody, methodNotAllowed } from '../../lib/http.js';
import { normalizeProductDoc } from '../../lib/catalogData.js';

interface CreateInvoiceBody {
  userId?: string;
  productId?: string;
}

type UserDoc = Record<string, unknown> & { _id: string };

const getTelegramToken = (): string =>
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

const safeText = (value: unknown, fallback: string): string => {
  const text = typeof value === 'string' ? value.trim() : '';
  return text || fallback;
};

const utf8ByteLength = (value: string): number => Buffer.byteLength(value, 'utf8');

const ensureBotWebhookForStars = async (
  token: string,
  expectedWebhookUrl: string,
): Promise<{ ok: boolean; error?: string }> => {
  if (!expectedWebhookUrl) {
    return { ok: false, error: 'APP_URL is missing, cannot configure bot webhook' };
  }

  const webhookInfoRes = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
  const webhookInfoData = (await webhookInfoRes.json().catch(() => ({}))) as {
    ok?: boolean;
    result?: { url?: string };
    description?: string;
  };

  const setWebhookRes = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: expectedWebhookUrl,
      allowed_updates: ['message', 'pre_checkout_query'],
      drop_pending_updates: false,
    }),
  });

  const setWebhookData = (await setWebhookRes.json().catch(() => ({}))) as {
    ok?: boolean;
    description?: string;
  };

  if (!setWebhookRes.ok || !setWebhookData.ok) {
    return {
      ok: false,
      error:
        setWebhookData?.description ||
        webhookInfoData?.description ||
        'Failed to set Telegram webhook',
    };
  }

  return { ok: true };
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
  const appUrl = getAppUrl(req);

  const db = await getMongoDb();
  if (!db) {
    res.status(500).json({ error: 'Database is not configured' });
    return;
  }

  const body = jsonBody<CreateInvoiceBody>(req);
  const userId = safeText(body.userId, '');
  const productId = safeText(body.productId, '');

  if (!/^\d{3,32}$/.test(userId)) {
    res.status(400).json({ error: 'Invalid userId' });
    return;
  }

  if (!/^[a-zA-Z0-9_-]{1,120}$/.test(productId)) {
    res.status(400).json({ error: 'Invalid productId' });
    return;
  }

  try {
    const expectedWebhookUrl = `${appUrl}/api/bot`;
    const webhookCheck = await ensureBotWebhookForStars(token, expectedWebhookUrl);
    if (!webhookCheck.ok) {
      res.status(500).json({
        error: webhookCheck.error || 'Unable to configure bot webhook for Stars checkout',
      });
      return;
    }

    const users = db.collection<UserDoc>('users');
    const products = db.collection<Record<string, unknown> & { _id: string }>('products');

    const productDoc = await products.findOne({ _id: productId });
    const product = normalizeProductDoc(productDoc);
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    if (!product.allowStars || !product.priceStars || product.priceStars <= 0) {
      res.status(400).json({ error: 'Stars purchase is disabled for this product' });
      return;
    }

    const title = product.name.slice(0, 32);
    const description = product.description.slice(0, 255) || `Purchase ${title}`;
    const starsAmount = Math.floor(product.priceStars);

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
    if (utf8ByteLength(payload) > 128) {
      res.status(400).json({ error: 'Invoice payload is too long' });
      return;
    }

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
