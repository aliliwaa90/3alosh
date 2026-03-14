
import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { UserState, Task, Transaction, TransactionType, TransactionStatus, DigitalProduct, PaymentMethod } from '../types';

export const POINTS_PER_DOLLAR = 200000;
export const EXCHANGE_RATE_USD = 1 / POINTS_PER_DOLLAR;

// --- Localization Dictionary ---
const TRANSLATIONS = {
  ar: {
    home: "الرئيسية", earn: "المهام", friends: "الأصدقاء", shop: "المتجر", wallet: "المحفظة",
    tap: "انقر", energy: "الطاقة", balance: "الرصيد", settings: "الإعدادات",
    withdraw: "سحب", deposit: "إيداع", language: "اللغة", theme: "المظهر",
    success: "نجاح", error: "خطأ", loading: "جاري التحميل...",
    theme_dark: "داكن", theme_light: "فاتح",
    level: "مستوى",
    total_points: "إجمالي النقاط المكتسبة",
    tap_value: "+0.3",
    profile: "الملف الشخصي",
    leaderboard: "لوحة الشرف",
    reward_center: "مركز المكافآت",
    complete_missions: "أكمل المهام • ارفع مستواك",
    filter_all: "الكل",
    filter_social: "تواصل",
    filter_video: "فيديو",
    open: "فتح",
    done: "تم",
    invite_friends: "هل تريد المزيد؟",
    invite_desc: "شارك رابطك واربح 1000 نقطة",
    goto_referrals: "مركز الإحالات",
    wallet_title: "المحفظة",
    balance_withdrawable: "الرصيد القابل للسحب",
    exchange_rate: "سعر الصرف",
    deposit_note: "إيداع: 1$ = 1,450 IQD",
    withdraw_note: "سحب: 1$ = 1 IQD",
    amount: "المبلغ",
    payment_method: "وسيلة الدفع",
    transaction_id: "رقم العملية",
    submit_withdraw: "طلب سحب الأرباح",
    submit_deposit: "تأكيد الإيداع",
    history: "سجل العمليات",
    no_transactions: "لا توجد عمليات سابقة",
    friends_system: "نظام المكافآت",
    friends_desc: "ادعُ أصدقاءك واربحوا معاً 1,000 نقطة هدية فورية لكل صديق!",
    your_link: "رابط دعوتك الذهبي",
    copy: "نسخ",
    share: "مشاركة",
    copied: "تم النسخ",
    friends_list: "قائمة المنضمين",
    no_friends: "لا يوجد أصدقاء منضمين حالياً",
    stats_friends: "صديق مسجل",
    stats_earnings: "إجمالي الأرباح",
    market_title: "سوق العدادات",
    mining_hardware: "أجهزة التعدين",
    browse: "الأجهزة المتاحة",
    my_items: "أجهزتي",
    buy: "اشتر بـ",
    owned: "مملوك",
    earning_rate: "نقطة/ث",
    active_forever: "نشط دائماً",
    // Settings Page
    global_config: "الإعدادات العامة",
    ui_mode: "وضع الواجهة",
    app_language: "لغة التطبيق",
    payment_address: "عنوان المحفظة / رقم الحساب",
    save: "حفظ",
    admin_zone: "منطقة الإدارة",
    dashboard: "لوحة التحكم",
    safe_logout: "تسجيل خروج آمن",
    root_access: "يتطلب صلاحيات الجذر",
    system_code: "رمز النظام",
    access_id: "هوية الوصول",
    unlock_system: "فتح النظام",
    explorer: "مستكشف",
    // Airdrop Page
    current_balance: "رصيدك الحالي",
    points: "نقطة",
    airdrop_qualified: "مؤهل للإيردروب",
    connect_wallet: "ربط المحفظة",
    connect_wallet_desc: "قم بربط محفظة TON الخاصة بك لاستلام توزيعات الإيردروب القادمة. تأكد من استخدام محفظة تدعم شبكة TON.",
    wallet_connected: "المحفظة متصلة بنجاح",
    airdrop_info: "معلومات الإيردروب",
    collect_points: "تجميع النقاط",
    collect_points_desc: "استمر في تجميع النقاط من خلال النقر وإكمال المهام ودعوة الأصدقاء لزيادة حصتك.",
    distribution_soon: "التوزيع (قريباً)",
    distribution_desc: "سيتم الإعلان عن موعد التوزيع وتحويل النقاط إلى عملات رقمية قريباً."
  },
  en: {
    home: "Home", earn: "Earn", friends: "Friends", shop: "Shop", wallet: "Wallet",
    tap: "Tap", energy: "Energy", balance: "Balance", settings: "Settings",
    withdraw: "Withdraw", deposit: "Deposit", language: "Language", theme: "Theme",
    success: "Success", error: "Error", loading: "Loading...",
    theme_dark: "Dark", theme_light: "Light",
    level: "Level",
    total_points: "Total Points Earned",
    tap_value: "+0.3",
    profile: "Profile",
    leaderboard: "Leaderboard",
    reward_center: "Reward Center",
    complete_missions: "Complete Missions • Level Up",
    filter_all: "All",
    filter_social: "Social",
    filter_video: "Video",
    open: "Open",
    done: "Done",
    invite_friends: "Want more?",
    invite_desc: "Share your link and earn 1000 points per friend!",
    goto_referrals: "Referral Center",
    wallet_title: "Wallet",
    balance_withdrawable: "Withdrawable Balance",
    exchange_rate: "Exchange Rate",
    deposit_note: "Deposit: $1 = 1,450 IQD",
    withdraw_note: "Withdraw: $1 = 1 IQD",
    amount: "Amount",
    payment_method: "Payment Method",
    transaction_id: "Transaction ID",
    submit_withdraw: "Request Withdrawal",
    submit_deposit: "Confirm Deposit",
    history: "Transaction History",
    no_transactions: "No transactions yet",
    friends_system: "Reward System",
    friends_desc: "Invite friends and earn 1,000 points together for every friend!",
    your_link: "Your Golden Link",
    copy: "Copy",
    share: "Share",
    copied: "Copied",
    friends_list: "Joined List",
    no_friends: "No friends joined yet",
    stats_friends: "Registered Friends",
    stats_earnings: "Total Earnings",
    market_title: "Mining Market",
    mining_hardware: "Mining Hardware",
    browse: "Available Rigs",
    my_items: "My Rigs",
    buy: "Buy for",
    owned: "Owned",
    earning_rate: "pts/s",
    active_forever: "Active Forever",
    // Settings Page
    global_config: "Global Config",
    ui_mode: "UI Mode",
    app_language: "App Language",
    payment_address: "Payment Address / Account No.",
    save: "Save",
    admin_zone: "Admin Zone",
    dashboard: "Dashboard",
    safe_logout: "Safe Logout",
    root_access: "Root Access Required",
    system_code: "System Code",
    access_id: "Access ID",
    unlock_system: "Unlock System",
    explorer: "Explorer",
    // Airdrop Page
    current_balance: "Current Balance",
    points: "Points",
    airdrop_qualified: "Airdrop Qualified",
    connect_wallet: "Connect Wallet",
    connect_wallet_desc: "Connect your TON wallet to receive upcoming airdrop distributions. Make sure to use a wallet that supports the TON network.",
    wallet_connected: "Wallet Connected Successfully",
    airdrop_info: "Airdrop Info",
    collect_points: "Collect Points",
    collect_points_desc: "Keep collecting points by tapping, completing tasks, and inviting friends to increase your share.",
    distribution_soon: "Distribution (Soon)",
    distribution_desc: "The distribution date and point conversion to crypto will be announced soon."
  }
};

