import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_FILE = path.join(__dirname, '../../database.json');

const router = Router();

// Helper to read/write DB
const readDb = () => {
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
  } catch (e) {
    return { users: {}, withdrawals: [] };
  }
};

const writeDb = (data: any) => {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
};

// سعر الصرف: 1000 Tliker = 1000 IQD (نسبة 1:1)
const CONVERSION_RATE = 1;

// POST: إنشاء طلب سحب جديد
router.post('/request', async (req: Request, res: Response) => {
  try {
    const { userId, amount, method, bankAccount } = req.body;

    if (!userId || !amount || !method || !bankAccount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const validMethods = ['zain-cash', 'k-card', 'fib', 'okx', 'binance'];
    if (!validMethods.includes(method)) {
      return res.status(400).json({ error: 'Invalid payment method' });
    }

    if (amount < 1000) {
      return res.status(400).json({ error: 'Minimum withdrawal is 1000 Tliker' });
    }

    // Check user balance
    let db = readDb();
    const user = db.users[userId];
    if (!user || user.balance < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Create withdrawal request
    const withdrawalId = `wd_${Date.now()}`;
    const withdrawal = {
      id: withdrawalId,
      userId,
      userName: user.name || user.username,
      amount,
      iqdAmount: amount * CONVERSION_RATE,
      status: 'pending',
      method,
      bankAccount,
      createdAt: new Date().toISOString(),
      timestamp: Date.now(),
    };

    if (!db.withdrawals) {
      db.withdrawals = [];
    }
    db.withdrawals.push(withdrawal);

    // Save to DB
    writeDb(db);

    res.json({
      success: true,
      withdrawal,
      message: 'تم إرسال طلب السحب بنجاح، جاري المراجعة',
    });
  } catch (error) {
    console.error('Withdrawal request error:', error);
    res.status(500).json({ error: 'Failed to create withdrawal request' });
  }
});

// GET: الحصول على طلبات السحب الخاصة بالمستخدم
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const db = readDb();

    const userWithdrawals = (db.withdrawals || []).filter(
      (w: any) => w.userId === userId
    );

    res.json({
      success: true,
      withdrawals: userWithdrawals,
    });
  } catch (error) {
    console.error('Get user withdrawals error:', error);
    res.status(500).json({ error: 'Failed to fetch withdrawals' });
  }
});

// GET: جميع طلبات السحب (للإدارة)
router.get('/all', async (_req: Request, res: Response) => {
  try {
    const db = readDb();
    const withdrawals = db.withdrawals || [];

    // ترتيب حسب الأحدث أولاً
    const sorted = withdrawals.sort(
      (a: any, b: any) => b.timestamp - a.timestamp
    );

    res.json({
      success: true,
      withdrawals: sorted,
      total: sorted.length,
      pending: sorted.filter((w: any) => w.status === 'pending').length,
    });
  } catch (error) {
    console.error('Get all withdrawals error:', error);
    res.status(500).json({ error: 'Failed to fetch withdrawals' });
  }
});

// PATCH: الموافقة على طلب السحب
router.patch('/:withdrawalId/approve', async (req: Request, res: Response) => {
  try {
    const { withdrawalId } = req.params;
    const { adminNotes } = req.body;

    let db = readDb();
    const withdrawalIndex = db.withdrawals?.findIndex(
      (w: any) => w.id === withdrawalId
    );

    if (withdrawalIndex === -1 || withdrawalIndex === undefined) {
      return res.status(404).json({ error: 'Withdrawal not found' });
    }

    const withdrawal = db.withdrawals[withdrawalIndex];

    // تحديث حالة الطلب
    withdrawal.status = 'completed';
    withdrawal.approvedAt = new Date().toISOString();
    if (adminNotes) withdrawal.adminNotes = adminNotes;

    // تقليل رصيد المستخدم
    const user = db.users[withdrawal.userId];
    if (user) {
      user.balance -= withdrawal.amount;
    }

    db.withdrawals[withdrawalIndex] = withdrawal;
    writeDb(db);

    res.json({
      success: true,
      withdrawal,
      message: 'تم الموافقة على السحب بنجاح',
    });
  } catch (error) {
    console.error('Approve withdrawal error:', error);
    res.status(500).json({ error: 'Failed to approve withdrawal' });
  }
});

// PATCH: رفض طلب السحب
router.patch('/:withdrawalId/reject', async (req: Request, res: Response) => {
  try {
    const { withdrawalId } = req.params;
    const { rejectionReason } = req.body;

    let db = readDb();
    const withdrawalIndex = db.withdrawals?.findIndex(
      (w: any) => w.id === withdrawalId
    );

    if (withdrawalIndex === -1 || withdrawalIndex === undefined) {
      return res.status(404).json({ error: 'Withdrawal not found' });
    }

    const withdrawal = db.withdrawals[withdrawalIndex];
    withdrawal.status = 'rejected';
    if (rejectionReason) withdrawal.rejectionReason = rejectionReason;

    db.withdrawals[withdrawalIndex] = withdrawal;
    writeDb(db);

    res.json({
      success: true,
      withdrawal,
      message: 'تم رفض طلب السحب',
    });
  } catch (error) {
    console.error('Reject withdrawal error:', error);
    res.status(500).json({ error: 'Failed to reject withdrawal' });
  }
});

export default router;
