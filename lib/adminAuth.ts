import crypto from 'crypto';

export interface AdminTokenPayload {
  userId: string | null;
  iat: number;
  exp: number;
}

const TOKEN_TTL_SECONDS = 60 * 60 * 12;

const getAdminPassword = (): string => (process.env.ADMIN_PASSWORD || '').trim();
const getAdminSecret = (): string => (process.env.ADMIN_SECRET || getAdminPassword() || '').trim();

const safeCompare = (a: string, b: string): boolean => {
  if (!a || !b) return false;
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
};

const sign = (encodedPayload: string, secret: string): string =>
  crypto.createHmac('sha256', secret).update(encodedPayload).digest('base64url');

const parseBearerToken = (authHeader?: string | null): string | null => {
  if (!authHeader) return null;
  const [scheme, token] = authHeader.trim().split(' ');
  if (!scheme || !token) return null;
  if (scheme.toLowerCase() !== 'bearer') return null;
  return token.trim();
};

export const isAdminPasswordConfigured = (): boolean => Boolean(getAdminPassword());

export const isAdminPasswordValid = (input: string): boolean => {
  const expected = getAdminPassword();
  return safeCompare(input.trim(), expected);
};

export const isAdminUserAllowed = (userId?: string): boolean => {
  const rawList = (process.env.ADMIN_USER_IDS || '').trim();
  if (!rawList) return true;
  if (!userId) return false;
  const allowedIds = rawList
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  return allowedIds.includes(userId);
};

export const createAdminToken = (userId?: string): string | null => {
  const secret = getAdminSecret();
  if (!secret) return null;

  const now = Math.floor(Date.now() / 1000);
  const payload: AdminTokenPayload = {
    userId: userId || null,
    iat: now,
    exp: now + TOKEN_TTL_SECONDS,
  };

  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = sign(encodedPayload, secret);
  return `${encodedPayload}.${signature}`;
};

export const verifyAdminToken = (authHeader?: string | null): AdminTokenPayload | null => {
  const token = parseBearerToken(authHeader);
  const secret = getAdminSecret();
  if (!token || !secret) return null;

  const [encodedPayload, signature] = token.split('.');
  if (!encodedPayload || !signature) return null;

  const expectedSignature = sign(encodedPayload, secret);
  if (!safeCompare(signature, expectedSignature)) return null;

  try {
    const json = Buffer.from(encodedPayload, 'base64url').toString('utf-8');
    const payload = JSON.parse(json) as Partial<AdminTokenPayload>;
    if (typeof payload.exp !== 'number' || typeof payload.iat !== 'number') return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return {
      userId: typeof payload.userId === 'string' ? payload.userId : null,
      iat: payload.iat,
      exp: payload.exp,
    };
  } catch {
    return null;
  }
};

export const getAdminTokenTtlSeconds = (): number => TOKEN_TTL_SECONDS;
