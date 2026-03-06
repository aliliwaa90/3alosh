import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getMongoDb } from '../lib/mongodb';
import { methodNotAllowed } from '../lib/http';

type UserDoc = {
  _id: string;
  id?: string;
  name?: string;
  balance?: number | string;
  photo_url?: string;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    methodNotAllowed(res, ['GET']);
    return;
  }

  const db = await getMongoDb();
  if (!db) {
    res.status(500).json({ error: 'Database is not configured' });
    return;
  }

  try {
    const users = db.collection<UserDoc>('users');
    const docs = await users
      .find({}, { projection: { id: 1, name: 1, balance: 1, photo_url: 1 } })
      .sort({ balance: -1 })
      .limit(20)
      .toArray();

    const leaders = docs.map((entry) => {
      const balance = typeof entry.balance === 'number' ? entry.balance : Number(entry.balance || 0);
      return {
        id: typeof entry.id === 'string' ? entry.id : String(entry._id || ''),
        name: typeof entry.name === 'string' ? entry.name : 'User',
        balance,
        photo_url: typeof entry.photo_url === 'string' ? entry.photo_url : undefined,
      };
    });

    res.status(200).json(leaders);
  } catch (error) {
    console.error('GET /api/leaderboard failed', error);
    res.status(500).json({ error: 'Failed to load leaderboard' });
  }
}
