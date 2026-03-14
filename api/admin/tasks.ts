import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAdminToken } from '../../lib/adminAuth.js';
import { getMongoDb } from '../../lib/mongodb.js';
import { jsonBody, methodNotAllowed } from '../../lib/http.js';
import { isValidTaskId, normalizeTask, normalizeTaskDoc } from '../../lib/catalogData.js';

type TaskDoc = Record<string, unknown> & { _id: string };

const randomSuffix = (): string => Math.random().toString(36).slice(2, 8);

const getIdFromQuery = (req: VercelRequest): string => {
  const raw = req.query.id;
  if (Array.isArray(raw)) return (raw[0] || '').trim();
  return (raw || '').trim();
};

const getTaskId = (req: VercelRequest, body: Record<string, unknown>): string => {
  const fromQuery = getIdFromQuery(req);
  if (fromQuery) return fromQuery;
  return typeof body.id === 'string' ? body.id.trim() : '';
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST' && req.method !== 'DELETE') {
    methodNotAllowed(res, ['POST', 'DELETE']);
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

  const tasks = db.collection<TaskDoc>('tasks');
  const body = jsonBody<Record<string, unknown>>(req);

  try {
    if (req.method === 'POST') {
      const rawId = typeof body.id === 'string' ? body.id.trim() : '';
      const taskId = rawId || `t_${Date.now()}_${randomSuffix()}`;

      const normalized = normalizeTask({ ...body, id: taskId }, taskId);
      if (!normalized) {
        res.status(400).json({ error: 'Invalid task payload' });
        return;
      }

      const exists = await tasks.findOne({ _id: taskId }, { projection: { _id: 1 } });
      if (exists) {
        res.status(409).json({ error: 'Task ID already exists' });
        return;
      }

      const nowIso = new Date().toISOString();
      await tasks.insertOne({
        _id: taskId,
        ...normalized,
        createdAt: nowIso,
        updatedAt: nowIso,
      });

      const saved = await tasks.findOne({ _id: taskId });
      const task = normalizeTaskDoc(saved);
      if (!task) {
        res.status(500).json({ error: 'Failed to normalize saved task' });
        return;
      }

      res.status(201).json({ success: true, task });
      return;
    }

    const taskId = getTaskId(req, body);
    if (!isValidTaskId(taskId)) {
      res.status(400).json({ error: 'Invalid task ID' });
      return;
    }

    const deleted = await tasks.deleteOne({ _id: taskId });
    if (!deleted.deletedCount) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    await db.collection<Record<string, unknown>>('users').updateMany(
      {},
      ({
        $pull: { completedTaskIds: taskId },
        $set: { updatedAt: new Date().toISOString() },
      } as any),
    );

    res.status(200).json({ success: true });
  } catch (error) {
    console.error(`${req.method} /api/admin/tasks failed`, error);
    res.status(500).json({ error: 'Failed to process task request' });
  }
}
