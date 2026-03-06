import { Db, MongoClient } from 'mongodb';

const uri = (process.env.MONGODB_URI || '').trim();
const explicitDbName = (process.env.MONGODB_DB || '').trim();

const parseDbNameFromUri = (value: string): string => {
  try {
    const pathname = new URL(value).pathname.replace(/^\/+/, '');
    return pathname || 'tliker';
  } catch {
    return 'tliker';
  }
};

const getDbName = (): string => explicitDbName || parseDbNameFromUri(uri);

declare global {
  // eslint-disable-next-line no-var
  var __mongoClientPromise: Promise<MongoClient> | undefined;
}

const createClientPromise = (): Promise<MongoClient> => {
  const client = new MongoClient(uri);
  return client.connect();
};

export const isMongoConfigured = (): boolean => Boolean(uri);

export const getMongoClient = async (): Promise<MongoClient | null> => {
  if (!uri) return null;

  if (!global.__mongoClientPromise) {
    global.__mongoClientPromise = createClientPromise();
  }

  return global.__mongoClientPromise;
};

export const getMongoDb = async (): Promise<Db | null> => {
  const client = await getMongoClient();
  if (!client) return null;
  return client.db(getDbName());
};
