import { Db, MongoClient } from 'mongodb';

const cleanEnvValue = (value: string | undefined): string => {
  if (!value) return '';
  const trimmed = value.trim();
  // Handle values accidentally pasted with quotes in dashboard env settings.
  return trimmed.replace(/^['"]|['"]$/g, '').trim();
};

const firstNonEmpty = (...values: Array<string | undefined>): string => {
  for (const value of values) {
    const cleaned = cleanEnvValue(value);
    if (cleaned) return cleaned;
  }
  return '';
};

const uri = firstNonEmpty(
  process.env.MONGODB_URI,
  process.env.MONGO_URI,
  process.env.MONGODB_URL,
  process.env.MONGO_URL,
  process.env.DATABASE_URL,
);

const explicitDbName = firstNonEmpty(
  process.env.MONGODB_DB,
  process.env.MONGO_DB,
  process.env.MONGO_DB_NAME,
  process.env.DATABASE_NAME,
);

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
  const client = new MongoClient(uri, {
    // Keep serverless functions responsive if Mongo is unavailable.
    serverSelectionTimeoutMS: 3000,
    connectTimeoutMS: 3000,
    socketTimeoutMS: 10000,
  });

  return client.connect();
};

export const isMongoConfigured = (): boolean => {
  const hasUri = Boolean(uri);
  if (!hasUri) console.log('MongoDB: No URI found in environment variables');
  return hasUri;
};

export const getMongoClient = async (): Promise<MongoClient | null> => {
  if (!uri) return null;

  if (!global.__mongoClientPromise) {
    console.log('MongoDB: Starting new connection attempt...');
    global.__mongoClientPromise = createClientPromise();
  }

  try {
    const client = await global.__mongoClientPromise;
    console.log('MongoDB: Connection established successfully');
    return client;
  } catch (error) {
    // Reset cached promise after connection failure so next call can retry.
    global.__mongoClientPromise = undefined;
    console.error('MongoDB: Final connection failure:', error);
    return null;
  }
};

export const getMongoDb = async (): Promise<Db | null> => {
  const client = await getMongoClient();
  if (!client) return null;
  return client.db(getDbName());
};
