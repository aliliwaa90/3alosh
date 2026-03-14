export interface CatalogProduct {
  id: string;
  name: string;
  description: string;
  pricePoints: number;
  priceStars: number;
  imageData?: string;
  isFree: boolean;
  category: string;
  earningRate: number;
  allowPoints: boolean;
  allowStars: boolean;
}

export interface CatalogTask {
  id: string;
  title: string;
  reward: number;
  type: 'social' | 'ad' | 'daily';
  link?: string;
}

type AnyRecord = Record<string, unknown>;

const PRODUCT_ID_PATTERN = /^[a-zA-Z0-9_-]{1,120}$/;
const TASK_ID_PATTERN = /^[a-zA-Z0-9_-]{1,120}$/;

const DEFAULT_PRODUCT_IMAGE =
  'https://images.unsplash.com/photo-1624365169344-933e4b3734e0?w=300';

export const DEFAULT_PRODUCTS: CatalogProduct[] = [
  {
    id: 'p1',
    name: 'Basic Miner',
    description: 'Earns 0.5 points/sec',
    pricePoints: 10000,
    priceStars: 50,
    imageData: DEFAULT_PRODUCT_IMAGE,
    isFree: false,
    category: 'mining',
    earningRate: 0.5,
    allowPoints: true,
    allowStars: true,
  },
];

export const DEFAULT_TASKS: CatalogTask[] = [
  {
    id: 't1',
    title: 'Follow Channel',
    reward: 5000,
    type: 'social',
    link: 'https://t.me/TlikerChannel',
  },
];

const safeText = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

const toNumber = (value: unknown, fallback = 0): number => {
  const numberValue = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numberValue)) return fallback;
  return numberValue;
};

const toNonNegative = (value: unknown, fallback = 0): number => {
  const n = toNumber(value, fallback);
  if (n < 0) return 0;
  return n;
};

const toPositiveInt = (value: unknown, fallback = 0): number => {
  const n = Math.floor(toNumber(value, fallback));
  if (!Number.isFinite(n) || n <= 0) return 0;
  return n;
};

const toBoolean = (value: unknown, fallback: boolean): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true' || normalized === '1' || normalized === 'yes') return true;
    if (normalized === 'false' || normalized === '0' || normalized === 'no') return false;
  }
  return fallback;
};

const normalizeImage = (value: unknown): string | undefined => {
  const text = safeText(value);
  if (!text) return undefined;

  if (/^https?:\/\//i.test(text)) return text;
  if (/^data:image\/[a-zA-Z0-9.+-]+(?:;[a-zA-Z0-9=._-]+)*;base64,[A-Za-z0-9+/=_-]+$/.test(text)) {
    return text;
  }
  return undefined;
};

export const isValidProductId = (id: string): boolean => PRODUCT_ID_PATTERN.test(id);
export const isValidTaskId = (id: string): boolean => TASK_ID_PATTERN.test(id);

export const normalizeProduct = (
  input: AnyRecord,
  forcedId?: string,
): CatalogProduct | null => {
  const id = (forcedId || safeText(input.id)).trim();
  if (!isValidProductId(id)) return null;

  const name = safeText(input.name).slice(0, 80);
  if (!name) return null;

  const description = safeText(input.description).slice(0, 300) || 'Digital product';
  const pricePoints = Math.floor(toNonNegative(input.pricePoints, 0));
  const priceStars = toPositiveInt(input.priceStars, 0);
  const earningRate = Number(toNonNegative(input.earningRate, 0).toFixed(4));

  const categoryRaw = safeText(input.category).toLowerCase();
  const category = categoryRaw || 'mining';

  const isFree = toBoolean(input.isFree, false);
  const allowPoints = toBoolean(input.allowPoints, pricePoints > 0);
  const allowStars = toBoolean(input.allowStars, priceStars > 0);
  const imageData = normalizeImage(input.imageData) || DEFAULT_PRODUCT_IMAGE;

  return {
    id,
    name,
    description,
    pricePoints,
    priceStars,
    imageData,
    isFree,
    category,
    earningRate,
    allowPoints,
    allowStars,
  };
};

export const normalizeTask = (input: AnyRecord, forcedId?: string): CatalogTask | null => {
  const id = (forcedId || safeText(input.id)).trim();
  if (!isValidTaskId(id)) return null;

  const title = safeText(input.title).slice(0, 120);
  if (!title) return null;

  const reward = Math.floor(toNonNegative(input.reward, 0));
  if (reward <= 0) return null;

  const inputType = safeText(input.type).toLowerCase();
  const type: CatalogTask['type'] =
    inputType === 'ad' || inputType === 'daily' || inputType === 'social'
      ? inputType
      : 'social';

  const link = safeText(input.link).slice(0, 400);

  return {
    id,
    title,
    reward,
    type,
    ...(link ? { link } : {}),
  };
};

export const normalizeProductDoc = (
  doc: (AnyRecord & { _id?: string }) | null,
): CatalogProduct | null => {
  if (!doc) return null;
  const id = safeText(doc._id || doc.id);
  return normalizeProduct({ ...doc, id }, id);
};

export const normalizeTaskDoc = (
  doc: (AnyRecord & { _id?: string }) | null,
): CatalogTask | null => {
  if (!doc) return null;
  const id = safeText(doc._id || doc.id);
  return normalizeTask({ ...doc, id }, id);
};
