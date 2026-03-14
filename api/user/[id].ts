import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getMongoDb } from '../../lib/mongodb.js';
import { methodNotAllowed } from '../../lib/http.js';

type UserDoc = Record<string, any> & { _id: string };
type StarPaymentDoc = {
  _id: string;
  userId: string;
  productId: string;
  payload: string;
  amount: number;
  currency: string;
  createdAt: string;
};

const sanitizeUser = (doc: UserDoc): Record<string, unknown> => {
  const { _id: objectId, ...output } = doc;
  output.id = typeof output.id === 'string' ? output.id : String(objectId || '');
  return output;
};

const toReferralRow = (doc: UserDoc) => ({
  id: typeof doc.id === 'string' && doc.id ? doc.id : doc._id,
  name: typeof doc.name === 'string' && doc.name ? doc.name : 'User',
  username: typeof doc.username === 'string' ? doc.username : '',
  photo_url: typeof doc.photo_url === 'string' ? doc.photo_url : '',
  joinDate:
    typeof doc.joinDate === 'string' && doc.joinDate
      ? doc.joinDate
      : typeof doc.createdAt === 'string' && doc.createdAt
        ? new Date(doc.createdAt).toLocaleDateString('en-US')
        : '',
  createdAt: typeof doc.createdAt === 'string' ? doc.createdAt : '',
});

const isTruthyQuery = (value: unknown): boolean => {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== 'string') return false;
  const normalized = raw.trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes';
};

const parseLimit = (value: unknown): number => {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number(raw || 100);
  if (!Number.isFinite(parsed)) return 100;
  return Math.max(1, Math.min(200, Math.floor(parsed)));
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

const toSafeInteger = (value: unknown): number => {
  const n = typeof value === 'number' ? value : Number(value || 0);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.floor(n));
};

const isValidProductId = (value: string): boolean => /^[a-zA-Z0-9_-]{1,120}$/.test(value);

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

    let effectiveUser = user;
    const syncPurchases = isTruthyQuery(req.query.syncPurchases);
    if (syncPurchases) {
      const payments = db.collection<StarPaymentDoc>('starPayments');
      const paidRaw = await payments.distinct('productId', { userId: id });
      const paidProductIds = paidRaw
        .map((value) => (typeof value === 'string' ? value.trim() : ''))
        .filter((value) => isValidProductId(value));
      const ownedProducts = Array.isArray(user.ownedProducts)
        ? user.ownedProducts.map((value: unknown) => String(value))
        : [];
      const ownedSet = new Set(ownedProducts);
      const missingOwnedProducts = paidProductIds.filter((productId) => !ownedSet.has(productId));

      if (missingOwnedProducts.length > 0) {
        await users.updateOne(
          { _id: id },
          {
            $addToSet: { ownedProducts: { $each: missingOwnedProducts } },
            $set: { updatedAt: new Date().toISOString() },
          } as any,
        );

        const refreshed = await users.findOne({ _id: id });
        if (refreshed) {
          effectiveUser = refreshed;
        }
      }
    }

    const includeReferrals = isTruthyQuery(req.query.includeReferrals);
    if (!includeReferrals) {
      res.status(200).json(sanitizeUser(effectiveUser));
      return;
    }

    const limit = parseLimit(req.query.limit);
    const [referralsCount, referrals] = await Promise.all([
      users.countDocuments({ referredBy: id }),
      users
        .find(
          { referredBy: id },
          {
            projection: {
              id: 1,
              name: 1,
              username: 1,
              photo_url: 1,
              joinDate: 1,
              createdAt: 1,
            },
          },
        )
        .sort({ createdAt: -1, _id: -1 })
        .limit(limit)
        .toArray(),
    ]);

    const totalReferrals = toSafeInteger(referralsCount);
    const claimedCount = toSafeInteger(effectiveUser.referralRewardClaimedCount);
    const missingClaimedCount = Math.max(0, totalReferrals - claimedCount);

    if (missingClaimedCount > 0) {
      const nowIso = new Date().toISOString();
      const referralRewardPoints = getReferralRewardPoints();
      const incFields: Record<string, number> = {
        referralRewardClaimedCount: missingClaimedCount,
      };
      if (referralRewardPoints > 0) {
        incFields.balance = missingClaimedCount * referralRewardPoints;
      }

      await users.updateOne(
        { _id: id },
        {
          $inc: incFields,
          $set: { updatedAt: nowIso },
        } as any,
      );

      const refreshedUser = await users.findOne({ _id: id });
      if (refreshedUser) {
        effectiveUser = refreshedUser;
      }
    }

    res.status(200).json({
      ...sanitizeUser(effectiveUser),
      referrals: referrals.map(toReferralRow),
      referralsCount: totalReferrals,
      referralsReturned: referrals.length,
    });
  } catch (error) {
    console.error('GET /api/user/:id failed', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
}
