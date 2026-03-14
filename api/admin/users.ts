import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAdminToken } from '../../lib/adminAuth.js';
import { getMongoDb } from '../../lib/mongodb.js';
import { jsonBody, methodNotAllowed } from '../../lib/http.js';

type UserDoc = Record<string, unknown> & { _id: string };

interface UpdateUserBody {
  id?: string;
  isBanned?: boolean;
  points?: number | string;
  pointsDelta?: number | string;
}

const USER_ID_PATTERN = /^[a-zA-Z0-9_-]{1,120}$/;

const escapeRegex = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getIdFromQuery = (req: VercelRequest): string => {
  const raw = req.query.id;
  if (Array.isArray(raw)) return (raw[0] || '').trim();
  return (raw || '').trim();
};

const toSafeNumber = (value: unknown): number => {
  const n = typeof value === 'number' ? value : Number(value || 0);
  if (!Number.isFinite(n)) return 0;
  return n;
};

const parseFiniteNumber = (value: unknown): number | null => {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return null;
  return n;
};

const resolvePhotoUrl = (photoUrl: unknown, username: unknown): string => {
  const direct = typeof photoUrl === 'string' ? photoUrl.trim() : '';
  if (direct) return direct;

  const uname = typeof username === 'string' ? username.trim().replace(/^@/, '') : '';
  if (!uname) return '';

  // Public Telegram avatar URL fallback for users with username.
  return `https://t.me/i/userpic/320/${encodeURIComponent(uname)}.jpg`;
};

const serializeUser = (doc: UserDoc) => ({
  id: typeof doc.id === 'string' && doc.id ? doc.id : doc._id,
  name: typeof doc.name === 'string' && doc.name ? doc.name : 'User',
  username: typeof doc.username === 'string' ? doc.username : '',
  photo_url: resolvePhotoUrl(doc.photo_url, doc.username),
  balance: toSafeNumber(doc.balance),
  isBanned: Boolean(doc.isBanned),
  createdAt: typeof doc.createdAt === 'string' ? doc.createdAt : '',
  updatedAt: typeof doc.updatedAt === 'string' ? doc.updatedAt : '',
  lastSeenAt: typeof doc.lastSeenAt === 'string' ? doc.lastSeenAt : '',
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'PATCH') {
    methodNotAllowed(res, ['GET', 'PATCH']);
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

  try {
    const users = db.collection<UserDoc>('users');

    if (req.method === 'GET') {
      const qParam = req.query.q;
      const q = (Array.isArray(qParam) ? qParam[0] : qParam || '').trim();

      const limitParam = req.query.limit;
      const requestedLimit = Number(Array.isArray(limitParam) ? limitParam[0] : limitParam || 50);
      const limit = Number.isFinite(requestedLimit)
        ? Math.max(1, Math.min(200, Math.floor(requestedLimit)))
        : 50;

      const filter =
        q.length > 0
          ? {
              $or: [
                { _id: { $regex: escapeRegex(q), $options: 'i' } },
                { id: { $regex: escapeRegex(q), $options: 'i' } },
                { name: { $regex: escapeRegex(q), $options: 'i' } },
                { username: { $regex: escapeRegex(q), $options: 'i' } },
              ],
            }
          : {};

      const docs = await users
        .find(filter, {
          projection: {
            id: 1,
            name: 1,
            username: 1,
            photo_url: 1,
            balance: 1,
            isBanned: 1,
            createdAt: 1,
            updatedAt: 1,
            lastSeenAt: 1,
          },
        })
        .sort({ updatedAt: -1, _id: -1 })
        .limit(limit)
        .toArray();

      res.status(200).json({
        users: docs.map(serializeUser),
        count: docs.length,
      });
      return;
    }

    const body = jsonBody<UpdateUserBody>(req);
    const userId = getIdFromQuery(req) || (typeof body.id === 'string' ? body.id.trim() : '');
    if (!USER_ID_PATTERN.test(userId)) {
      res.status(400).json({ error: 'Invalid user ID' });
      return;
    }

    const existing = await users.findOne({ _id: userId });
    if (!existing) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const updates: Record<string, unknown> = {};
    if (typeof body.isBanned === 'boolean') {
      updates.isBanned = body.isBanned;
    }

    if (body.points !== undefined) {
      const exact = parseFiniteNumber(body.points);
      if (exact === null) {
        res.status(400).json({ error: 'points must be a valid number' });
        return;
      }
      updates.balance = Math.max(0, exact);
    } else if (body.pointsDelta !== undefined) {
      const delta = parseFiniteNumber(body.pointsDelta);
      if (delta === null) {
        res.status(400).json({ error: 'pointsDelta must be a valid number' });
        return;
      }
      updates.balance = Math.max(0, toSafeNumber(existing.balance) + delta);
    }

    if (Object.keys(updates).length === 0) {
      res.status(400).json({ error: 'No valid update fields provided' });
      return;
    }

    updates.updatedAt = new Date().toISOString();

    await users.updateOne(
      { _id: userId },
      {
        $set: updates,
      },
    );

    const saved = await users.findOne(
      { _id: userId },
      {
        projection: {
          id: 1,
          name: 1,
          username: 1,
          photo_url: 1,
          balance: 1,
          isBanned: 1,
          createdAt: 1,
          updatedAt: 1,
          lastSeenAt: 1,
        },
      },
    );

    if (!saved) {
      res.status(500).json({ error: 'Failed to load updated user' });
      return;
    }

    res.status(200).json({
      success: true,
      user: serializeUser(saved),
    });
  } catch (error) {
    console.error(`${req.method} /api/admin/users failed`, error);
    res.status(500).json({ error: 'Failed to process user request' });
  }
}
