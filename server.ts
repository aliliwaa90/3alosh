import express from 'express';
import { createServer as createViteServer } from 'vite';
import cors from 'cors';
import dotenv from 'dotenv';
import TelegramBot from 'node-telegram-bot-api';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { getMongoDb, isMongoConfigured } from './lib/mongodb';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

type UserRecord = Record<string, any>;
type UserDoc = UserRecord & { _id: string };

// --- Local JSON fallback database ---
const DB_FILE = path.join(__dirname, 'database.json');

// Initialize DB if not exists
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify({ users: {}, withdrawals: [] }, null, 2));
}

// Helper to read/write DB
const readDb = () => {
  try {
    const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    // Ensure withdrawals array exists
    if (!data.withdrawals) {
      data.withdrawals = [];
    }
    return data;
  } catch (e) {
    return { users: {}, withdrawals: [] };
  }
};

const writeDb = (data: any) => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing database file:', error);
    throw error;
  }
};

const normalizeUser = (doc: UserRecord): UserRecord => {
  const { _id, ...rest } = doc;
  return {
    ...rest,
    id: typeof rest.id === 'string' ? rest.id : String(_id || ''),
  };
};

const getUsersCollection = async () => {
  if (!isMongoConfigured()) return null;
  try {
    const db = await getMongoDb();
    return db?.collection<UserDoc>('users') || null;
  } catch (error) {
    console.error('MongoDB unavailable, falling back to database.json', error);
    return null;
  }
};

const listUsers = async (): Promise<UserRecord[]> => {
  const usersCollection = await getUsersCollection();
  if (usersCollection) {
    const docs = await usersCollection.find({}).toArray();
    return docs.map((doc) => normalizeUser(doc));
  }

  const db = readDb();
  return Object.values(db.users || {});
};

const normalizeChatId = (value: unknown): string | number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed || !/^-?\d+$/.test(trimmed)) {
      return null;
    }
    return trimmed;
  }

  return null;
};

const getBroadcastTargetIds = (users: UserRecord[]): Array<string | number> => {
  const results: Array<string | number> = [];
  const seen = new Set<string>();

  const add = (value: unknown) => {
    const normalized = normalizeChatId(value);
    if (normalized === null) return;
    const key = String(normalized);
    if (seen.has(key)) return;
    seen.add(key);
    results.push(normalized);
  };

  for (const user of users) {
    add(user.chatId);

    if (user.chatId === undefined || user.chatId === null || user.chatId === '') {
      add(user.id);
    }
  }

  return results;
};

const parseBase64Image = (imageData: string): { buffer: Buffer; mimeType: string } | null => {
  const normalized = imageData.replace(/\s+/g, '');
  const match = normalized.match(
    /^data:(image\/[a-zA-Z0-9.+-]+)(?:;[a-zA-Z0-9=._-]+)*;base64,([A-Za-z0-9+/=_-]+)$/,
  );
  if (!match) return null;

  try {
    const buffer = Buffer.from(match[2], 'base64');
    if (!buffer.length) return null;
    return { buffer, mimeType: match[1].toLowerCase() };
  } catch {
    return null;
  }
};

const getUserById = async (id: string): Promise<UserRecord | null> => {
  const usersCollection = await getUsersCollection();
  if (usersCollection) {
    const doc = await usersCollection.findOne({ _id: id });
    return doc ? normalizeUser(doc) : null;
  }

  const db = readDb();
  return db.users?.[id] || null;
};

const upsertUser = async (payload: UserRecord): Promise<UserRecord> => {
  const id = String(payload.id || '').trim();
  if (!id) {
    throw new Error('User ID is required');
  }

  const usersCollection = await getUsersCollection();
  if (usersCollection) {
    const existing = await usersCollection.findOne({ _id: id });
    const nowIso = new Date().toISOString();
    const merged: UserRecord = {
      ...(existing || {}),
      ...payload,
      id,
      createdAt: existing?.createdAt || nowIso,
      updatedAt: nowIso,
    };
    delete merged._id;

    await usersCollection.updateOne(
      { _id: id },
      { $set: merged },
      { upsert: true },
    );

    const saved = await usersCollection.findOne({ _id: id });
    return saved ? normalizeUser(saved) : { ...merged, id };
  }

  const db = readDb();
  db.users = db.users || {};
  if (db.users[id]) {
    db.users[id] = { ...db.users[id], ...payload, id };
  } else {
    db.users[id] = { ...payload, id };
  }
  writeDb(db);
  return db.users[id];
};

const upsertUserChat = async (userId: string, name: string, chatId: number) => {
  const usersCollection = await getUsersCollection();
  if (usersCollection) {
    const existing = await usersCollection.findOne({ _id: userId });
    const nowIso = new Date().toISOString();
    const payload: UserRecord = {
      ...(existing || {}),
      id: userId,
      name: existing?.name || name || 'User',
      balance: typeof existing?.balance === 'number' ? existing.balance : 0,
      chatId,
      createdAt: existing?.createdAt || nowIso,
      updatedAt: nowIso,
      lastSeenAt: nowIso,
    };
    delete payload._id;

    await usersCollection.updateOne(
      { _id: userId },
      { $set: payload },
      { upsert: true },
    );
    return;
  }

  const db = readDb();
  db.users = db.users || {};
  if (!db.users[userId]) {
    db.users[userId] = { id: userId, name: name || 'User', balance: 0, chatId };
  } else {
    db.users[userId].chatId = chatId;
  }
  writeDb(db);
};

