import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getMongoDb } from '../lib/mongodb.js';
import { methodNotAllowed } from '../lib/http.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return methodNotAllowed(res, ['GET']);
  }

  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  const db = await getMongoDb();
  if (!db) return res.status(500).json({ error: 'Database not configured' });

  try {
    const withdrawals = db.collection('withdrawals');
    const list = await withdrawals.find({ userId }).sort({ timestamp: -1 }).toArray();

    res.status(200).json({
      success: true,
      withdrawals: list.map(w => ({ ...w, id: w.id || w._id }))
    });
  } catch (error) {
    console.error('Fetch user withdrawals error:', error);
    res.status(500).json({ error: 'Failed to fetch withdrawals' });
  }
}
