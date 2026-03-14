import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getMongoDb } from '../../lib/mongodb.js';
import { jsonBody, methodNotAllowed } from '../../lib/http.js';

interface IncomingUser {
  id?: string;
  startParam?: string;
  [key: string]: unknown;
}

type UserDoc = Record<string, any> & { _id: string };

const sanitizeUser = (doc: UserDoc | null): Record<string, unknown> | null => {
  if (!doc) return null;
  const { _id: objectId, ...output } = doc;
  output.id = typeof output.id === 'string' ? output.id : String(objectId || '');
  return output;
};

const parseReferralUserId = (startParam: string): string | null => {
  if (!startParam) return null;
  const raw = startParam.startsWith('ref_') ? startParam.slice(4) : startParam;
  if (!/^\d{3,32}$/.test(raw)) return null;
  return raw;
};

const DEFAULT_REFERRAL_REWARD_POINTS = 1000;

const getReferralRewardPoints = (): number => {
  const raw = String(
    process.env.REFERRAL_REWARD_POINTS ||
      process.env.REFERRAL_REWARD ||
      DEFAULT_REFERRAL_REWARD_POINTS,
  ).trim();
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return DEFAULT_REFERRAL_REWARD_POINTS;
  return Math.max(0, Math.floor(parsed));
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
    const startParam = typeof payload.startParam === 'string' ? payload.startParam.trim() : '';
    const referrerId = parseReferralUserId(startParam);
    const { startParam: _ignoredStartParam, ...safePayload } = payload;

    const merged: Record<string, unknown> = {
      ...(existing || {}),
      ...safePayload,
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

    let referralApplied = false;
    if (referrerId && referrerId !== id) {
      const referrer = await users.findOne({ _id: referrerId }, { projection: { _id: 1 } });
      if (referrer) {
        const referralRewardPoints = getReferralRewardPoints();
        const setReferral = await users.updateOne(
          {
            _id: id,
            $or: [{ referredBy: { $exists: false } }, { referredBy: null }, { referredBy: '' }],
          },
          {
            $set: {
              referredBy: referrerId,
              updatedAt: nowIso,
            },
          },
        );

        if (setReferral.modifiedCount > 0) {
          referralApplied = true;
          const incFields: Record<string, number> = {
            referrals: 1,
            referralRewardClaimedCount: 1,
          };
          if (referralRewardPoints > 0) {
            incFields.balance = referralRewardPoints;
          }
          await users.updateOne(
            { _id: referrerId } as any,
            {
              $inc: incFields,
              $set: { updatedAt: nowIso },
            } as any,
          );
        }
      }
    }

    const saved = await users.findOne({ _id: id });
    res.status(200).json({
      success: true,
      user: sanitizeUser(saved),
      referralApplied,
    });
  } catch (error) {
    console.error('POST /api/user failed', error);
    res.status(500).json({ error: 'Failed to save user' });
  }
}
