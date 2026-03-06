import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  createAdminToken,
  getAdminTokenTtlSeconds,
  isAdminPasswordConfigured,
  isAdminPasswordValid,
  isAdminUserAllowed,
} from '../../lib/adminAuth.js';
import { jsonBody, methodNotAllowed } from '../../lib/http.js';

interface LoginBody {
  password?: string;
  userId?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    methodNotAllowed(res, ['POST']);
    return;
  }

  if (!isAdminPasswordConfigured()) {
    res.status(500).json({ error: 'ADMIN_PASSWORD is not configured on the server' });
    return;
  }

  const body = jsonBody<LoginBody>(req);
  const password = (body.password || '').trim();
  const userId = (body.userId || '').trim() || undefined;

  if (!password) {
    res.status(400).json({ error: 'Password is required' });
    return;
  }

  if (!isAdminPasswordValid(password)) {
    res.status(401).json({ error: 'Invalid admin password' });
    return;
  }

  if (!isAdminUserAllowed(userId)) {
    res.status(403).json({ error: 'This Telegram user is not allowed as admin' });
    return;
  }

  const token = createAdminToken(userId);
  if (!token) {
    res.status(500).json({ error: 'Unable to create admin token' });
    return;
  }

  res.status(200).json({
    success: true,
    token,
    expiresIn: getAdminTokenTtlSeconds(),
  });
}
