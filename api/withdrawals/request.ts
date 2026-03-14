import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getMongoDb } from '../../lib/mongodb.js';
import { methodNotAllowed } from '../../lib/http.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return methodNotAllowed(res, ['POST']);
  }

  const { userId, amount, method, bankAccount } = req.body;

  if (!userId || !amount || !method || !bankAccount) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const db = await getMongoDb();
  if (!db) return res.status(500).json({ error: 'Database not configured' });

  try {
    const users = db.collection('users');
    const withdrawals = db.collection('withdrawals');

    const user = await users.findOne({ _id: userId as any });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.balance < amount) return res.status(400).json({ error: 'Insufficient balance' });

    const withdrawalId = `wd_${Date.now()}`;
    const withdrawal = {
      _id: withdrawalId as any,
      id: withdrawalId,
      userId,
      userName: user.name || user.username || 'User',
      amount,
      iqdAmount: amount, // 1:1 rate as defined in earlier code
      status: 'pending',
      method,
      bankAccount,
      createdAt: new Date().toISOString(),
      timestamp: Date.now(),
    };

    await withdrawals.insertOne(withdrawal);

    res.status(200).json({
      success: true,
      withdrawal,
      message: 'تم إرسال طلب السحب بنجاح'
    });
  } catch (error) {
    console.error('Withdrawal request error:', error);
    res.status(500).json({ error: 'Failed to create withdrawal request' });
  }
}
