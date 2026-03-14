import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getMongoDb } from '../lib/mongodb.js';
import { methodNotAllowed } from '../lib/http.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const db = await getMongoDb();
  if (!db) {
    return res.status(500).json({ error: 'Database not configured' });
  }

  const users = db.collection('users');
  const withdrawals = db.collection('withdrawals');

  if (req.method === 'POST') {
    const { userId, amount, method, bankAccount } = req.body;

    if (!userId || !amount || !method || !bankAccount) {
      return res.status(400).json({ error: 'جميع الحقول مطلوبة' });
    }

    if (amount < 10000) {
      return res.status(400).json({ error: 'الحد الأدنى للسحب هو 10,000 تلايكر' });
    }

    try {
      const user = await users.findOne({ _id: userId as any });
      if (!user || user.balance < amount) {
        return res.status(400).json({ error: 'رصيدك غير كافي' });
      }

      const withdrawalId = `wd_${Date.now()}`;
      const newWithdrawal = {
        _id: withdrawalId as any,
        id: withdrawalId,
        userId,
        userName: user.name || user.username || 'User',
        amount,
        iqdAmount: Math.floor(amount),
        status: 'pending',
        method,
        bankAccount,
        createdAt: new Date().toISOString(),
        timestamp: Date.now(),
      };

      await withdrawals.insertOne(newWithdrawal);
      // We don't deduct balance here, we deduct it on approval (matching existing server.ts logic)
      
      return res.status(200).json({
        success: true,
        withdrawal: newWithdrawal,
        message: 'تم إرسال طلب السحب بنجاح'
      });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to process withdrawal' });
    }
  }

  if (req.method === 'GET') {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    try {
      const list = await withdrawals.find({ userId }).sort({ timestamp: -1 }).toArray();
      return res.status(200).json({
        success: true,
        withdrawals: list.map(w => ({ ...w, id: w.id || w._id }))
      });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch withdrawals' });
    }
  }

  methodNotAllowed(res, ['GET', 'POST']);
}