const INITIAL_TASKS: Task[] = [
  { id: 't1', title: 'Follow Channel', reward: 5000, type: 'social', link: 'https://t.me/TlikerChannel' },
];

const INITIAL_PRODUCTS: DigitalProduct[] = [
    { id: 'p1', name: 'Basic Miner', description: 'Earns 0.5 points/sec', pricePoints: 10000, priceStars: 50, isFree: false, category: 'mining', earningRate: 0.5, allowPoints: true, allowStars: true, imageData: 'https://images.unsplash.com/photo-1624365169344-933e4b3734e0?w=300' }
];

const LOCAL_USER_CACHE_KEY = 'tliker_user_cache_v1';
const DEFAULT_BOT_USERNAME = 'FBJNKMLBOT';

const getBotUsername = (): string => {
  const fromEnv = (
    import.meta.env.VITE_TELEGRAM_BOT_USERNAME ||
    import.meta.env.VITE_BOT_USERNAME ||
    DEFAULT_BOT_USERNAME
  ).trim();

  return fromEnv.replace(/^@/, '') || DEFAULT_BOT_USERNAME;
};

const loadCachedUser = (userId: string): UserState | null => {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(LOCAL_USER_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<UserState>;
    if (!parsed || typeof parsed !== 'object') return null;
    if (String(parsed.id || '') !== userId) return null;
    return { ...(parsed as UserState), role: 'user' };
  } catch {
    return null;
  }
};

