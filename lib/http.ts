import type { VercelRequest, VercelResponse } from '@vercel/node';

export const jsonBody = <T = Record<string, unknown>>(req: VercelRequest): T => {
  if (!req.body) return {} as T;
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body) as T;
    } catch {
      return {} as T;
    }
  }
  return req.body as T;
};

export const methodNotAllowed = (res: VercelResponse, allowed: string[]): void => {
  res.setHeader('Allow', allowed.join(', '));
  res.status(405).json({ error: `Method not allowed. Use ${allowed.join(', ')}` });
};
