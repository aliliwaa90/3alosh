import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getMongoDb } from '../lib/mongodb.js';
import { verifyAdminToken } from '../lib/adminAuth.js';
import { methodNotAllowed } from '../lib/http.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return methodNotAllowed(res, ['GET']);
  }

  if (!verifyAdminToken(req.headers.authorization)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const db = await getMongoDb();
  if (!db) return res.status(500).json({ error: 'Database not configured' });

  try {
    const list = await db.collection('withdrawals').find({}).sort({ timestamp: -1 }).toArray();

    res.status(200).json({
      success: true,
      withdrawals: list.map(w => ({ ...w, id: w.id || w._id }))
    });
  } catch (error) {
    console.error('Fetch all withdrawals error:', error);
    res.status(500).json({ error: 'Failed to fetch withdrawals' });
  }
}
