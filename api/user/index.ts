import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getMongoDb } from '../../lib/mongodb.js';
import { jsonBody, methodNotAllowed } from '../../lib/http.js';

interface IncomingUser {
  id?: string;
  [key: string]: unknown;
}

type UserDoc = Record<string, unknown> & { _id: string };

const sanitizeUser = (doc: UserDoc | null): Record<string, unknown> | null => {
  if (!doc) return null;
  const { _id: objectId, ...output } = doc;
  output.id = typeof output.id === 'string' ? output.id : String(objectId || '');
  return output;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    methodNotAllowed(res, ['POST']);
    return;
  }

  const db = await getMongoDb();
  if (!db) {
    res.status(500).json({ error: 'Database is not configured' });
    return;
  }

  const payload = jsonBody<IncomingUser>(req);
  const id = typeof payload.id === 'string' ? payload.id.trim() : '';
  if (!id) {
    res.status(400).json({ error: 'User ID is required' });
    return;
  }

  try {
    const users = db.collection<UserDoc>('users');
    const existing = await users.findOne({ _id: id });
    const nowIso = new Date().toISOString();

    const merged: Record<string, unknown> = {
      ...(existing || {}),
      ...payload,
      id,
      updatedAt: nowIso,
      createdAt: (existing?.createdAt as string | undefined) || nowIso,
    };

    delete merged._id;

    await users.updateOne(
      { _id: id },
      { $set: merged },
      { upsert: true },
    );

    const saved = await users.findOne({ _id: id });
    res.status(200).json({ success: true, user: sanitizeUser(saved) });
  } catch (error) {
    console.error('POST /api/user failed', error);
    res.status(500).json({ error: 'Failed to save user' });
  }
}
