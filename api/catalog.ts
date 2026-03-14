import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { Collection } from 'mongodb';
import { getMongoDb } from '../lib/mongodb.js';
import { methodNotAllowed } from '../lib/http.js';
import {
  DEFAULT_PRODUCTS,
  DEFAULT_TASKS,
  normalizeProductDoc,
  normalizeTaskDoc,
} from '../lib/catalogData.js';

type AppMetaDoc = {
  _id: string;
  seededAt: string;
};

type MongoRow = Record<string, unknown> & { _id: string };

const CATALOG_SEED_KEY = 'catalog_seed_v1';

const seedCatalogIfNeeded = async (
  products: Collection<MongoRow>,
  tasks: Collection<MongoRow>,
  appMeta: Collection<AppMetaDoc>,
): Promise<void> => {
  const seeded = await appMeta.findOne({ _id: CATALOG_SEED_KEY });
  if (seeded) return;

  const [productCount, taskCount] = await Promise.all([
    products.countDocuments({}),
    tasks.countDocuments({}),
  ]);

  const nowIso = new Date().toISOString();

  if (productCount === 0) {
    await products.insertMany(
      DEFAULT_PRODUCTS.map((item) => ({
        _id: item.id,
        ...item,
        createdAt: nowIso,
        updatedAt: nowIso,
      })),
    );
  }

  if (taskCount === 0) {
    await tasks.insertMany(
      DEFAULT_TASKS.map((item) => ({
        _id: item.id,
        ...item,
        createdAt: nowIso,
        updatedAt: nowIso,
      })),
    );
  }

  await appMeta.updateOne(
    { _id: CATALOG_SEED_KEY },
    {
      $set: {
        seededAt: nowIso,
      },
    },
    { upsert: true },
  );
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    methodNotAllowed(res, ['GET']);
    return;
  }

  const db = await getMongoDb();
  if (!db) {
    res.status(500).json({ error: 'Database is not configured' });
    return;
  }

  try {
    const products = db.collection<MongoRow>('products');
    const tasks = db.collection<MongoRow>('tasks');
    const appMeta = db.collection<AppMetaDoc>('appMeta');

    await seedCatalogIfNeeded(products, tasks, appMeta);

    const [productDocs, taskDocs] = await Promise.all([
      products.find({}).sort({ createdAt: 1, _id: 1 }).toArray(),
      tasks.find({}).sort({ createdAt: 1, _id: 1 }).toArray(),
    ]);

    const productList = productDocs
      .map((doc) => normalizeProductDoc(doc))
      .filter((item): item is NonNullable<typeof item> => Boolean(item));

    const taskList = taskDocs
      .map((doc) => normalizeTaskDoc(doc))
      .filter((item): item is NonNullable<typeof item> => Boolean(item));

    res.status(200).json({
      products: productList,
      tasks: taskList,
    });
  } catch (error) {
    console.error('GET /api/catalog failed', error);
    res.status(500).json({ error: 'Failed to load catalog' });
  }
}
