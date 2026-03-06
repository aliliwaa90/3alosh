import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAdminToken } from '../../lib/adminAuth.js';
import { getMongoDb } from '../../lib/mongodb.js';
import { methodNotAllowed } from '../../lib/http.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    methodNotAllowed(res, ['GET']);
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
    const users = db.collection<Record<string, unknown>>('users');
    const transactions = db.collection<Record<string, unknown>>('transactions');

    const oneWeekAgoIso = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [totalUsers, activeUsers, txDocs, pendingWithdrawals] = await Promise.all([
      users.countDocuments({}),
      users.countDocuments({ lastSeenAt: { $gte: oneWeekAgoIso } }),
      transactions
        .find(
          { type: 'DEPOSIT', status: 'COMPLETED' },
          { projection: { usdAmount: 1 } },
        )
        .toArray(),
      transactions.countDocuments({ type: 'WITHDRAWAL', status: 'PENDING' }),
    ]);

    const revenue = txDocs.reduce((sum, item) => {
      const usdAmount = typeof item.usdAmount === 'number' ? item.usdAmount : Number(item.usdAmount || 0);
      return sum + (Number.isFinite(usdAmount) ? usdAmount : 0);
    }, 0);

    res.status(200).json({
      totalUsers,
      activeUsers,
      revenue,
      pendingWithdrawals,
    });
  } catch (error) {
    console.error('GET /api/admin/stats failed', error);
    res.status(500).json({ error: 'Failed to load stats' });
  }
}