const saveCachedUser = (user: UserState): void => {
  if (typeof window === 'undefined') return;
  try {
    const safeUser = { ...user, role: 'user' as const };
    window.localStorage.setItem(LOCAL_USER_CACHE_KEY, JSON.stringify(safeUser));
  } catch {
    // Ignore local storage quota or parsing issues.
  }
};

interface GameContextType {
  user: UserState;
  isReady: boolean;
  lang: 'ar' | 'en';
  t: (key: string) => string;
  setLanguage: (lang: 'ar' | 'en') => void;
  tasks: Task[];
  transactions: Transaction[];
  digitalProducts: DigitalProduct[];
  paymentMethods: PaymentMethod[];
  handleClick: () => boolean;
  completeTask: (taskId: string) => void;
  requestWithdrawal: (amount: number, method: string) => Promise<{ success: boolean, message: string }>;
  requestDeposit: (usd: number, method: string, txId: string) => Promise<{ success: boolean, message: string }>;
  updateWalletAddress: (addr: string) => void;
  getReferralLink: () => string;
  buyProductWithPoints: (productId: string) => Promise<{ success: boolean, message: string }>;
  buyProductWithStars: (productId: string) => Promise<{ success: boolean, message: string }>;
  adminLogin: () => void;
  adminLogout: () => void;
  toggleTheme: () => void;
  toggleNotifications: () => void;
  copyReferralLink: () => void;
  fetchReferralsList: () => Promise<UserState[]>;
  referralReward: number;
  adminAddTask: (task: Task) => Promise<{ success: boolean, message: string }>;
  adminDeleteTask: (id: string) => Promise<{ success: boolean, message: string }>;
  adminAddProduct: (product: DigitalProduct) => Promise<{ success: boolean, message: string }>;
  adminUpdateProduct: (id: string, updates: Partial<DigitalProduct>) => Promise<{ success: boolean, message: string }>;
  adminDeleteProduct: (id: string) => Promise<{ success: boolean, message: string }>;
  adminProcessTransaction: (id: string, status: TransactionStatus) => void;
  adminBanUser: (id: string, isBanned: boolean) => Promise<{ success: boolean, message: string }>;
  adminAdjustUserPoints: (id: string, pointsDelta: number) => Promise<{ success: boolean, message: string }>;
  adminSetUserPoints: (id: string, points: number) => Promise<{ success: boolean, message: string }>;
  startChallenge: (amount: number) => boolean;
  resolveChallenge: (amount: number, result: 'win' | 'loss', multiplier?: number) => void;
  spinWheel: (prize: number) => Promise<void>;
  updateUser: (updates: Partial<import('../types').UserState>) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserState | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [digitalProducts, setDigitalProducts] = useState<DigitalProduct[]>(INITIAL_PRODUCTS);
  
  // Debounce refs for API syncing
  const pendingUpdateRef = useRef<Partial<UserState>>({});
  const syncTimerRef = useRef<any>(null);

  const [paymentMethods] = useState<PaymentMethod[]>([
    { id: 'm1', name: 'Zain Cash', accountNumber: '07800000000', recipientName: 'Tliker Official' }
  ]);

  const fetchCatalog = async () => {
    try {
      const res = await fetch('/api/catalog');
      if (!res.ok) return;
      const data = await res.json().catch(() => ({}));

      if (Array.isArray(data?.products)) {
        setDigitalProducts(data.products as DigitalProduct[]);
      }

      if (Array.isArray(data?.tasks)) {
        setTasks(data.tasks as Task[]);
      }
    } catch {
      // Keep local fallback data when catalog API is unavailable.
    }
  };