// --- Telegram Bot Setup ---
const token = process.env.TELEGRAM_BOT_TOKEN;
let bot: TelegramBot | null = null;

if (token) {
  bot = new TelegramBot(token, { polling: true });

  bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from?.id.toString();

    // Save chatId to database (MongoDB if configured, else JSON fallback)
    if (userId) {
      await upsertUserChat(userId, msg.from?.first_name || 'User', chatId);
    }

    if (msg.text === '/start' || msg.text === '/admin') {
      // Ensure we use the Shared (Public) URL to avoid Google Login
      let appUrl =
        process.env.APP_URL ||
        'https://ais-pre-znsgqh4tsbyfzn57eqevi2-11499289001.europe-west2.run.app';

      // Auto-fix: If the URL is the dev environment (authenticated), switch to pre (shared/public)
      if (appUrl.includes('ais-dev-')) {
        appUrl = appUrl.replace('ais-dev-', 'ais-pre-');
      }

      const firstName = (msg.from?.first_name || '').trim() || 'صديقي';
      const channelUrl = (process.env.TELEGRAM_CHANNEL_URL || 'https://t.me/Tleker').trim() || 'https://t.me/Tleker';
      bot?.sendMessage(
        chatId,
        `أهلًا ${firstName} في TOMi 🌟\n\nاضغط زر البدء بالأسفل للدخول إلى التطبيق.`,
        {
          reply_markup: {
            inline_keyboard: [[
              { text: 'ابدأ الآن 🚀', web_app: { url: appUrl } },
              { text: 'قناة تيليجرام 📣', url: channelUrl },
            ]],
          },
        },
      );
    }
  });
  
  console.log('Telegram Bot started in polling mode');
} else {
  console.log('TELEGRAM_BOT_TOKEN not set, bot features disabled');
}

// --- API Routes ---

// Broadcast API
app.post('/api/admin/broadcast', async (req, res) => {
  const message = String(req.body?.message || '').trim();
  const imageData = typeof req.body?.imageData === 'string' ? req.body.imageData.trim() : '';
  if ((!message && !imageData) || !bot) {
    return res.status(400).json({ error: 'Message or image required, and bot must be active' });
  }

  const users = await listUsers();
  const targetChatIds = getBroadcastTargetIds(users);
  let sentCount = 0;
  let failedCount = 0;

  for (const chatId of targetChatIds) {
    try {
      if (imageData) {
        if (/^https?:\/\//i.test(imageData)) {
          await bot.sendPhoto(chatId, imageData, message ? { caption: message.slice(0, 1024) } : undefined);
        } else {
          const parsedImage = parseBase64Image(imageData);
          if (!parsedImage) {
            failedCount++;
            continue;
          }
          await bot.sendPhoto(chatId, parsedImage.buffer, {
            caption: message ? message.slice(0, 1024) : undefined,
            filename: 'broadcast-image',
            contentType: parsedImage.mimeType,
          });
        }
      } else {
        await bot.sendMessage(chatId, message);
      }
      sentCount++;
    } catch (e) {
      failedCount++;
      console.error(`Failed to send to ${chatId}`, e);
    }
  }

  res.json({
    success: true,
    sentCount,
    failedCount,
    totalUsersWithChatId: targetChatIds.length,
    mode: imageData ? 'photo' : 'text',
  });
});

// Get User Data
app.get('/api/user/:id', async (req, res) => {
  const { id } = req.params;
  const user = await getUserById(id);
  
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const includeReferrals = ['1', 'true', 'yes'].includes(
    String(req.query.includeReferrals || '').toLowerCase(),
  );
  if (!includeReferrals) {
    res.json(user);
    return;
  }

  const requestedLimit = Number(req.query.limit || 100);
  const limit = Number.isFinite(requestedLimit)
    ? Math.max(1, Math.min(200, Math.floor(requestedLimit)))
    : 100;

  const users = await listUsers();
  const allReferrals = users
    .filter((u) => String(u.referredBy || '') === id)
    .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
  const referrals = allReferrals
    .slice(0, limit)
    .map((u) => ({
      id: String(u.id || ''),
      name: String(u.name || 'User'),
      username: String(u.username || ''),
      photo_url: String(u.photo_url || ''),
      joinDate: String(
        u.joinDate ||
          (u.createdAt ? new Date(String(u.createdAt)).toLocaleDateString('en-US') : ''),
      ),
      createdAt: String(u.createdAt || ''),
    }));

  res.json({
    ...user,
    referrals,
    referralsCount: allReferrals.length,
    referralsReturned: referrals.length,
  });
});

