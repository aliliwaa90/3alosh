import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAdminToken } from '../../lib/adminAuth.js';
import { getMongoDb } from '../../lib/mongodb.js';
import { jsonBody, methodNotAllowed } from '../../lib/http.js';
import { isValidProductId, normalizeProduct, normalizeProductDoc } from '../../lib/catalogData.js';

type ProductDoc = Record<string, unknown> & { _id: string };

const randomSuffix = (): string => Math.random().toString(36).slice(2, 8);

const getIdFromQuery = (req: VercelRequest): string => {
  const raw = req.query.id;
  if (Array.isArray(raw)) return (raw[0] || '').trim();
  return (raw || '').trim();
};

const getProductId = (req: VercelRequest, body: Record<string, unknown>): string => {
  const fromQuery = getIdFromQuery(req);
  if (fromQuery) return fromQuery;
  return typeof body.id === 'string' ? body.id.trim() : '';
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST' && req.method !== 'PATCH' && req.method !== 'DELETE') {
    methodNotAllowed(res, ['POST', 'PATCH', 'DELETE']);
    return;
  }

  if (!verifyAdminToken(req.headers.authorization)) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const db = await getMongoDb();
  if (!db) {
    res.status(500).json({ error: 'Database is not configured' });
    return;
  }

  const products = db.collection<ProductDoc>('products');
  const body = jsonBody<Record<string, unknown>>(req);

  try {
    if (req.method === 'POST') {
      const rawId = typeof body.id === 'string' ? body.id.trim() : '';
      const productId = rawId || `p_${Date.now()}_${randomSuffix()}`;

      const normalized = normalizeProduct({ ...body, id: productId }, productId);
      if (!normalized) {
        res.status(400).json({ error: 'Invalid product payload' });
        return;
      }

      const exists = await products.findOne({ _id: productId }, { projection: { _id: 1 } });
      if (exists) {
        res.status(409).json({ error: 'Product ID already exists' });
        return;
      }

      const nowIso = new Date().toISOString();
      await products.insertOne({
        _id: productId,
        ...normalized,
        createdAt: nowIso,
        updatedAt: nowIso,
      });

      const saved = await products.findOne({ _id: productId });
      const product = normalizeProductDoc(saved);
      if (!product) {
        res.status(500).json({ error: 'Failed to normalize saved product' });
        return;
      }

      res.status(201).json({ success: true, product });
      return;
    }

    const productId = getProductId(req, body);
    if (!isValidProductId(productId)) {
      res.status(400).json({ error: 'Invalid product ID' });
      return;
    }

    if (req.method === 'DELETE') {
      const deleted = await products.deleteOne({ _id: productId });
      if (!deleted.deletedCount) {
        res.status(404).json({ error: 'Product not found' });
        return;
      }

      await db.collection<Record<string, unknown>>('users').updateMany(
        {},
        ({
          $pull: { ownedProducts: productId },
          $set: { updatedAt: new Date().toISOString() },
        } as any),
      );

      res.status(200).json({ success: true });
      return;
    }

    const existing = await products.findOne({ _id: productId });
    if (!existing) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    const merged = { ...existing, ...body, id: productId };
    const normalized = normalizeProduct(merged, productId);
    if (!normalized) {
      res.status(400).json({ error: 'Invalid product payload' });
      return;
    }

    const nowIso = new Date().toISOString();
    const createdAt =
      typeof existing.createdAt === 'string' && existing.createdAt ? existing.createdAt : nowIso;

    await products.updateOne(
      { _id: productId },
      {
        $set: {
          ...normalized,
          createdAt,
          updatedAt: nowIso,
        },
      },
    );

    const saved = await products.findOne({ _id: productId });
    const product = normalizeProductDoc(saved);
    if (!product) {
      res.status(500).json({ error: 'Failed to normalize updated product' });
      return;
    }

    res.status(200).json({ success: true, product });
  } catch (error) {
    console.error(`${req.method} /api/admin/products failed`, error);
    res.status(500).json({ error: 'Failed to process product request' });
  }
}
