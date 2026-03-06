
import React, { useState, useMemo } from 'react';
import { useGame } from '../context/GameContext';
import { TransactionStatus, TransactionType, Task, DigitalProduct } from '../types';
import { 
    ShieldCheck, LogOut, Activity, Users, DollarSign, 
    ShoppingBag, Search, Plus, Trash2, Check, X, 
    Briefcase, Ban, Unlock, Zap, TrendingUp, Image as ImageIcon, UploadCloud, Megaphone
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Admin: React.FC = () => {
  const { 
      user, transactions, tasks, digitalProducts, adminLogout,
      adminLogin,
      adminAddTask, adminDeleteTask, adminAddProduct, adminDeleteProduct,
      adminProcessTransaction, adminBanUser 
  } = useGame();
  
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'finance' | 'tasks' | 'shop' | 'broadcast'>('overview');
  
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

  // Stats Logic
  const stats = useMemo(() => ({
      totalPoints: user.balance, // Should be sum of all users in real backend
      pendingTx: transactions.filter(t => t.status === TransactionStatus.PENDING).length,
      revenueUsd: transactions.filter(t => t.type === TransactionType.DEPOSIT && t.status === TransactionStatus.COMPLETED).reduce((s, t) => s + (t.usdAmount || 0), 0),
      totalWithdrawn: transactions.filter(t => t.type === TransactionType.WITHDRAWAL && t.status === TransactionStatus.COMPLETED).reduce((s, t) => s + t.amount, 0),
  }), [user.balance, transactions]);

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
  const handleAddTask = () => {
      if (!newTask.title || !newTask.reward) return;
      adminAddTask({
          id: `t_${Date.now()}`,
          title: newTask.title,
          reward: Number(newTask.reward),
          type: newTask.type as any,
          link: newTask.link || '#'
      });
      setShowTaskForm(false);
      setNewTask({ type: 'social', reward: 1000, title: '', link: '' });
  };

  // Handler: Image Upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              const result = reader.result as string;
              setNewProd({ ...newProd, imageData: result });
              setImagePreview(result);
          };
          reader.readAsDataURL(file);
      }
  };

  // Handler: Add Product
  const handleAddProduct = () => {
      if (!newProd.name || !newProd.pricePoints) return;
      adminAddProduct({
          id: `p_${Date.now()}`,
          name: newProd.name,
          description: newProd.description || 'منتج تعدين',
          pricePoints: Number(newProd.pricePoints),
          priceStars: Number(newProd.priceStars || 50),
          earningRate: Number(newProd.earningRate || 0),
          imageData: newProd.imageData || 'https://via.placeholder.com/150',
          isFree: false,
          category: 'mining',
          allowPoints: true,
          allowStars: true
      });
      setShowProdForm(false);
      setNewProd({ pricePoints: 5000, earningRate: 0.1 });
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
                          <h4 className="text-2xl font-black mt-1">${stats.revenueUsd}</h4>
                      </div>
                      <div className="bg-[#0d1117] p-5 rounded-[1.5rem] border border-white/5">
                          <Users size={20} className="text-primary mb-2"/>
                          <p className="text-[10px] text-slate-500 font-bold uppercase">المستخدمين النشطين</p>
                          <h4 className="text-2xl font-black mt-1">1</h4>
                          <span className="text-[9px] text-slate-600">(Offline Mode)</span>
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
                      <input type="text" placeholder="بحث عن مستخدم..." className="bg-transparent w-full text-xs text-white outline-none font-bold" />
                  </div>
                  
                  {/* Mock Users List (Including current user) */}
                  <div className="space-y-3">
                      <div className="bg-[#0d1117] p-4 rounded-[1.5rem] border border-white/5 flex justify-between items-center">
                          <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-black">
                                  {user.name?.[0]}
                              </div>
                              <div>
                                  <p className="text-xs font-black text-white">{user.name} (أنت)</p>
                                  <p className="text-[10px] text-slate-500">ID: {user.id.substring(0,8)}...</p>
                              </div>
                          </div>
                          <button 
                            onClick={() => adminBanUser(user.id, !user.isBanned)} 
                            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${user.isBanned ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}
                          >
                              {user.isBanned ? <Unlock size={16}/> : <Ban size={16}/>}
                          </button>
                      </div>
                  </div>
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
                              <button onClick={() => adminDeleteTask(task.id)} className="w-8 h-8 bg-rose-500/10 text-rose-500 rounded-lg flex items-center justify-center active:scale-90"><Trash2 size={14}/></button>
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
                             <input type="number" placeholder="الربح/ثانية" value={newProd.earningRate} onChange={e=>setNewProd({...newProd, earningRate: Number(e.target.value)})} className="w-full bg-black/40 p-3 rounded-lg text-xs text-white border border-white/5"/>
                          </div>
                          
                          {/* Image Upload Area */}
                          <div className="space-y-2">
                              <label className="text-[10px] text-slate-400 font-black">صورة المنتج (أو GIF)</label>
                              <div className="flex items-center gap-3">
                                  <label className="flex-1 cursor-pointer bg-black/40 border border-white/10 rounded-lg p-3 flex items-center justify-center gap-2 hover:bg-white/5 transition-all">
                                      <UploadCloud size={16} className="text-primary"/>
                                      <span className="text-[10px] text-white font-bold">اختر صورة</span>
                                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                                  </label>
                                  {imagePreview && (
                                      <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/10">
                                          <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                      </div>
                                  )}
                              </div>
                          </div>

                          <button onClick={handleAddProduct} className="w-full bg-emerald-600 py-2 rounded-lg text-xs font-black">نشر المنتج</button>
                      </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                      {digitalProducts.map(prod => (
                          <div key={prod.id} className="bg-[#0d1117] p-4 rounded-[1.5rem] border border-white/5 relative">
                              <button onClick={() => adminDeleteProduct(prod.id)} className="absolute top-2 left-2 w-7 h-7 bg-rose-500/20 text-rose-500 rounded-full flex items-center justify-center z-10"><Trash2 size={12}/></button>
                              <div className="h-24 bg-black/40 rounded-xl mb-3 overflow-hidden">
                                  <img src={prod.imageData} className="w-full h-full object-cover"/>
                              </div>
                              <h4 className="text-white font-black text-xs mb-1 truncate">{prod.name}</h4>
                              <div className="flex justify-between items-center">
                                  <span className="text-[10px] text-primary font-bold">{prod.pricePoints} P</span>
                                  <span className="text-[9px] text-slate-500 flex items-center gap-1"><Zap size={8}/> {prod.earningRate}/s</span>
                              </div>
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
