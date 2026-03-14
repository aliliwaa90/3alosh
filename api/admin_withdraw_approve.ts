import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getMongoDb } from '../lib/mongodb.js';
import { verifyAdminToken } from '../lib/adminAuth.js';
import { methodNotAllowed } from '../lib/http.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'PATCH') {
    return methodNotAllowed(res, ['PATCH']);
  }

  if (!verifyAdminToken(req.headers.authorization)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id: withdrawalId } = req.query;
  const { adminNotes } = req.body;

  const db = await getMongoDb();
  if (!db) return res.status(500).json({ error: 'Database not configured' });

  try {
    const withdrawals = db.collection('withdrawals');
    const users = db.collection('users');

    const withdrawal = await withdrawals.findOne({ _id: withdrawalId as any });
    if (!withdrawal) return res.status(404).json({ error: 'Withdrawal not found' });

    if (withdrawal.status !== 'pending') {
      return res.status(400).json({ error: 'Withdrawal is already processed' });
    }

    // Update status
    await withdrawals.updateOne(
      { _id: withdrawalId as any },
      { $set: { 
          status: 'completed', 
          approvedAt: new Date().toISOString(),
          adminNotes: adminNotes || ''
        } 
      }
    );

    // Deduct from user
    await users.updateOne(
      { _id: withdrawal.userId as any },
      { $inc: { balance: -withdrawal.amount } }
    );

    res.status(200).json({ success: true, message: 'Withdrawal approved successfully' });
  } catch (error) {
    console.error('Approve withdrawal error:', error);
    res.status(500).json({ error: 'Failed to approve withdrawal' });
  }
}
