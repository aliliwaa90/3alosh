
import React, { useState, useMemo, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { TransactionStatus, TransactionType, Task, DigitalProduct } from '../types';
import { 
    ShieldCheck, LogOut, Activity, Users, DollarSign, 
    ShoppingBag, Search, Plus, Trash2, Check, X, 
    Briefcase, Ban, Unlock, Zap, UploadCloud, Megaphone, Star, Coins, Pencil, RefreshCw, UserCircle2, ArrowUpRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AdminUserRow {
  id: string;
  name: string;
  username: string;
  photo_url?: string;
  balance: number;
  isBanned: boolean;
  updatedAt?: string;
  lastSeenAt?: string;
}

interface AdminOverviewStats {
  totalUsers: number;
  activeUsers: number;
  revenue: number;
  pendingWithdrawals: number;
}

const PRODUCT_IMAGE_MAX_SIZE = Math.floor(2.5 * 1024 * 1024);
const PRODUCT_IMAGE_ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const IMAGE_MIME_BY_EXTENSION: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
};

const formatTime = (iso?: string): string => {
  if (!iso) return '-';
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return '-';
  return parsed.toLocaleString();
};

const normalizeArabicDigits = (value: string): string =>
  value
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 1632))
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 1776));

const resolveImageMimeType = (file: File): string => {
  const fromType = String(file.type || '').trim().toLowerCase();
  if (fromType) return fromType;

  const extension = String(file.name || '')
    .split('.')
    .pop()
    ?.trim()
    .toLowerCase();

  if (!extension) return '';
  return IMAGE_MIME_BY_EXTENSION[extension] || '';
};