  useEffect(() => {
    fetchCatalog();

    if (typeof window === 'undefined') return;

    const intervalId = window.setInterval(() => {
      void fetchCatalog();
    }, 30000);

    const handleWindowFocus = () => {
      void fetchCatalog();
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        void fetchCatalog();
      }
    };

    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // --- Initialization ---
  useEffect(() => {
    const initUser = async () => {
      // 1. Get Telegram User Data
      const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
      const telegramPhotoUrl = String(tgUser?.photo_url || '').trim();
      const tgStartParam = window.Telegram?.WebApp?.initDataUnsafe?.start_param;
      const urlParams = new URLSearchParams(window.location.search);
      const startParam = String(
        tgStartParam ||
          urlParams.get('start_param') ||
          urlParams.get('startapp') ||
          '',
      ).trim();
      // Fallback for development/browser testing
      const userId = tgUser?.id ? String(tgUser.id) : (localStorage.getItem('debug_user_id') || `u_${Math.random().toString(36).substr(2, 9)}`);
      if (!tgUser?.id) localStorage.setItem('debug_user_id', userId);

      const createDefaultUser = (): UserState => ({
        id: userId,
        name: tgUser?.first_name || 'New User',
        photo_url: telegramPhotoUrl,
        username: tgUser?.username || '',
        balance: 1000,
        energy: 1000,
        maxEnergy: 1000,
        referrals: 0,
        joinDate: new Date().toLocaleDateString('en-US'),
        walletAddress: '',
        role: 'user',
        isBanned: false,
        ownedProducts: [],
        completedTaskIds: [],
        notificationsEnabled: true,
        theme: 'dark',
        language: 'ar'
      });

      let resolvedUser: UserState | null = null;

      try {
        const res = await fetch(`/api/user/${userId}?includeReferrals=1&limit=1`);
        if (res.ok) {
            const data = await res.json();
            const referralsCount = Number(data?.referralsCount);
            const serverPhotoUrl = String(data?.photo_url || '').trim();
            const effectivePhotoUrl = serverPhotoUrl || telegramPhotoUrl;
            resolvedUser = {
              ...createDefaultUser(),
              ...data,
              ...(effectivePhotoUrl ? { photo_url: effectivePhotoUrl } : {}),
              ...(Number.isFinite(referralsCount)
                ? { referrals: Math.max(0, Math.floor(referralsCount)) }
                : {}),
              role: 'user',
            };
        } else {
            resolvedUser = loadCachedUser(userId) || createDefaultUser();
            await fetch('/api/user', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ...resolvedUser,
                ...(startParam ? { startParam } : {}),
              })
            }).catch(() => undefined);
        }
      } catch (error) {
          console.error("Failed to init user", error);
          resolvedUser = loadCachedUser(userId) || createDefaultUser();
      }

      if (!resolvedUser) {
        resolvedUser = loadCachedUser(userId) || createDefaultUser();
      }

      setUser(resolvedUser);
      applyTheme(resolvedUser.theme || 'dark');
      saveCachedUser(resolvedUser);
      setIsReady(true);

      // Keep profile basics fresh for referrals and admin user list.
      void fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: resolvedUser.id,
          name: resolvedUser.name || 'User',
          username: resolvedUser.username || '',
          photo_url: telegramPhotoUrl || resolvedUser.photo_url || '',
          lastSeenAt: new Date().toISOString(),
          ...(startParam ? { startParam } : {}),
        }),
      }).catch(() => undefined);
    };

    initUser();
  }, []);

  useEffect(() => {
    if (user) {
      saveCachedUser(user);
    }
  }, [user]);

  useEffect(() => {
    if (!user?.id) return;

    const userId = String(user.id);
    const refreshReferralCount = async () => {
      try {
        const res = await fetch(`/api/user/${encodeURIComponent(userId)}?includeReferrals=1&limit=1`);
        if (!res.ok) return;

        const data = await res.json().catch(() => ({}));
        const referralsCount = Number(data?.referralsCount);
        const serverBalance = Number(data?.balance);

        const safeCount = Number.isFinite(referralsCount)
          ? Math.max(0, Math.floor(referralsCount))
          : null;
        const safeBalance = Number.isFinite(serverBalance)
          ? Math.max(0, Math.floor(serverBalance))
          : null;
        setUser((prev) => {
          if (!prev || String(prev.id) !== userId) return prev;

          const nextReferrals = safeCount === null ? Math.max(0, Math.floor(Number(prev.referrals || 0))) : safeCount;
          const nextBalance = safeBalance === null ? Math.max(0, Math.floor(Number(prev.balance || 0))) : safeBalance;

          if (
            Math.floor(Number(prev.referrals || 0)) === nextReferrals &&
            Math.floor(Number(prev.balance || 0)) === nextBalance
          ) {
            return prev;
          }

          return {
            ...prev,
            referrals: nextReferrals,
            balance: nextBalance,
          };
        });
      } catch {
        // Ignore refresh failures; next cycle will retry.
      }
    };

    void refreshReferralCount();

    const intervalId = window.setInterval(() => {
      void refreshReferralCount();
    }, 30000);

    const handleFocus = () => {
      void refreshReferralCount();
    };

    const handleVisibility = () => {
      if (!document.hidden) {
        void refreshReferralCount();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [user?.id]);

  // --- Sync State to API (Debounced) ---
  const scheduleSync = (updates: Partial<UserState>) => {
      if (!user) return;
      // Update local state immediately (Optimistic)
      setUser(prev => prev ? { ...prev, ...updates } : null);
      
      // Accumulate updates
      pendingUpdateRef.current = { ...pendingUpdateRef.current, ...updates };

      // Reset timer
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
      
      // Sync after 2 seconds of inactivity
      syncTimerRef.current = setTimeout(async () => {
          if (Object.keys(pendingUpdateRef.current).length > 0) {
              const payload = { ...pendingUpdateRef.current };
              try {
                  const res = await fetch('/api/user', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ id: user.id, ...payload })
                  });
                  if (res.ok) {
                      pendingUpdateRef.current = {};
                  }
              } catch {
                  // Keep pending updates for retry in next sync cycle.
              }
          }
      }, 2000);
  };

  // --- Localization Helper ---
  const t = (key: string) => {
      const l = user?.language || 'ar';
      // @ts-ignore
      return TRANSLATIONS[l]?.[key] || key;
  };

  const setLanguage = (lang: 'ar' | 'en') => {
      scheduleSync({ language: lang });
  };

  // --- Theme Helper ---
  const applyTheme = (theme: 'dark' | 'light') => {
      if (theme === 'dark') {
          document.documentElement.classList.add('dark');
          document.body.style.backgroundColor = '#020617';
      } else {
          document.documentElement.classList.remove('dark');
          document.body.style.backgroundColor = '#f8fafc';
      }
  };

  const toggleTheme = () => {
      if (!user) return;
      const newTheme = user.theme === 'light' ? 'dark' : 'light';
      applyTheme(newTheme);
      scheduleSync({ theme: newTheme });
  };

  // --- Game Logic ---

  // Energy Regen Loop
  useEffect(() => {
    if (!user) return;
    const timer = setInterval(() => {
      setUser(prev => {
        if (!prev) return null;
        if (prev.energy < prev.maxEnergy) {
            return { ...prev, energy: Math.min(prev.maxEnergy, prev.energy + 1) };
        }
        return prev;
      });
    }, 3000);
    return () => clearInterval(timer);
  }, [user?.maxEnergy]);

  // Passive Mining Loop
  useEffect(() => {
      if (!user || !digitalProducts.length) return;
      const timer = setInterval(() => {
          const ownedItems = digitalProducts.filter(p => user.ownedProducts.includes(p.id));
          const rate = ownedItems.reduce((acc, curr) => acc + (curr.earningRate || 0), 0);
          if (rate > 0) {
              setUser(prev => prev ? { ...prev, balance: prev.balance + rate } : null);
          }
      }, 1000);
      return () => clearInterval(timer);
  }, [user?.ownedProducts, digitalProducts]);

  // Periodic Save for Passive Income
  useEffect(() => {
      const timer = setInterval(() => {
          if (user) {
              fetch('/api/user', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ id: user.id, balance: user.balance, energy: user.energy })
              });
          }
      }, 30000); // Sync every 30s
      return () => clearInterval(timer);
  }, [user]);

  const handleClick = () => {
    if (!user || user.energy < 1 || user.isBanned) return false;
    const newBalance = user.balance + 1.5;
    const newEnergy = user.energy - 1;
    // Local update
    setUser({ ...user, balance: newBalance, energy: newEnergy });
    // Pending sync
    pendingUpdateRef.current = { ...pendingUpdateRef.current, balance: newBalance, energy: newEnergy };
    // Trigger debounce
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(async () => {
         if (user && Object.keys(pendingUpdateRef.current).length > 0) {
             const payload = { ...pendingUpdateRef.current };
             try {
                 const res = await fetch('/api/user', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ id: user.id, ...payload })
                  });
                 if (res.ok) {
                     pendingUpdateRef.current = {};
                 }
             } catch {
                 // Keep pending updates for retry.
             }
         }
    }, 2000);
    return true;
  };

  const completeTask = (taskId: string) => {
    if (!user || user.completedTaskIds.includes(taskId)) return;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    scheduleSync({ 
        balance: user.balance + task.reward, 
        completedTaskIds: [...user.completedTaskIds, taskId] 
    });
  };

  const requestWithdrawal = async (amount: number, method: string) => {
    if (!user || user.balance < amount) return { success: false, message: 'Insufficient balance' };
    const newTx: Transaction = {
      id: `tx_${Date.now()}`, userId: user.id, type: TransactionType.WITHDRAWAL, amount,
      status: TransactionStatus.PENDING, date: new Date().toLocaleDateString(), timestamp: Date.now(), method
    };
    setTransactions(prev => [newTx, ...prev]);
    scheduleSync({ balance: user.balance - amount });
    return { success: true, message: 'Withdrawal requested' };
  };

  const requestDeposit = async (usd: number, method: string, txId: string) => {
    if (!user) return { success: false, message: 'Error' };
    const newTx: Transaction = {
      id: `tx_${Date.now()}`, userId: user.id, type: TransactionType.DEPOSIT, amount: usd * POINTS_PER_DOLLAR,
      usdAmount: usd, status: TransactionStatus.PENDING, date: new Date().toLocaleDateString(), timestamp: Date.now(), method, txId
    };
    setTransactions(prev => [newTx, ...prev]);
    return { success: true, message: 'Deposit submitted' };
  };


  const buyProductWithPoints = async (productId: string) => {
    if (!user) return { success: false, message: 'Error' };
    const prod = digitalProducts.find(p => p.id === productId);
    if (!prod) return { success: false, message: 'Product not found' };
    if (user.ownedProducts.includes(productId)) return { success: false, message: 'Product already owned' };
    if (!prod.allowPoints || prod.pricePoints <= 0) return { success: false, message: 'Points purchase is disabled for this product' };
    if (user.balance < prod.pricePoints) return { success: false, message: 'Insufficient balance' };
    scheduleSync({ 
        balance: user.balance - prod.pricePoints, 
        ownedProducts: [...user.ownedProducts, productId] 
    });
    return { success: true, message: 'Product purchased' };
  };

  const refreshUserFromServer = async (userId: string): Promise<UserState | null> => {
    try {
      const res = await fetch(`/api/user/${userId}?syncPurchases=1`);
      if (!res.ok) return null;
      const serverUser = await res.json();
      setUser(prev => (prev ? { ...prev, ...serverUser, role: prev.role } : prev));
      return serverUser as UserState;
    } catch {
      // Ignore refresh errors.
      return null;
    }
  };

  const waitForProductActivation = async (
    userId: string,
    productId: string,
    attempts: number = 8,
    delayMs: number = 1400,
  ): Promise<boolean> => {
    for (let i = 0; i < attempts; i++) {
      const serverUser = await refreshUserFromServer(userId);
      if (Array.isArray(serverUser?.ownedProducts) && serverUser.ownedProducts.includes(productId)) {
        return true;
      }

      if (i < attempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
    return false;
  };

  const buyProductWithStars = async (productId: string) => {
    if (!user) return { success: false, message: 'Error' };
    const prod = digitalProducts.find(p => p.id === productId);
    if (!prod) return { success: false, message: 'Product not found' };
    if (user.ownedProducts.includes(productId)) return { success: false, message: 'Product already owned' };
    if (!prod.allowStars || !prod.priceStars || prod.priceStars <= 0) {
      return { success: false, message: 'Stars purchase is disabled for this product' };
    }

    const tg = window.Telegram?.WebApp;
    if (!tg?.openInvoice) {
      return { success: false, message: 'Open this app inside Telegram to pay with Stars' };
    }

    try {
      const res = await fetch('/api/stars/create-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          productId: prod.id,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success || !data?.invoiceLink) {
        return { success: false, message: data?.error || 'Failed to create Stars invoice' };
      }

      const invoiceStatus = await new Promise<string>((resolve) => {
        tg.openInvoice(data.invoiceLink as string, (status: string) => resolve(status || 'unknown'));
      });

      if (invoiceStatus === 'cancelled') {
        return { success: false, message: 'Payment was cancelled' };
      }

      if (invoiceStatus === 'paid') {
        const activated = await waitForProductActivation(String(user.id), prod.id, 9, 1300);
        if (activated) {
          return { success: true, message: 'Stars payment completed successfully' };
        }
        return { success: true, message: 'Payment received. Product activation may take a few seconds.' };
      }

      // Telegram sometimes reports pending/failed before backend activation completes.
      const activatedAfterDelay = await waitForProductActivation(String(user.id), prod.id, 6, 1500);
      if (activatedAfterDelay) {
        return { success: true, message: 'Stars payment completed successfully' };
      }

      if (invoiceStatus === 'pending') {
        return { success: false, message: 'Payment is pending. Please wait and check again.' };
      }
      return { success: false, message: `Payment status: ${invoiceStatus}` };
    } catch {
      return { success: false, message: 'Unable to start Stars payment' };
    }
  };

  const spinWheel = async (prize: number) => {
      if (!user) return;
      scheduleSync({ 
          balance: user.balance + prize,
          lastWheelSpin: Date.now()
      });
  };

  const startChallenge = (amount: number) => {
      if (!user || user.balance < amount) return false;
      scheduleSync({ balance: user.balance - amount });
      return true;
  };

  const resolveChallenge = (amount: number, result: 'win' | 'loss', multiplier: number = 1.5) => {
      if (!user || result === 'loss') return;
      scheduleSync({ balance: user.balance + (amount * multiplier) });
  };

  const updateWalletAddress = (addr: string) => scheduleSync({ walletAddress: addr });
  const getReferralLink = () => {
    const botUsername = getBotUsername();
    const userId = user?.id ? String(user.id) : '';
    return `https://t.me/${botUsername}?start=ref_${encodeURIComponent(userId)}`;
  };

  const getAdminRequestHeaders = (): Record<string, string> => {
    const adminToken = typeof window !== 'undefined' ? window.sessionStorage.getItem('admin_token') : '';
    return {
      'Content-Type': 'application/json',
      ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}),
    };
  };

  const parseApiErrorMessage = async (response: Response, fallback: string): Promise<string> => {
    const data = await response.json().catch(() => ({}));
    if (data && typeof data.error === 'string' && data.error.trim()) {
      return data.error;
    }
    return fallback;
  };
  
  // Admin role is session-only and should not be persisted to user profile.
  const adminLogin = () => setUser(prev => (prev ? { ...prev, role: 'admin' } : null));
  const adminLogout = () => setUser(prev => (prev ? { ...prev, role: 'user' } : null));
  const toggleNotifications = () => scheduleSync({ notificationsEnabled: !user?.notificationsEnabled });
  const copyReferralLink = () => { navigator.clipboard.writeText(getReferralLink()); };
  
  const fetchReferralsList = async () => {
      if (!user?.id) return [];

      try {
        const params = new URLSearchParams({
          includeReferrals: '1',
          limit: '200',
        });
        const res = await fetch(`/api/user/${encodeURIComponent(String(user.id))}?${params.toString()}`);
        if (!res.ok) return [];

        const data = await res.json().catch(() => ({}));
        const rows = Array.isArray(data?.referrals) ? data.referrals : [];

        return rows
          .map((row: any): UserState | null => {
            const id = String(row?.id || '').trim();
            if (!id) return null;

            const createdAt =
              typeof row?.createdAt === 'string' && row.createdAt
                ? row.createdAt
                : new Date().toISOString();

            return {
              id,
              name: typeof row?.name === 'string' && row.name ? row.name : 'User',
              username: typeof row?.username === 'string' ? row.username : '',
              photo_url: typeof row?.photo_url === 'string' ? row.photo_url : '',
              balance: 0,
              energy: 0,
              maxEnergy: 0,
              referrals: 0,
              joinDate:
                typeof row?.joinDate === 'string' && row.joinDate
                  ? row.joinDate
                  : new Date(createdAt).toLocaleDateString('en-US'),
              walletAddress: '',
              role: 'user',
              isBanned: false,
              ownedProducts: [],
              completedTaskIds: [],
              language: 'ar',
              theme: 'dark',
              notificationsEnabled: true,
            };
          })
          .filter((item: UserState | null): item is UserState => Boolean(item));
      } catch {
        return [];
      }
  };

  const adminAddTask = async (task: Task) => {
    try {
      const res = await fetch('/api/admin/tasks', {
        method: 'POST',
        headers: getAdminRequestHeaders(),
        body: JSON.stringify(task),
      });

      if (!res.ok) {
        return {
          success: false,
          message: await parseApiErrorMessage(res, 'Failed to add task'),
        };
      }

      await fetchCatalog();
      return { success: true, message: 'Task created successfully' };
    } catch {
      return { success: false, message: 'Unable to create task' };
    }
  };

  const adminDeleteTask = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/tasks?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: getAdminRequestHeaders(),
      });

      if (!res.ok) {
        return {
          success: false,
          message: await parseApiErrorMessage(res, 'Failed to delete task'),
        };
      }

      await fetchCatalog();
      return { success: true, message: 'Task deleted successfully' };
    } catch {
      return { success: false, message: 'Unable to delete task' };
    }
  };

  const adminAddProduct = async (product: DigitalProduct) => {
    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: getAdminRequestHeaders(),
        body: JSON.stringify(product),
      });

      if (!res.ok) {
        return {
          success: false,
          message: await parseApiErrorMessage(res, 'Failed to add product'),
        };
      }

      await fetchCatalog();
      return { success: true, message: 'Product published successfully' };
    } catch {
      return { success: false, message: 'Unable to publish product' };
    }
  };

  const adminUpdateProduct = async (id: string, updates: Partial<DigitalProduct>) => {
    try {
      const res = await fetch(`/api/admin/products?id=${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: getAdminRequestHeaders(),
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        return {
          success: false,
          message: await parseApiErrorMessage(res, 'Failed to update product'),
        };
      }

      await fetchCatalog();
      return { success: true, message: 'Product updated successfully' };
    } catch {
      return { success: false, message: 'Unable to update product' };
    }
  };

  const adminDeleteProduct = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/products?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: getAdminRequestHeaders(),
      });

      if (!res.ok) {
        return {
          success: false,
          message: await parseApiErrorMessage(res, 'Failed to delete product'),
        };
      }

      await fetchCatalog();
      return { success: true, message: 'Product deleted successfully' };
    } catch {
      return { success: false, message: 'Unable to delete product' };
    }
  };

  const adminProcessTransaction = (id: string, status: TransactionStatus) => {
      setTransactions(prev => prev.map(t => t.id === id ? { ...t, status } : t));
  };

  const adminBanUser = async (id: string, isBanned: boolean) => {
      try {
        const res = await fetch(`/api/admin/users?id=${encodeURIComponent(id)}`, {
          method: 'PATCH',
          headers: getAdminRequestHeaders(),
          body: JSON.stringify({ isBanned }),
        });

        if (!res.ok) {
          return {
            success: false,
            message: await parseApiErrorMessage(res, 'Failed to update user ban'),
          };
        }

        if (user?.id === id) {
          setUser(prev => (prev ? { ...prev, isBanned } : prev));
        }

        return { success: true, message: isBanned ? 'User has been banned' : 'User has been unbanned' };
      } catch {
        return { success: false, message: 'Unable to update user ban' };
      }
  };

  const adminAdjustUserPoints = async (id: string, pointsDelta: number) => {
      try {
        const res = await fetch(`/api/admin/users?id=${encodeURIComponent(id)}`, {
          method: 'PATCH',
          headers: getAdminRequestHeaders(),
          body: JSON.stringify({ pointsDelta }),
        });

        if (!res.ok) {
          return {
            success: false,
            message: await parseApiErrorMessage(res, 'Failed to update user points'),
          };
        }

        const data = await res.json().catch(() => ({}));
        if (user?.id === id && typeof data?.user?.balance === 'number') {
          setUser(prev => (prev ? { ...prev, balance: data.user.balance } : prev));
        }

        return { success: true, message: 'User points updated successfully' };
      } catch {
        return { success: false, message: 'Unable to update user points' };
      }
  };

  const adminSetUserPoints = async (id: string, points: number) => {
      try {
        const res = await fetch(`/api/admin/users?id=${encodeURIComponent(id)}`, {
          method: 'PATCH',
          headers: getAdminRequestHeaders(),
          body: JSON.stringify({ points }),
        });

        if (!res.ok) {
          return {
            success: false,
            message: await parseApiErrorMessage(res, 'Failed to set user points'),
          };
        }

        const data = await res.json().catch(() => ({}));
        if (user?.id === id && typeof data?.user?.balance === 'number') {
          setUser(prev => (prev ? { ...prev, balance: data.user.balance } : prev));
        }

        return { success: true, message: 'User points set successfully' };
      } catch {
        return { success: false, message: 'Unable to set user points' };
      }
  };

  if (!isReady || !user) return <div className="h-screen bg-black flex items-center justify-center text-white">Loading Global Data...</div>;

  return (
      <GameContext.Provider value={{
      user, isReady, lang: user.language || 'ar', t, setLanguage, tasks, transactions, digitalProducts, paymentMethods,
      handleClick, completeTask, requestWithdrawal, requestDeposit, updateWalletAddress, getReferralLink,
      buyProductWithPoints, buyProductWithStars, adminLogin, adminLogout, toggleTheme, toggleNotifications,
      copyReferralLink, fetchReferralsList, referralReward: 1000,
      adminAddTask, adminDeleteTask, adminAddProduct, adminUpdateProduct, adminDeleteProduct, adminProcessTransaction, adminBanUser, adminAdjustUserPoints, adminSetUserPoints,
      startChallenge, resolveChallenge, spinWheel, updateUser: scheduleSync
    }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error("useGame must be used within GameProvider");
  return context;
};
