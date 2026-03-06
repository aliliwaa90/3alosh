import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getMongoDb } from '../../lib/mongodb.js';
import { methodNotAllowed } from '../../lib/http.js';

type UserDoc = Record<string, unknown> & { _id: string };

const sanitizeUser = (doc: UserDoc): Record<string, unknown> => {
  const { _id: objectId, ...output } = doc;
  output.id = typeof output.id === 'string' ? output.id : String(objectId || '');
  return output;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    methodNotAllowed(res, ['GET']);
    return;
  }

  const idParam = req.query.id;
  const id = Array.isArray(idParam) ? idParam[0] : idParam;
  if (!id) {
    res.status(400).json({ error: 'User ID is required' });
    return;
  }

  const db = await getMongoDb();
  if (!db) {
    res.status(500).json({ error: 'Database is not configured' });
    return;
  }

  try {
    const users = db.collection<UserDoc>('users');
    const user = await users.findOne({ _id: id });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.status(200).json(sanitizeUser(user));
  } catch (error) {
    console.error('GET /api/user/:id failed', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
}