const Admin: React.FC = () => {
  const { 
      user, transactions, tasks, digitalProducts, adminLogout,
      adminLogin,
      adminAddTask, adminDeleteTask, adminAddProduct, adminUpdateProduct, adminDeleteProduct,
      adminProcessTransaction, adminBanUser, adminAdjustUserPoints, adminSetUserPoints
  } = useGame();
  
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'finance' | 'tasks' | 'shop' | 'broadcast' | 'withdrawals'>('overview');
  
  // Login State
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // States for Forms
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showProdForm, setShowProdForm] = useState(false);

  // Broadcast State
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcastStatus, setBroadcastStatus] = useState('');
  const [broadcastImageData, setBroadcastImageData] = useState('');
  const [broadcastImagePreview, setBroadcastImagePreview] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  const handleAdminLogout = () => {
      if (typeof window !== 'undefined') {
          window.sessionStorage.removeItem('admin_token');
      }
      adminLogout();
  };

  // New Task State
  const [newTask, setNewTask] = useState<Partial<Task>>({ type: 'social', reward: 1000 });
  
  // New Product State
  const [newProd, setNewProd] = useState<Partial<DigitalProduct>>({ pricePoints: 5000, earningRate: 0.1, category: 'mining' });
  const [imagePreview, setImagePreview] = useState<string>('');
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editProd, setEditProd] = useState<Partial<DigitalProduct>>({});

  // Users Management State
  const [adminUsers, setAdminUsers] = useState<AdminUserRow[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [usersLoading, setUsersLoading] = useState(false);
  const [pointsDeltaInput, setPointsDeltaInput] = useState<Record<string, string>>({});
  const [pointsSetInput, setPointsSetInput] = useState<Record<string, string>>({});
  const [avatarErrorByUserId, setAvatarErrorByUserId] = useState<Record<string, boolean>>({});
  const [adminActionStatus, setAdminActionStatus] = useState('');
  const [overviewStats, setOverviewStats] = useState<AdminOverviewStats | null>(null);
  const [overviewStatsLoading, setOverviewStatsLoading] = useState(false);

  // Withdrawals State
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [withdrawalsLoading, setWithdrawalsLoading] = useState(false);
  const [withdrawalActionStatus, setWithdrawalActionStatus] = useState('');

  // Stats Logic
  const stats = useMemo(() => ({
      totalPoints: user.balance, // Should be sum of all users in real backend
      pendingTx: transactions.filter(t => t.status === TransactionStatus.PENDING).length,
      revenueUsd: transactions.filter(t => t.type === TransactionType.DEPOSIT && t.status === TransactionStatus.COMPLETED).reduce((s, t) => s + (t.usdAmount || 0), 0),
      totalWithdrawn: transactions.filter(t => t.type === TransactionType.WITHDRAWAL && t.status === TransactionStatus.COMPLETED).reduce((s, t) => s + t.amount, 0),
  }), [user.balance, transactions]);

  const showAdminActionStatus = (message: string) => {
      setAdminActionStatus(message);
      setTimeout(() => setAdminActionStatus(''), 3200);
  };

  const getAdminAuthHeaders = (): Record<string, string> => {
      const adminToken = typeof window !== 'undefined' ? window.sessionStorage.getItem('admin_token') : '';
      return adminToken ? { Authorization: `Bearer ${adminToken}` } : {};
  };

  const loadOverviewStats = async () => {
      setOverviewStatsLoading(true);
      try {
          const res = await fetch('/api/admin/stats', {
              headers: { ...getAdminAuthHeaders() }
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
              return;
          }
          setOverviewStats({
              totalUsers: Number.isFinite(Number(data?.totalUsers)) ? Number(data.totalUsers) : 0,
              activeUsers: Number.isFinite(Number(data?.activeUsers)) ? Number(data.activeUsers) : 0,
              revenue: Number.isFinite(Number(data?.revenue)) ? Number(data.revenue) : 0,
              pendingWithdrawals: Number.isFinite(Number(data?.pendingWithdrawals)) ? Number(data.pendingWithdrawals) : 0,
          });
      } catch {
          // Ignore stats failures and keep fallback local values.
      } finally {
          setOverviewStatsLoading(false);
      }
  };

  const loadUsers = async () => {
      setUsersLoading(true);
      try {
          const params = new URLSearchParams();
          params.set('limit', '200');
          if (userSearch.trim()) params.set('q', userSearch.trim());
          const res = await fetch(`/api/admin/users?${params.toString()}`, {
              headers: { ...getAdminAuthHeaders() }
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
              showAdminActionStatus(data?.error || 'فشل تحميل المستخدمين');
              return;
          }
          setAdminUsers(Array.isArray(data?.users) ? data.users : []);
          setAvatarErrorByUserId({});
      } catch {
          showAdminActionStatus('تعذر تحميل المستخدمين');
      } finally {
          setUsersLoading(false);
      }
  };

  useEffect(() => {
      if (user.role === 'admin' && activeTab === 'users') {
          loadUsers();
      }
  }, [activeTab, user.role]);

  useEffect(() => {
      if (user.role !== 'admin' || activeTab !== 'overview') return;
      loadOverviewStats();
  }, [activeTab, user.role]);

  const handleToggleBan = async (row: AdminUserRow) => {
      const result = await adminBanUser(row.id, !row.isBanned);
      showAdminActionStatus(result.message);
      if (result.success) {
          loadUsers();
      }
  };

  const parseInputNumber = (raw: string): number => {
      const normalized = normalizeArabicDigits(String(raw || ''))
        .replace(/[,\s٬]/g, '')
        .replace(/٫/g, '.')
        .trim();
      const n = Number(normalized);
      if (!Number.isFinite(n)) return 0;
      return Math.floor(n);
  };

  const handleAddPoints = async (row: AdminUserRow) => {
      const value = Math.abs(parseInputNumber(pointsDeltaInput[row.id] || '0'));
      if (!value) {
          showAdminActionStatus('أدخل قيمة نقاط صحيحة');
          return;
      }
      const result = await adminAdjustUserPoints(row.id, value);
      showAdminActionStatus(result.message);
      if (result.success) {
          loadUsers();
          setPointsDeltaInput(prev => ({ ...prev, [row.id]: '' }));
      }
  };

  const handleSubtractPoints = async (row: AdminUserRow) => {
      const value = Math.abs(parseInputNumber(pointsDeltaInput[row.id] || '0'));
      if (!value) {
          showAdminActionStatus('أدخل قيمة نقاط صحيحة');
          return;
      }
      const result = await adminAdjustUserPoints(row.id, -value);
      showAdminActionStatus(result.message);
      if (result.success) {
          loadUsers();
          setPointsDeltaInput(prev => ({ ...prev, [row.id]: '' }));
      }
  };

  const handleSetPoints = async (row: AdminUserRow) => {
      const value = Math.max(0, parseInputNumber(pointsSetInput[row.id] || '0'));
      const result = await adminSetUserPoints(row.id, value);
      showAdminActionStatus(result.message);
      if (result.success) {
          loadUsers();
          setPointsSetInput(prev => ({ ...prev, [row.id]: '' }));
      }
  };

  const startEditProduct = (prod: DigitalProduct) => {
      setEditingProductId(prod.id);
      setEditProd({
          ...prod,
          category: prod.category || 'mining',
      });
  };

  const cancelEditProduct = () => {
      setEditingProductId(null);
      setEditProd({});
  };

  const saveEditedProduct = async () => {
      if (!editingProductId || !editProd.name) {
          showAdminActionStatus('أدخل اسم الجهاز قبل الحفظ');
          return;
      }

      const result = await adminUpdateProduct(editingProductId, {
          name: String(editProd.name || '').trim(),
          description: String(editProd.description || '').trim(),
          pricePoints: Number(editProd.pricePoints || 0),
          priceStars: Number(editProd.priceStars || 0),
          earningRate: Number(editProd.earningRate || 0),
          imageData: editProd.imageData,
          category: String(editProd.category || 'mining'),
          allowPoints: Boolean(editProd.allowPoints),
          allowStars: Boolean(editProd.allowStars),
      });

      showAdminActionStatus(result.message);
      if (result.success) {
          cancelEditProduct();
      }
  };

  // Withdrawals Handlers
  const loadWithdrawals = async () => {
      setWithdrawalsLoading(true);
      try {
          const res = await fetch('/api/admin/withdrawals/all', {
              headers: { ...getAdminAuthHeaders() }
          });
          const data = await res.json();
          if (data.success) {
              setWithdrawals(data.withdrawals || []);
          }
      } catch (err) {
          console.error('Failed to load withdrawals:', err);
          setWithdrawalActionStatus('فشل تحميل السحوبات');
      } finally {
          setWithdrawalsLoading(false);
      }
  };

  const handleApproveWithdrawal = async (withdrawalId: string, notes?: string) => {
      try {
          const res = await fetch(`/api/admin/withdrawals/${withdrawalId}/approve`, {
              method: 'PATCH',
              headers: { 
                  'Content-Type': 'application/json',
                  ...getAdminAuthHeaders() 
              },
              body: JSON.stringify({ adminNotes: notes })
          });
          const data = await res.json();
          if (data.success) {
              setWithdrawalActionStatus('تم الموافقة على السحب بنجاح');
              loadWithdrawals();
          }
      } catch (err) {
          setWithdrawalActionStatus('فشل الموافقة على السحب');
          console.error(err);
      }
  };

  const handleRejectWithdrawal = async (withdrawalId: string, reason: string) => {
      try {
          const res = await fetch(`/api/admin/withdrawals/${withdrawalId}/reject`, {
              method: 'PATCH',
              headers: { 
                  'Content-Type': 'application/json',
                  ...getAdminAuthHeaders() 
              },
              body: JSON.stringify({ rejectionReason: reason })
          });
          const data = await res.json();
          if (data.success) {
              setWithdrawalActionStatus('تم رفض السحب');
              loadWithdrawals();
          }
      } catch (err) {
          setWithdrawalActionStatus('فشل رفض السحب');
          console.error(err);
      }
  };

  useEffect(() => {
      if (user.role === 'admin' && activeTab === 'withdrawals') {
          loadWithdrawals();
      }
  }, [activeTab, user.role]);

  // Handler: Broadcast
  const handleBroadcast = async () => {
      if (!broadcastMsg && !broadcastImageData) return;
      setIsBroadcasting(true);
      setBroadcastStatus('جاري الإرسال...');
      try {
        const adminToken = typeof window !== 'undefined' ? window.sessionStorage.getItem('admin_token') : '';
        const res = await fetch('/api/admin/broadcast', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {})
          },
          body: JSON.stringify({
            message: broadcastMsg,
            imageData: broadcastImageData || undefined
          })
        });

        const data = await res.json().catch(() => ({}));
        if (res.ok && data.success) {
          const failedCount = Number(data.failedCount || 0);
          const failedText = failedCount > 0 ? ` | فشل: ${failedCount}` : '';
          setBroadcastStatus(`تم الإرسال إلى ${data.sentCount} مستخدم${failedText}`);
          setBroadcastMsg('');
          setBroadcastImageData('');
          setBroadcastImagePreview('');
        } else {
          setBroadcastStatus('فشل الإرسال: ' + (data.error || 'Unknown error'));
        }
      } catch {
        setBroadcastStatus('تعذر إرسال الطلب');
      } finally {
        setIsBroadcasting(false);
        setTimeout(() => setBroadcastStatus(''), 4000);
      }
  };

  const handleBroadcastImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const maxFileSize = 3 * 1024 * 1024;
      if (file.size > maxFileSize) {
          setBroadcastStatus('حجم الصورة يجب أن يكون أقل من 3MB');
          e.target.value = '';
          return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
          const result = reader.result;
          if (typeof result === 'string') {
              setBroadcastImageData(result);
              setBroadcastImagePreview(result);
          }
      };
      reader.readAsDataURL(file);
  };

  const clearBroadcastImage = () => {
      setBroadcastImageData('');
      setBroadcastImagePreview('');
  };

  // Handler: Add Task
  const handleAddTask = async () => {
      if (!newTask.title || !newTask.reward) return;
      const result = await adminAddTask({
          id: `t_${Date.now()}`,
          title: newTask.title,
          reward: Number(newTask.reward),
          type: newTask.type as any,
          link: newTask.link || '#'
      });
      showAdminActionStatus(result.message);
      if (!result.success) return;
      setShowTaskForm(false);
      setNewTask({ type: 'social', reward: 1000, title: '', link: '' });
  };

  const handleDeleteTask = async (id: string) => {
      const result = await adminDeleteTask(id);
      showAdminActionStatus(result.message);
  };

  // Handler: Image Upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const mime = resolveImageMimeType(file);
      if (!PRODUCT_IMAGE_ALLOWED_TYPES.has(mime)) {
          showAdminActionStatus('الامتداد غير مدعوم. استخدم JPG/PNG/WEBP/GIF');
          e.target.value = '';
          return;
      }

      if (file.size > PRODUCT_IMAGE_MAX_SIZE) {
          showAdminActionStatus('الصورة كبيرة جداً. الحد الأقصى 2.5MB لمتجر المنتجات');
          e.target.value = '';
          return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
          const result = reader.result;
          if (typeof result !== 'string') {
              showAdminActionStatus('تعذر قراءة الصورة');
              return;
          }
          setNewProd(prev => ({ ...prev, imageData: result }));
          setImagePreview(result);
      };
      reader.onerror = () => showAdminActionStatus('تعذر قراءة الصورة');
      reader.readAsDataURL(file);
  };

  // Handler: Add Product
  const handleAddProduct = async () => {
      if (!newProd.name || !newProd.pricePoints) return;
      const result = await adminAddProduct({
          id: `p_${Date.now()}`,
          name: newProd.name,
          description: newProd.description || 'منتج تعدين',
          pricePoints: Number(newProd.pricePoints),
          priceStars: Number(newProd.priceStars || 50),
          earningRate: Number(newProd.earningRate || 0),
          imageData: newProd.imageData || 'https://via.placeholder.com/150',
          isFree: false,
          category: String(newProd.category || 'mining'),
          allowPoints: Boolean(newProd.allowPoints ?? true),
          allowStars: Boolean(newProd.allowStars ?? true)
      });
      showAdminActionStatus(result.message);
      if (!result.success) return;
      setShowProdForm(false);
      setNewProd({ pricePoints: 5000, priceStars: 50, earningRate: 0.1, category: 'mining', allowPoints: true, allowStars: true });
      setImagePreview('');
  };

  // Access Check
  if (user.role !== 'admin') {
      const handleLogin = async (e: React.FormEvent) => {
          e.preventDefault();
          if (!password) {
              setLoginError('أدخل كلمة المرور');
              return;
          }

          setIsLoggingIn(true);
          setLoginError('');

          try {
              const telegramUserId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;
              const res = await fetch('/api/admin/login', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    password,
                    userId: telegramUserId ? String(telegramUserId) : undefined
                  })
              });

              if (!res.ok) {
                  if (res.status === 404 || res.status === 405) {
                      if (password === 'admin123') {
                          adminLogin();
                          setPassword('');
                          return;
                      }
                  }
                  const data = await res.json().catch(() => ({}));
                  setLoginError(data?.error || 'فشل التحقق من الدخول');
                  return;
              }

              const data = await res.json();
              if (data?.success && data?.token) {
                  window.sessionStorage.setItem('admin_token', data.token);
                  adminLogin();
                  setPassword('');
                  return;
              }

              setLoginError('تعذر إنشاء جلسة الإدارة');
          } catch {
              // Fallback for local dev mode when API route is not available.
              if (password === 'admin123') {
                  adminLogin();
                  setPassword('');
              } else {
                  setLoginError('تعذر الاتصال بالخادم');
              }
          } finally {
              setIsLoggingIn(false);
          }
      };

      return (
        <div className="h-screen bg-black flex flex-col items-center justify-center text-white p-10 text-center" dir="rtl">
            <ShieldCheck size={50} className="mb-4 text-slate-500"/>
            <h1 className="text-xl font-black mb-6">لوحة الإدارة</h1>
            
            <form onSubmit={handleLogin} className="w-full max-w-xs space-y-4">
                <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="أدخل كلمة المرور"
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-center font-bold outline-none focus:border-primary/50"
                />
                {loginError && <p className="text-rose-500 text-xs font-bold">{loginError}</p>}
                <button type="submit" disabled={isLoggingIn} className="w-full bg-primary text-black font-black py-4 rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                    {isLoggingIn ? 'جاري التحقق...' : 'دخول'}
                </button>
            </form>

            <button onClick={() => navigate('/')} className="mt-8 text-slate-500 text-xs font-bold">العودة للرئيسية</button>
        </div>
      );
  }

  return (
    <div className="h-screen w-full bg-[#020617] flex flex-col overflow-hidden text-white" dir="rtl">
      {/* Header */}
      <header className="bg-[#0d1117] border-b border-white/5 p-4 flex items-center justify-between z-50 shadow-md">
          <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center text-primary border border-primary/20"><ShieldCheck size={18} /></div>
              <div>
                  <h1 className="text-white font-black text-sm">لوحة الإدارة</h1>
                  <p className="text-[9px] text-slate-500 font-bold uppercase">Master Control v2.0</p>
              </div>
          </div>
          <button onClick={handleAdminLogout} className="w-9 h-9 bg-rose-500/10 rounded-lg flex items-center justify-center text-rose-500 hover:bg-rose-500/20"><LogOut size={16}/></button>
      </header>

      {/* Navigation */}
      <nav className="bg-[#0d1117] px-4 py-3 flex gap-2 overflow-x-auto border-b border-white/5 custom-scrollbar">
          {[
            { id: 'overview', label: 'البيانات', icon: Activity },
            { id: 'finance', label: 'المالية', icon: DollarSign },
            { id: 'withdrawals', label: 'السحوبات', icon: ArrowUpRight },
            { id: 'users', label: 'المستخدمين', icon: Users },
            { id: 'tasks', label: 'المهام', icon: Briefcase },
            { id: 'shop', label: 'المتجر', icon: ShoppingBag },
            { id: 'broadcast', label: 'إذاعة', icon: Megaphone }
          ].map(tab => (
              <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id as any)} 
                className={`px-4 py-2 rounded-lg text-[10px] font-black transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id ? 'bg-primary text-black' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
              >
                  <tab.icon size={14}/> {tab.label}
              </button>
          ))}
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-5 pb-32">
          {adminActionStatus && (
              <div className="mb-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-black rounded-xl p-3">
                  {adminActionStatus}
              </div>
          )}
          
          {/* TAB: OVERVIEW */}
          {activeTab === 'overview' && (
              <div className="space-y-4 animate-fade-in">
                  <div className="grid grid-cols-2 gap-3">
                      <div className="bg-[#0d1117] p-5 rounded-[1.5rem] border border-white/5 relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-bl-[3rem]"></div>
                          <Activity size={20} className="text-blue-500 mb-2"/>
                          <p className="text-[10px] text-slate-500 font-bold uppercase">الطلبات المعلقة</p>
                          <h4 className="text-2xl font-black mt-1">{stats.pendingTx}</h4>
                      </div>
                      <div className="bg-[#0d1117] p-5 rounded-[1.5rem] border border-white/5">
                          <DollarSign size={20} className="text-emerald-500 mb-2"/>
                          <p className="text-[10px] text-slate-500 font-bold uppercase">الإيرادات ($)</p>
                          <h4 className="text-2xl font-black mt-1">${(overviewStats?.revenue ?? stats.revenueUsd).toLocaleString()}</h4>
                      </div>
                      <div className="bg-[#0d1117] p-5 rounded-[1.5rem] border border-white/5">
                          <Users size={20} className="text-primary mb-2"/>
                          <p className="text-[10px] text-slate-500 font-bold uppercase">إجمالي المستخدمين</p>
                          <h4 className="text-2xl font-black mt-1">
                              {overviewStatsLoading ? '...' : (overviewStats?.totalUsers ?? 0).toLocaleString()}
                          </h4>
                          <span className="text-[9px] text-slate-600">
                              نشط خلال 7 أيام: {(overviewStats?.activeUsers ?? 0).toLocaleString()}
                          </span>
                      </div>
                      <div className="bg-[#0d1117] p-5 rounded-[1.5rem] border border-white/5">
                          <ShoppingBag size={20} className="text-purple-500 mb-2"/>
                          <p className="text-[10px] text-slate-500 font-bold uppercase">مجموع السحوبات</p>
                          <h4 className="text-2xl font-black mt-1">{stats.totalWithdrawn.toLocaleString()}</h4>
                      </div>
                  </div>
              </div>
          )}

          {/* TAB: BROADCAST */}
          {activeTab === 'broadcast' && (
              <div className="space-y-4 animate-fade-in">
                  <div className="bg-[#0d1117] p-5 rounded-[1.5rem] border border-white/5">
                      <h3 className="text-white font-black text-sm mb-4 flex items-center gap-2">
                          <Megaphone size={18} className="text-primary"/> إرسال إشعار للجميع
                      </h3>
                      <textarea 
                          value={broadcastMsg}
                          onChange={e => setBroadcastMsg(e.target.value)}
                          placeholder="اكتب رسالتك هنا..."
                          className="w-full bg-black/40 p-4 rounded-xl text-sm text-white border border-white/5 h-32 mb-4 outline-none focus:border-primary/50"
                      ></textarea>

                      <div className="space-y-2 mb-4">
                          <label className="text-[10px] text-slate-400 font-black">إرفاق صورة (اختياري)</label>
                          <div className="flex items-center gap-3">
                              <label className="flex-1 cursor-pointer bg-black/40 border border-white/10 rounded-lg p-3 flex items-center justify-center gap-2 hover:bg-white/5 transition-all">
                                  <UploadCloud size={16} className="text-primary"/>
                                  <span className="text-[10px] text-white font-bold">تحميل صورة من الجهاز</span>
                                  <input type="file" accept="image/*" onChange={handleBroadcastImageUpload} className="hidden" />
                              </label>
                              {broadcastImagePreview && (
                                  <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-white/10">
                                      <img src={broadcastImagePreview} alt="Broadcast" className="w-full h-full object-cover" />
                                      <button
                                        type="button"
                                        onClick={clearBroadcastImage}
                                        className="absolute top-0 right-0 w-5 h-5 bg-black/80 text-white flex items-center justify-center"
                                      >
                                        <X size={10}/>
                                      </button>
                                  </div>
                              )}
                          </div>
                          <p className="text-[10px] text-slate-500">الحد الأقصى للصورة: 3MB</p>
                      </div>
                      
                      <div className="flex justify-between items-center">
                          <p className="text-xs font-bold text-emerald-500">{broadcastStatus}</p>
                          <button 
                              onClick={handleBroadcast}
                              disabled={(!broadcastMsg && !broadcastImageData) || isBroadcasting}
                              className="bg-primary text-black px-6 py-3 rounded-xl font-black text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                              {isBroadcasting ? 'جاري الإرسال...' : 'إرسال الآن'}
                          </button>
                      </div>
                  </div>
              </div>
          )}

          {/* TAB: WITHDRAWALS */}
          {activeTab === 'withdrawals' && (
              <div className="space-y-4 animate-fade-in">
                  {withdrawalActionStatus && (
                      <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-black rounded-xl p-3">
                          {withdrawalActionStatus}
                      </div>
                  )}

                  <div className="grid grid-cols-4 gap-3 mb-6">
                      <div className="bg-[#0d1117] p-4 rounded-[1.5rem] border border-white/5">
                          <p className="text-[10px] text-slate-500 font-bold uppercase">الإجمالي</p>
                          <h4 className="text-xl font-black mt-1">{withdrawals.length}</h4>
                      </div>
                      <div className="bg-[#0d1117] p-4 rounded-[1.5rem] border border-white/5">
                          <p className="text-[10px] text-yellow-500 font-bold uppercase">قيد الانتظار</p>
                          <h4 className="text-xl font-black mt-1">{withdrawals.filter(w => w.status === 'pending').length}</h4>
                      </div>
                      <div className="bg-[#0d1117] p-4 rounded-[1.5rem] border border-white/5">
                          <p className="text-[10px] text-emerald-500 font-bold uppercase">مكتملة</p>
                          <h4 className="text-xl font-black mt-1">{withdrawals.filter(w => w.status === 'completed').length}</h4>
                      </div>
                      <div className="bg-[#0d1117] p-4 rounded-[1.5rem] border border-white/5">
                          <p className="text-[10px] text-red-500 font-bold uppercase">مرفوضة</p>
                          <h4 className="text-xl font-black mt-1">{withdrawals.filter(w => w.status === 'rejected').length}</h4>
                      </div>
                  </div>

                  {withdrawalsLoading ? (
                      <div className="text-center py-10 bg-[#0d1117] rounded-3xl border-dashed border border-white/10">
                          <p className="text-slate-500 text-xs">جاري التحميل...</p>
                      </div>
                  ) : withdrawals.length === 0 ? (
                      <div className="text-center py-10 bg-[#0d1117] rounded-3xl border-dashed border border-white/10">
                          <p className="text-slate-500 text-xs">لا توجد طلبات سحب</p>
                      </div>
                  ) : (
                      <div className="space-y-3">
                          {withdrawals.map(withdrawal => (
                              <div key={withdrawal.id} className={`bg-[#0d1117] p-5 rounded-[1.5rem] border ${withdrawal.status === 'pending' ? 'border-yellow-500/20 bg-yellow-500/5' : withdrawal.status === 'completed' ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
                                  <div className="flex items-start justify-between mb-3">
                                      <div className="flex-1">
                                          <div className="flex items-center gap-2 mb-1">
                                              <h4 className="text-white font-black text-sm">
                                                  {withdrawal.amount.toLocaleString()} تلايكر
                                              </h4>
                                              <span className={`text-[10px] font-black px-2 py-0.5 rounded ${withdrawal.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : withdrawal.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                                  {withdrawal.status === 'pending' ? 'قيد الانتظار' : withdrawal.status === 'completed' ? 'مكتمل' : 'مرفوض'}
                                              </span>
                                          </div>
                                          <p className="text-[10px] text-slate-400">
                                              {withdrawal.userName} • {withdrawal.method}
                                          </p>
                                          <p className="text-[10px] text-slate-600 font-mono mt-1">
                                              {withdrawal.bankAccount.recipientName} - {withdrawal.bankAccount.accountNumber}
                                          </p>
                                          <p className="text-[9px] text-slate-500 mt-1">
                                              {new Date(withdrawal.createdAt).toLocaleDateString('ar-IQ')} • {withdrawal.iqdAmount.toLocaleString()} دينار
                                          </p>
                                          {withdrawal.rejectionReason && (
                                              <p className="text-red-400 text-[10px] mt-2">السبب: {withdrawal.rejectionReason}</p>
                                          )}
                                      </div>
                                  </div>

                                  {withdrawal.status === 'pending' && (
                                      <div className="mt-3 pt-3 border-t border-white/10 flex gap-2">
                                          <button
                                              onClick={() => handleApproveWithdrawal(withdrawal.id)}
                                              className="flex-1 bg-emerald-500 text-black py-2 rounded-lg text-[11px] font-black hover:bg-emerald-400 flex items-center justify-center gap-1"
                                          >
                                              <Check size={12}/> قبول
                                          </button>
                                          <button
                                              onClick={() => {
                                                  const reason = prompt('سبب الرفض:');
                                                  if (reason) handleRejectWithdrawal(withdrawal.id, reason);
                                              }}
                                              className="flex-1 bg-red-500/20 text-red-400 py-2 rounded-lg text-[11px] font-black hover:bg-red-500/30 border border-red-500/20 flex items-center justify-center gap-1"
                                          >
                                              <X size={12}/> رفض
                                          </button>
                                      </div>
                                  )}
                              </div>
                          ))}
                      </div>
                  )}
              </div>
          )}

          {/* TAB: FINANCE */}
          {activeTab === 'finance' && (
              <div className="space-y-4 animate-fade-in">
                  <h3 className="text-xs font-black text-slate-500 px-1">الطلبات المعلقة</h3>
                  {transactions.filter(t => t.status === TransactionStatus.PENDING).length === 0 ? (
                      <div className="text-center py-10 bg-[#0d1117] rounded-3xl border-dashed border border-white/10">
                          <p className="text-slate-500 text-xs">لا توجد طلبات معلقة حالياً</p>
                      </div>
                  ) : (
                      transactions.filter(t => t.status === TransactionStatus.PENDING).map(tx => (
                          <div key={tx.id} className="bg-[#0d1117] p-5 rounded-[1.5rem] border border-white/5 flex flex-col gap-3">
                              <div className="flex justify-between items-start">
                                  <div>
                                      <span className={`text-[10px] font-black px-2 py-0.5 rounded ${tx.type === TransactionType.DEPOSIT ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                          {tx.type === TransactionType.DEPOSIT ? 'إيداع' : 'سحب'}
                                      </span>
                                      <h4 className="text-white font-black mt-1 text-sm">
                                          {tx.usdAmount ? `$${tx.usdAmount}` : `${tx.amount.toLocaleString()} P`}
                                      </h4>
                                      <p className="text-[10px] text-slate-500 font-mono mt-1">{tx.method} • {tx.txId || 'No ID'}</p>
                                  </div>
                                  <div className="text-left">
                                      <p className="text-[10px] text-slate-400">{tx.date}</p>
                                  </div>
                              </div>
                              <div className="flex gap-2 mt-1">
                                  <button onClick={() => adminProcessTransaction(tx.id, TransactionStatus.COMPLETED)} className="flex-1 bg-emerald-500 text-black py-2 rounded-lg text-[10px] font-black hover:bg-emerald-400 flex items-center justify-center gap-1">
                                      <Check size={12}/> قبول
                                  </button>
                                  <button onClick={() => adminProcessTransaction(tx.id, TransactionStatus.REJECTED)} className="flex-1 bg-rose-500/10 text-rose-500 py-2 rounded-lg text-[10px] font-black hover:bg-rose-500/20 border border-rose-500/20 flex items-center justify-center gap-1">
                                      <X size={12}/> رفض
                                  </button>
                              </div>
                          </div>
                      ))
                  )}
                  
                  <h3 className="text-xs font-black text-slate-500 px-1 mt-6">سجل العمليات السابقة</h3>
                  <div className="space-y-2 opacity-60">
                      {transactions.filter(t => t.status !== TransactionStatus.PENDING).slice(0, 5).map(tx => (
                           <div key={tx.id} className="bg-[#0d1117] p-3 rounded-xl border border-white/5 flex justify-between items-center">
                                <span className="text-[10px] text-slate-400">{tx.type}</span>
                                <span className={`text-[10px] font-bold ${tx.status === TransactionStatus.COMPLETED ? 'text-emerald-500' : 'text-rose-500'}`}>{tx.status}</span>
                           </div>
                      ))}
                  </div>
              </div>
          )}

          {/* TAB: USERS */}
          {activeTab === 'users' && (
              <div className="space-y-4 animate-fade-in">
                  <div className="bg-[#0d1117] p-4 rounded-2xl border border-white/5 flex items-center gap-2">
                      <Search size={16} className="text-slate-500"/>
                      <input
                        type="text"
                        placeholder="بحث عن مستخدم..."
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        className="bg-transparent w-full text-xs text-white outline-none font-bold"
                      />
                      <button
                        onClick={loadUsers}
                        className="w-8 h-8 bg-primary text-black rounded-lg flex items-center justify-center"
                        title="تحديث"
                      >
                        <RefreshCw size={12}/>
                      </button>
                  </div>

                  {usersLoading ? (
                    <div className="text-center py-10 bg-[#0d1117] rounded-3xl border border-white/10">
                        <p className="text-slate-500 text-xs">جاري تحميل المستخدمين...</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                        {adminUsers.map(row => {
                            const photoUrl = String(row.photo_url || '').trim();
                            const showPhoto = Boolean(photoUrl) && !avatarErrorByUserId[row.id];
                            return (
                            <div key={row.id} className="bg-[#0d1117] p-4 rounded-[1.5rem] border border-white/5 space-y-3">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3 min-w-0">
                                        {showPhoto ? (
                                            <img
                                              src={photoUrl}
                                              alt={row.name}
                                              referrerPolicy="no-referrer"
                                              className="w-10 h-10 rounded-full object-cover border border-white/15 bg-black/40 shrink-0"
                                              onError={() => {
                                                setAvatarErrorByUserId(prev =>
                                                  prev[row.id] ? prev : { ...prev, [row.id]: true }
                                                );
                                              }}
                                            />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full border border-white/15 bg-black/40 text-slate-400 flex items-center justify-center shrink-0">
                                                <UserCircle2 size={18} />
                                            </div>
                                        )}
                                        <div className="min-w-0">
                                            <p className="text-xs font-black text-white truncate">
                                                {row.name} {row.username ? `(@${row.username})` : ''}
                                            </p>
                                            <p className="text-[10px] text-slate-500 font-mono truncate">ID: {row.id}</p>
                                            <p className="text-[10px] text-slate-600">Last seen: {formatTime(row.lastSeenAt)}</p>
                                        </div>
                                    </div>
                                    <button
                                      onClick={() => handleToggleBan(row)}
                                      className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${row.isBanned ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}
                                    >
                                        {row.isBanned ? <Unlock size={16}/> : <Ban size={16}/>}
                                    </button>
                                </div>

                                <div className="flex items-center gap-2 text-primary text-[11px] font-black">
                                    <Coins size={13}/> {Math.floor(row.balance || 0).toLocaleString()} نقطة
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <input
                                      type="number"
                                      value={pointsDeltaInput[row.id] || ''}
                                      onChange={(e) => setPointsDeltaInput(prev => ({ ...prev, [row.id]: e.target.value }))}
                                      placeholder="قيمة الإضافة/الخصم"
                                      className="bg-black/40 p-2 rounded-lg text-[11px] text-white border border-white/10"
                                    />
                                    <div className="flex gap-2">
                                        <button onClick={() => handleAddPoints(row)} className="flex-1 bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 rounded-lg text-[10px] font-black py-2">
                                            إضافة
                                        </button>
                                        <button onClick={() => handleSubtractPoints(row)} className="flex-1 bg-rose-500/15 text-rose-400 border border-rose-500/25 rounded-lg text-[10px] font-black py-2">
                                            خصم
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <input
                                      type="number"
                                      value={pointsSetInput[row.id] || ''}
                                      onChange={(e) => setPointsSetInput(prev => ({ ...prev, [row.id]: e.target.value }))}
                                      placeholder="تثبيت الرصيد"
                                      className="bg-black/40 p-2 rounded-lg text-[11px] text-white border border-white/10"
                                    />
                                    <button onClick={() => handleSetPoints(row)} className="bg-primary text-black rounded-lg text-[10px] font-black py-2">
                                        تثبيت النقاط
                                    </button>
                                </div>
                            </div>
                        )})}
                        {!adminUsers.length && (
                            <div className="text-center py-10 bg-[#0d1117] rounded-3xl border border-dashed border-white/10">
                                <p className="text-slate-500 text-xs">لا يوجد مستخدمون مطابقون للبحث</p>
                            </div>
                        )}
                    </div>
                  )}
              </div>
          )}

          {/* TAB: TASKS */}
          {activeTab === 'tasks' && (
              <div className="space-y-4 animate-fade-in">
                  <button onClick={() => setShowTaskForm(!showTaskForm)} className="w-full bg-primary text-black py-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 mb-4">
                      <Plus size={16}/> إضافة مهمة جديدة
                  </button>

                  {showTaskForm && (
                      <div className="bg-[#0d1117] p-5 rounded-[1.5rem] border border-white/10 mb-4 space-y-3">
                          <input type="text" placeholder="عنوان المهمة" value={newTask.title} onChange={e=>setNewTask({...newTask, title: e.target.value})} className="w-full bg-black/40 p-3 rounded-lg text-xs text-white border border-white/5"/>
                          <input type="number" placeholder="المكافأة (نقاط)" value={newTask.reward} onChange={e=>setNewTask({...newTask, reward: Number(e.target.value)})} className="w-full bg-black/40 p-3 rounded-lg text-xs text-white border border-white/5"/>
                          <input type="text" placeholder="الرابط (اختياري)" value={newTask.link} onChange={e=>setNewTask({...newTask, link: e.target.value})} className="w-full bg-black/40 p-3 rounded-lg text-xs text-white border border-white/5"/>
                          <select value={newTask.type} onChange={e=>setNewTask({...newTask, type: e.target.value as any})} className="w-full bg-black/40 p-3 rounded-lg text-xs text-white border border-white/5">
                              <option value="social">Social</option>
                              <option value="ad">Ad/Video</option>
                              <option value="daily">Daily</option>
                          </select>
                          <button onClick={handleAddTask} className="w-full bg-emerald-600 py-2 rounded-lg text-xs font-black">حفظ ونشر</button>
                      </div>
                  )}

                  <div className="space-y-3">
                      {tasks.map(task => (
                          <div key={task.id} className="bg-[#0d1117] p-4 rounded-2xl border border-white/5 flex justify-between items-center group">
                              <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-500"><Briefcase size={18}/></div>
                                  <div>
                                      <p className="text-xs font-black text-white">{task.title}</p>
                                      <p className="text-[10px] text-primary">+{task.reward}</p>
                                  </div>
                              </div>
                              <button onClick={() => handleDeleteTask(task.id)} className="w-8 h-8 bg-rose-500/10 text-rose-500 rounded-lg flex items-center justify-center active:scale-90"><Trash2 size={14}/></button>
                          </div>
                      ))}
                  </div>
              </div>
          )}

          {/* TAB: SHOP */}
          {activeTab === 'shop' && (
              <div className="space-y-4 animate-fade-in">
                  <button onClick={() => setShowProdForm(!showProdForm)} className="w-full bg-primary text-black py-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 mb-4">
                      <Plus size={16}/> إضافة منتج جديد
                  </button>

                  {showProdForm && (
                      <div className="bg-[#0d1117] p-5 rounded-[1.5rem] border border-white/10 mb-4 space-y-3">
                          <input type="text" placeholder="اسم المنتج" value={newProd.name} onChange={e=>setNewProd({...newProd, name: e.target.value})} className="w-full bg-black/40 p-3 rounded-lg text-xs text-white border border-white/5"/>
                          <textarea placeholder="الوصف" value={newProd.description} onChange={e=>setNewProd({...newProd, description: e.target.value})} className="w-full bg-black/40 p-3 rounded-lg text-xs text-white border border-white/5 h-20"></textarea>
                          <div className="grid grid-cols-2 gap-3">
                             <input type="number" placeholder="السعر (نقاط)" value={newProd.pricePoints} onChange={e=>setNewProd({...newProd, pricePoints: Number(e.target.value)})} className="w-full bg-black/40 p-3 rounded-lg text-xs text-white border border-white/5"/>
                             <input type="number" placeholder="السعر (نجوم تلجرام)" value={newProd.priceStars} onChange={e=>setNewProd({...newProd, priceStars: Number(e.target.value)})} className="w-full bg-black/40 p-3 rounded-lg text-xs text-white border border-white/5"/>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                             <input type="number" placeholder="الربح/ثانية" value={newProd.earningRate} onChange={e=>setNewProd({...newProd, earningRate: Number(e.target.value)})} className="w-full bg-black/40 p-3 rounded-lg text-xs text-white border border-white/5"/>
                             <select value={newProd.category || 'mining'} onChange={e=>setNewProd({...newProd, category: e.target.value})} className="w-full bg-black/40 p-3 rounded-lg text-xs text-white border border-white/5">
                                <option value="mining">Mining</option>
                                <option value="development">Development</option>
                             </select>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                             <label className="bg-black/40 p-3 rounded-lg text-[10px] text-white border border-white/5 flex items-center gap-2">
                                <input type="checkbox" checked={Boolean(newProd.allowPoints ?? true)} onChange={e => setNewProd({ ...newProd, allowPoints: e.target.checked })} />
                                الشراء بالنقاط
                             </label>
                             <label className="bg-black/40 p-3 rounded-lg text-[10px] text-white border border-white/5 flex items-center gap-2">
                                <input type="checkbox" checked={Boolean(newProd.allowStars ?? true)} onChange={e => setNewProd({ ...newProd, allowStars: e.target.checked })} />
                                الشراء بالنجوم
                             </label>
                          </div>
                          
                          {/* Image Upload Area */}
                          <div className="space-y-2">
                              <label className="text-[10px] text-slate-400 font-black">صورة المنتج (أو GIF)</label>
                              <div className="flex items-center gap-3">
                                  <label className="flex-1 cursor-pointer bg-black/40 border border-white/10 rounded-lg p-3 flex items-center justify-center gap-2 hover:bg-white/5 transition-all">
                                      <UploadCloud size={16} className="text-primary"/>
                                      <span className="text-[10px] text-white font-bold">اختر صورة</span>
                                      <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleImageUpload} className="hidden" />
                                  </label>
                                  {imagePreview && (
                                      <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/10">
                                          <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                      </div>
                                  )}
                              </div>
                              <p className="text-[10px] text-slate-500">الأنواع المدعومة: JPG/PNG/WEBP/GIF • الحجم الأقصى: 2.5MB</p>
                              <input
                                type="url"
                                placeholder="أو ضع رابط مباشر للصورة/GIF (اختياري)"
                                value={typeof newProd.imageData === 'string' && /^https?:\/\//i.test(newProd.imageData) ? newProd.imageData : ''}
                                onChange={(e) => {
                                  const url = e.target.value.trim();
                                  setNewProd(prev => ({ ...prev, imageData: url }));
                                  setImagePreview(url);
                                }}
                                className="w-full bg-black/40 p-3 rounded-lg text-xs text-white border border-white/5"
                              />
                          </div>

                          <button onClick={handleAddProduct} className="w-full bg-emerald-600 py-2 rounded-lg text-xs font-black">نشر المنتج</button>
                      </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                      {digitalProducts.map(prod => (
                          <div key={prod.id} className="bg-[#0d1117] p-4 rounded-[1.5rem] border border-white/5 relative">
                              <div className="absolute top-2 left-2 flex gap-1 z-10">
                                  <button onClick={() => startEditProduct(prod)} className="w-7 h-7 bg-blue-500/20 text-blue-300 rounded-full flex items-center justify-center"><Pencil size={11}/></button>
                                  <button
                                    onClick={async () => {
                                      const result = await adminDeleteProduct(prod.id);
                                      showAdminActionStatus(result.message);
                                    }}
                                    className="w-7 h-7 bg-rose-500/20 text-rose-500 rounded-full flex items-center justify-center"
                                  >
                                    <Trash2 size={12}/>
                                  </button>
                              </div>
                              <div className="h-24 bg-black/40 rounded-xl mb-3 overflow-hidden">
                                  <img src={prod.imageData} className="w-full h-full object-cover"/>
                              </div>
                              <h4 className="text-white font-black text-xs mb-1 truncate">{prod.name}</h4>
                              <div className="flex justify-between items-center">
                                  <span className="text-[10px] text-primary font-bold">{prod.pricePoints} P</span>
                                  <span className="text-[9px] text-amber-300 bg-amber-500/10 border border-amber-400/30 px-1.5 py-0.5 rounded-full flex items-center gap-1"><Star size={8} className="fill-amber-300"/> {prod.priceStars}</span>
                              </div>
                              <div className="mt-1 text-[9px] text-slate-500 flex items-center gap-1"><Zap size={8}/> {prod.earningRate}/s</div>

                              {editingProductId === prod.id && (
                                <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                                    <input type="text" value={editProd.name || ''} onChange={e => setEditProd({ ...editProd, name: e.target.value })} placeholder="اسم المنتج" className="w-full bg-black/40 p-2 rounded-lg text-[11px] text-white border border-white/10"/>
                                    <textarea value={editProd.description || ''} onChange={e => setEditProd({ ...editProd, description: e.target.value })} placeholder="الوصف" className="w-full bg-black/40 p-2 rounded-lg text-[11px] text-white border border-white/10 h-14"></textarea>
                                    <div className="grid grid-cols-2 gap-2">
                                        <input type="number" value={editProd.pricePoints ?? 0} onChange={e => setEditProd({ ...editProd, pricePoints: Number(e.target.value) })} placeholder="السعر نقاط" className="w-full bg-black/40 p-2 rounded-lg text-[11px] text-white border border-white/10"/>
                                        <input type="number" value={editProd.priceStars ?? 0} onChange={e => setEditProd({ ...editProd, priceStars: Number(e.target.value) })} placeholder="السعر نجوم" className="w-full bg-black/40 p-2 rounded-lg text-[11px] text-white border border-white/10"/>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <input type="number" value={editProd.earningRate ?? 0} onChange={e => setEditProd({ ...editProd, earningRate: Number(e.target.value) })} placeholder="الربح/ث" className="w-full bg-black/40 p-2 rounded-lg text-[11px] text-white border border-white/10"/>
                                        <select value={String(editProd.category || 'mining')} onChange={e => setEditProd({ ...editProd, category: e.target.value })} className="w-full bg-black/40 p-2 rounded-lg text-[11px] text-white border border-white/10">
                                            <option value="mining">Mining</option>
                                            <option value="development">Development</option>
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button onClick={saveEditedProduct} className="bg-emerald-600 text-white rounded-lg text-[10px] font-black py-2">حفظ</button>
                                        <button onClick={cancelEditProduct} className="bg-slate-700 text-slate-200 rounded-lg text-[10px] font-black py-2">إلغاء</button>
                                    </div>
                                </div>
                              )}
                          </div>
                      ))}
                  </div>
              </div>
          )}

      </main>
    </div>
  );
};

export default Admin;
