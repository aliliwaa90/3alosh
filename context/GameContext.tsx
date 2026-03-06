
import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { UserState, Task, Transaction, TransactionType, TransactionStatus, DigitalProduct, P2POffer, PaymentMethod } from '../types';

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
    tap_value: "+1.5",
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
    tap_value: "+1.5",
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
  p2pOffers: P2POffer[];
  digitalProducts: DigitalProduct[];
  paymentMethods: PaymentMethod[];
  handleClick: () => boolean;
  completeTask: (taskId: string) => void;
  requestWithdrawal: (amount: number, method: string) => Promise<{ success: boolean, message: string }>;
  requestDeposit: (usd: number, method: string, txId: string) => Promise<{ success: boolean, message: string }>;
  updateWalletAddress: (addr: string) => void;
  getReferralLink: () => string;
  createP2POffer: (amount: number, priceUsd: number, method: string) => Promise<{ success: boolean, message: string }>;
  buyP2POffer: (offerId: string) => Promise<{ success: boolean, message: string }>;
  cancelP2POffer: (offerId: string) => Promise<{ success: boolean, message: string }>;
  buyProductWithPoints: (productId: string) => Promise<{ success: boolean, message: string }>;
  buyProductWithStars: (productId: string) => Promise<{ success: boolean, message: string }>;
  adminLogin: () => void;
  adminLogout: () => void;
  toggleTheme: () => void;
  toggleNotifications: () => void;
  copyReferralLink: () => void;
  fetchReferralsList: () => Promise<UserState[]>;
  referralReward: number;
  adminAddTask: (task: Task) => void;
  adminDeleteTask: (id: string) => void;
  adminAddProduct: (product: DigitalProduct) => void;
  adminDeleteProduct: (id: string) => void;
  adminProcessTransaction: (id: string, status: TransactionStatus) => void;
  adminBanUser: (id: string, isBanned: boolean) => void;
  startChallenge: (amount: number) => boolean;
  resolveChallenge: (amount: number, result: 'win' | 'loss', multiplier?: number) => void;
  spinWheel: (prize: number) => Promise<void>;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserState | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [p2pOffers, setP2POffers] = useState<P2POffer[]>([]);
  const [digitalProducts, setDigitalProducts] = useState<DigitalProduct[]>(INITIAL_PRODUCTS);
  
  // Debounce refs for API syncing
  const pendingUpdateRef = useRef<Partial<UserState>>({});
  const syncTimerRef = useRef<any>(null);

  const [paymentMethods] = useState<PaymentMethod[]>([
    { id: 'm1', name: 'Zain Cash', accountNumber: '07800000000', recipientName: 'Tliker Official' }
  ]);

  // --- Initialization ---
  useEffect(() => {
    const initUser = async () => {
      // 1. Get Telegram User Data
      const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
      // Fallback for development/browser testing
      const userId = tgUser?.id ? String(tgUser.id) : (localStorage.getItem('debug_user_id') || `u_${Math.random().toString(36).substr(2, 9)}`);
      if (!tgUser?.id) localStorage.setItem('debug_user_id', userId);

      const createDefaultUser = (): UserState => ({
        id: userId,
        name: tgUser?.first_name || 'New User',
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
        const res = await fetch(`/api/user/${userId}`);
        if (res.ok) {
            const data = await res.json();
            resolvedUser = { ...createDefaultUser(), ...data, role: 'user' };
        } else {
            resolvedUser = loadCachedUser(userId) || createDefaultUser();
            await fetch('/api/user', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(resolvedUser)
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
    };

    initUser();
  }, []);

  useEffect(() => {
    if (user) {
      saveCachedUser(user);
    }
  }, [user]);

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

  const createP2POffer = async (amount: number, priceUsd: number, method: string) => {
    if (!user || user.balance < amount) return { success: false, message: 'Insufficient balance' };
    const newOffer: P2POffer = {
      id: `off_${Date.now()}`, sellerId: user.id, sellerName: user.name || 'User',
      amount, priceUsd, status: 'available', paymentMethod: method, createdAt: Date.now()
    };
    setP2POffers(prev => [newOffer, ...prev]);
    scheduleSync({ balance: user.balance - amount });
    return { success: true, message: 'Offer created' };
  };

  const buyP2POffer = async (offerId: string) => {
      setP2POffers(prev => prev.map(o => o.id === offerId ? { ...o, status: 'pending', buyerId: user?.id, buyerName: user?.name } as P2POffer : o));
      return { success: true, message: 'Trade started' };
  };

  const cancelP2POffer = async (offerId: string) => {
    const offer = p2pOffers.find(o => o.id === offerId);
    if (!offer || !user) return { success: false, message: 'Not found' };
    scheduleSync({ balance: user.balance + offer.amount });
    setP2POffers(prev => prev.filter(o => o.id !== offerId));
    return { success: true, message: 'Offer cancelled' };
  };

  const buyProductWithPoints = async (productId: string) => {
    if (!user) return { success: false, message: 'Error' };
    const prod = digitalProducts.find(p => p.id === productId);
    if (!prod) return { success: false, message: 'Product not found' };
    if (user.ownedProducts.includes(productId)) return { success: false, message: 'Product already owned' };
    if (user.balance < prod.pricePoints) return { success: false, message: 'Insufficient balance' };
    scheduleSync({ 
        balance: user.balance - prod.pricePoints, 
        ownedProducts: [...user.ownedProducts, productId] 
    });
    return { success: true, message: 'Product purchased' };
  };

  const refreshUserFromServer = async (userId: string) => {
    try {
      const res = await fetch(`/api/user/${userId}`);
      if (!res.ok) return;
      const serverUser = await res.json();
      setUser(prev => (prev ? { ...prev, ...serverUser, role: prev.role } : prev));
    } catch {
      // Ignore refresh errors.
    }
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
          title: prod.name,
          description: prod.description,
          starsAmount: Math.floor(prod.priceStars),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success || !data?.invoiceLink) {
        return { success: false, message: data?.error || 'Failed to create Stars invoice' };
      }

      const invoiceStatus = await new Promise<string>((resolve) => {
        tg.openInvoice(data.invoiceLink as string, (status: string) => resolve(status || 'unknown'));
      });

      if (invoiceStatus !== 'paid') {
        if (invoiceStatus === 'cancelled') {
          return { success: false, message: 'Payment was cancelled' };
        }
        return { success: false, message: `Payment status: ${invoiceStatus}` };
      }

      // Payment is confirmed by Telegram; refresh user to pull updated owned products from backend.
      await new Promise((resolve) => setTimeout(resolve, 1200));
      await refreshUserFromServer(user.id);
      return { success: true, message: 'Stars payment completed successfully' };
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
  
  // Admin role is session-only and should not be persisted to user profile.
  const adminLogin = () => setUser(prev => (prev ? { ...prev, role: 'admin' } : null));
  const adminLogout = () => setUser(prev => (prev ? { ...prev, role: 'user' } : null));
  const toggleNotifications = () => scheduleSync({ notificationsEnabled: !user?.notificationsEnabled });
  const copyReferralLink = () => { navigator.clipboard.writeText(getReferralLink()); };
  
  const fetchReferralsList = async () => {
      // Mock implementation for now
      if (!user) return [];
      return [];
  };

  // Admin Stubs (Should be connected to Firestore in full implementation)
  const adminAddTask = (task: Task) => setTasks(prev => [...prev, task]);
  const adminDeleteTask = (id: string) => setTasks(prev => prev.filter(t => t.id !== id));
  const adminAddProduct = (product: DigitalProduct) => setDigitalProducts(prev => [...prev, product]);
  const adminDeleteProduct = (id: string) => setDigitalProducts(prev => prev.filter(p => p.id !== id));
  const adminProcessTransaction = (id: string, status: TransactionStatus) => {
      setTransactions(prev => prev.map(t => t.id === id ? { ...t, status } : t));
  };
  const adminBanUser = (id: string, isBanned: boolean) => {
      if (user?.id === id) scheduleSync({ isBanned });
  };

  if (!isReady || !user) return <div className="h-screen bg-black flex items-center justify-center text-white">Loading Global Data...</div>;

  return (
      <GameContext.Provider value={{
      user, isReady, lang: user.language || 'ar', t, setLanguage, tasks, transactions, p2pOffers, digitalProducts, paymentMethods,
      handleClick, completeTask, requestWithdrawal, requestDeposit, updateWalletAddress, getReferralLink,
      createP2POffer, buyP2POffer, cancelP2POffer, buyProductWithPoints, buyProductWithStars, adminLogin, adminLogout, toggleTheme, toggleNotifications,
      copyReferralLink, fetchReferralsList, referralReward: 1000,
      adminAddTask, adminDeleteTask, adminAddProduct, adminDeleteProduct, adminProcessTransaction, adminBanUser,
      startChallenge, resolveChallenge, spinWheel
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