// Create or Update User
app.post('/api/user', async (req, res) => {
  const userData = req.body;
  if (!userData.id) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    const user = await upsertUser(userData);
    res.json({ success: true, user });
  } catch {
    res.status(500).json({ error: 'Failed to save user' });
  }
});

// Validate Telegram Web App Data
app.post('/api/auth/telegram', (req, res) => {
  const { initData } = req.body;
  // In a real app, validate the hash here using the bot token
  // For now, we'll just acknowledge it
  if (!initData) {
    return res.status(400).json({ error: 'No initData provided' });
  }
  res.json({ status: 'ok', message: 'Validated' });
});

// Get Leaderboard
app.get('/api/leaderboard', async (_req, res) => {
  const users = await listUsers();
  
  // Sort by balance descending and take top 20
  const leaderboard = users
    .sort((a, b) => Number(b.balance || 0) - Number(a.balance || 0))
    .slice(0, 20)
    .map(u => ({
      id: u.id,
      name: u.name,
      balance: Number(u.balance || 0),
      photo_url: u.photo_url // If available
    }));
    
  res.json(leaderboard);
});

// Admin API (Protected by simple secret or session in real app)
app.get('/api/admin/stats', async (_req, res) => {
  const users = await listUsers();
  const db = readDb();
  const withdrawals = db.withdrawals || [];
  
  res.json({
    totalUsers: users.length,
    activeUsers: users.length,
    revenue: 0,
    pendingWithdrawals: withdrawals.filter((w: any) => w.status === 'pending').length
  });
});

// --- Withdrawal API Routes ---
const CONVERSION_RATE = 1; // 1 Tliker = 1 IQD

// POST: إنشاء طلب سحب جديد
app.post('/api/withdrawals/request', async (req: express.Request, res: express.Response) => {
  try {
    const { userId, amount, method, bankAccount } = req.body;

    if (!userId || !amount || !method || !bankAccount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const validMethods = ['zain-cash', 'k-card', 'fib', 'okx', 'binance'];
    if (!validMethods.includes(method)) {
      return res.status(400).json({ error: 'Invalid payment method' });
    }

    if (amount < 10000) {
      return res.status(400).json({ error: 'الحد الأدنى للسحب هو 10,000 دينار عراقي' });
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
      iqdAmount: Math.floor(amount * CONVERSION_RATE),
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

    try {
      writeDb(db);
    } catch (writeError) {
      console.error('Error writing to database:', writeError);
      return res.status(500).json({ error: 'خطأ في حفظ طلب السحب' });
    }

    res.json({
      success: true,
      withdrawal,
      message: 'تم إرسال طلب السحب بنجاح، جاري المراجعة',
    });
  } catch (error) {
    console.error('Withdrawal request error:', error);
    res.status(500).json({ error: 'حدث خطأ في معالجة طلب السحب' });
  }
});

// GET: طلبات السحب الخاصة بالمستخدم
app.get('/api/withdrawals/user/:userId', async (req: express.Request, res: express.Response) => {
  try {
    const { userId } = req.params;
    const db = readDb();

    const userWithdrawals = (db.withdrawals || []).filter(
      (w: any) => w.userId === userId
    ).sort((a: any, b: any) => b.timestamp - a.timestamp);

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
app.get('/api/admin/withdrawals/all', async (_req: express.Request, res: express.Response) => {
  try {
    const db = readDb();
    const withdrawals = (db.withdrawals || []).sort(
      (a: any, b: any) => b.timestamp - a.timestamp
    );

    res.json({
      success: true,
      withdrawals,
      total: withdrawals.length,
      pending: withdrawals.filter((w: any) => w.status === 'pending').length,
      completed: withdrawals.filter((w: any) => w.status === 'completed').length,
      rejected: withdrawals.filter((w: any) => w.status === 'rejected').length,
    });
  } catch (error) {
    console.error('Get all withdrawals error:', error);
    res.status(500).json({ error: 'Failed to fetch withdrawals' });
  }
});

// PATCH: الموافقة على طلب السحب
app.patch('/api/admin/withdrawals/:withdrawalId/approve', async (req: express.Request, res: express.Response) => {
  try {
    const { withdrawalId } = req.params;
    const { adminNotes } = req.body;

    let db = readDb();
    const withdrawalIndex = (db.withdrawals || []).findIndex(
      (w: any) => w.id === withdrawalId
    );

    if (withdrawalIndex === -1) {
      return res.status(404).json({ error: 'Withdrawal not found' });
    }

    const withdrawal = db.withdrawals[withdrawalIndex];

    withdrawal.status = 'completed';
    withdrawal.approvedAt = new Date().toISOString();
    if (adminNotes) withdrawal.adminNotes = adminNotes;

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
app.patch('/api/admin/withdrawals/:withdrawalId/reject', async (req: express.Request, res: express.Response) => {
  try {
    const { withdrawalId } = req.params;
    const { rejectionReason } = req.body;

    let db = readDb();
    const withdrawalIndex = (db.withdrawals || []).findIndex(
      (w: any) => w.id === withdrawalId
    );

    if (withdrawalIndex === -1) {
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

// --- Vite Middleware (Dev) or Static Files (Prod) ---
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files from dist
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

