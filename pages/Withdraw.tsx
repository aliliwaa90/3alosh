import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { 
  ArrowRightLeft, 
  Wallet, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Landmark,
  CreditCard,
  Smartphone,
  Coins
} from 'lucide-react';
import { Withdrawal } from '../types';

const Withdraw: React.FC = () => {
  const { user } = useGame();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'zain-cash' | 'k-card' | 'fib' | 'okx' | 'binance'>('zain-cash');
  const [accountNumber, setAccountNumber] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [bankName, setBankName] = useState('');
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState<'withdraw' | 'history'>('withdraw');

  const MINIMUM_WITHDRAWAL = 10000;
  const currentBalance = user?.balance || 0;

  // Ultra-vibrant gaming style method configurations
  const methods = [
    { id: 'zain-cash', name: 'زين كاش', icon: Smartphone, color: 'from-orange-400 to-red-500', shadow: 'shadow-orange-500/50' },
    { id: 'k-card', name: 'كي-كارد', icon: CreditCard, color: 'from-emerald-400 to-teal-500', shadow: 'shadow-emerald-500/50' },
    { id: 'fib', name: 'بنك FIB', icon: Landmark, color: 'from-blue-400 to-indigo-500', shadow: 'shadow-blue-500/50' },
    { id: 'binance', name: 'بينانس', icon: Coins, color: 'from-yellow-300 to-yellow-500', shadow: 'shadow-yellow-500/50' },
    { id: 'okx', name: 'OKX', icon: Wallet, color: 'from-zinc-300 to-zinc-500', shadow: 'shadow-zinc-500/50' },
  ] as const;

  const fetchWithdrawals = async () => {
    try {
      if (!user?.id) return;
      const response = await fetch(`/api/withdrawals/user/${user.id}`);
      const data = await response.json();
      if (data.success) {
        setWithdrawals(data.withdrawals);
      }
    } catch (err) {
      console.error('Failed to fetch withdrawals:', err);
    }
  };

  useEffect(() => {
    if (user?.id) fetchWithdrawals();
  }, [user?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const numAmount = Number(amount);

    if (!user?.id) return setError('حساب المستخدم غير متوفر.');
    if (numAmount < MINIMUM_WITHDRAWAL) return setError(`الحد الأدنى للسحب هو ${MINIMUM_WITHDRAWAL.toLocaleString()} نقطة.`);
    if (numAmount > currentBalance) return setError('رصيدك الحالي لا يكفي لهذا السحب.');
    if (!accountNumber.trim() || !recipientName.trim()) return setError('جميع حقول الحساب مطلوبة بشدة.');

    setIsLoading(true);

    try {
      const response = await fetch('/api/withdrawals/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          amount: numAmount,
          method,
          bankAccount: {
            accountNumber: accountNumber.trim(),
            recipientName: recipientName.trim(),
            bankName: bankName.trim() || undefined,
          },
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) return setError(data.error || 'عذراً، حدث خطأ أثناء الاتصال بالخادم.');

      setSuccess('انطلق طلبك بنجاح للتدقيق!');
      setAmount('');
      setAccountNumber('');
      setRecipientName('');
      setBankName('');
      await fetchWithdrawals();
      
      // Auto switch to history after a brief success show
      setTimeout(() => {
        setActiveTab('history');
        setSuccess('');
      }, 2500);

    } catch (err) {
      setError('فشل الاتصال بالخادم. يرجى التحقق من لوحة تحكم Vercel.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': case 'approved':
        return <span className="flex items-center gap-1 bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-1 rounded-md text-xs font-bold"><CheckCircle2 className="w-3 h-3" /> تم الدفع</span>;
      case 'rejected':
        return <span className="flex items-center gap-1 bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-1 rounded-md text-xs font-bold"><XCircle className="w-3 h-3" /> مرفوض</span>;
      default:
        return <span className="flex items-center gap-1 bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 px-2 py-1 rounded-md text-xs font-bold"><Clock className="w-3 h-3" /> قيد المراجعة</span>;
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans pb-32 overflow-x-hidden relative" dir="rtl">
      
      {/* Immersive Animated Background Elements */}
      <div className="fixed top-0 left-0 w-full h-[400px] bg-gradient-to-b from-yellow-500/10 to-transparent pointer-events-none z-0"></div>
      <div className="fixed -top-32 -right-32 w-96 h-96 bg-yellow-600/20 rounded-full blur-[100px] pointer-events-none z-0"></div>
      <div className="fixed top-32 -left-32 w-80 h-80 bg-orange-600/10 rounded-full blur-[100px] pointer-events-none z-0"></div>

      <div className="relative z-10 max-w-md mx-auto pt-6 px-4">
        
        {/* Dynamic Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-600 tracking-tight drop-shadow-sm">
              سحب الأرباح
            </h1>
            <p className="text-sm font-medium text-slate-400 mt-1">حوّل مجهودك إلى أموال حقيقية!</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-400/20 to-orange-500/20 border border-yellow-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(234,179,8,0.2)]">
            <Landmark className="w-6 h-6 text-yellow-400" />
          </div>
        </div>

        {/* Tab Switcher - Gaming Pill Style */}
        <div className="flex bg-slate-900/80 backdrop-blur-md p-1.5 rounded-[20px] mb-8 border border-slate-800 shadow-inner relative">
          <button 
            onClick={() => setActiveTab('withdraw')}
            className={`flex-1 relative z-10 py-3 text-sm font-bold rounded-2xl transition-all duration-300 ${activeTab === 'withdraw' ? 'text-black' : 'text-slate-400 hover:text-slate-200'}`}
          >
            طلب سحب
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`flex-1 relative z-10 py-3 text-sm font-bold rounded-2xl transition-all duration-300 ${activeTab === 'history' ? 'text-black' : 'text-slate-400 hover:text-slate-200'}`}
          >
            السجل المالي
          </button>
          
          {/* Animated Slidable Tab Background */}
          <div 
            className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-gradient-to-r from-yellow-400 to-amber-500 rounded-2xl shadow-[0_0_15px_rgba(251,191,36,0.5)] transition-transform duration-500 ease-spring ${
              activeTab === 'withdraw' ? 'translate-x-0 right-1.5' : '-translate-x-full right-[calc(50%+4px)]'
            }`}
          ></div>
        </div>

        {activeTab === 'withdraw' && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-500">
            
            {/* The Ultimate Balance Card */}
            <div className="relative mb-8 group">
              {/* Outer Glow */}
              <div className="absolute -inset-1 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-[28px] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
              
              <div className="relative bg-[#0b0f19] border border-slate-800 rounded-[24px] p-6 overflow-hidden">
                {/* Internal Shimmer */}
                <div className="absolute top-0 right-0 w-full h-[1px] bg-gradient-to-l from-transparent via-yellow-400/50 to-transparent"></div>
                <div className="absolute bottom-0 right-0 w-full h-[1px] bg-gradient-to-l from-transparent via-yellow-400/10 to-transparent"></div>
                
                <h3 className="text-slate-400 text-sm font-bold mb-2 flex items-center gap-2">
                  الرصيد القابل للسحب <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span></span>
                </h3>
                
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 drop-shadow-md">
                    {currentBalance.toLocaleString()}
                  </span>
                  <span className="text-yellow-500 font-bold text-lg tracking-widest">تلايكر</span>
                </div>

                {/* Progress to minimum bar */}
                <div className="space-y-2">
                   <div className="flex justify-between text-[11px] font-bold">
                     <span className={currentBalance >= MINIMUM_WITHDRAWAL ? 'text-green-400' : 'text-slate-500'}>
                       {currentBalance >= MINIMUM_WITHDRAWAL ? 'مؤهل للسحب المباشر' : `ينقصك ${(MINIMUM_WITHDRAWAL - currentBalance).toLocaleString()} تلايكر`}
                     </span>
                     <span className="text-slate-400">الحد: {MINIMUM_WITHDRAWAL.toLocaleString()}</span>
                   </div>
                   <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                      <div 
                        className={`h-full bg-gradient-to-l ${currentBalance >= MINIMUM_WITHDRAWAL ? 'from-green-400 to-emerald-600' : 'from-yellow-400 to-orange-500'} relative transition-all duration-1000 ease-out`}
                        style={{ width: `${Math.min(100, (currentBalance / MINIMUM_WITHDRAWAL) * 100)}%` }}
                      >
                         <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]"></div>
                      </div>
                   </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Futuristic Input Field */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-300 pr-1">المبلغ المطلوب سحبه</label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-yellow-500/20 rounded-2xl blur-md opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                  <div className="relative flex items-center bg-[#0b0f19] border border-slate-800 focus-within:border-yellow-500/50 rounded-2xl overflow-hidden transition-colors">
                    <div className="px-4 text-yellow-500">
                      <Coins className="w-6 h-6" />
                    </div>
                    <input 
                      type="number" 
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder={`${MINIMUM_WITHDRAWAL}...`}
                      className="w-full bg-transparent text-white text-2xl font-black py-4 outline-none placeholder:text-slate-700 font-mono"
                    />
                    <button 
                      type="button" 
                      onClick={() => setAmount(currentBalance.toString())}
                      className="ml-2 mr-3 px-3 py-1.5 bg-slate-800 text-xs text-yellow-400 font-bold rounded-lg hover:bg-slate-700 transition"
                    >
                      الكل
                    </button>
                  </div>
                </div>
              </div>

              {/* Gaming Style Grid for Payment Methods */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-300 pr-1 flex justify-between items-center">
                  <span>طريقة الاستلام</span>
                  {method && <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">{methods.find(m => m.id === method)?.name}</span>}
                </label>
                
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {methods.map((m) => {
                    const isSelected = method === m.id;
                    const Icon = m.icon;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setMethod(m.id as any)}
                        className={`relative p-3 rounded-2xl flex flex-col items-center justify-center gap-2 outline-none transition-all duration-300 overflow-hidden ${
                          isSelected 
                            ? 'bg-[#0b0f19] border-2 border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.2)] scale-[1.03] z-10' 
                            : 'bg-[#0b0f19] border border-slate-800 hover:border-slate-600 hover:bg-slate-800/50 text-slate-500'
                        }`}
                      >
                        {isSelected && (
                          <div className={`absolute inset-0 bg-gradient-to-br ${m.color} opacity-10`}></div>
                        )}
                        <div className={`p-2 rounded-xl transition-colors duration-300 ${isSelected ? `bg-gradient-to-br ${m.color} text-white ${m.shadow}` : 'bg-slate-800 text-slate-400'}`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <span className={`text-xs font-bold transition-colors ${isSelected ? 'text-white' : 'text-slate-400'}`}>
                          {m.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Data Form - Sleek Dark Inputs */}
              <div className="bg-[#0b0f19] border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-2 block tracking-wider uppercase">اسم صاحب الحساب الثلاثي</label>
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    dir="auto"
                    className="w-full bg-slate-900 border border-slate-800 focus:border-yellow-500/50 rounded-xl px-4 py-3 text-white text-sm font-semibold outline-none transition-all placeholder-slate-700"
                    placeholder="محمد احمد علي..."
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-2 block tracking-wider uppercase">رقم الحساب أو المحفظة</label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    dir="ltr"
                    className="w-full bg-slate-900 border border-slate-800 focus:border-yellow-500/50 rounded-xl px-4 py-3 text-cyan-400 text-left font-mono text-sm tracking-widest outline-none transition-all placeholder-slate-700"
                    placeholder="07X XXXX XXXX"
                  />
                </div>
                {['fib', 'zain-cash', 'k-card'].includes(method) && (
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-2 block tracking-wider uppercase">ملاحظات إضافية (اختياري)</label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      dir="auto"
                      className="w-full bg-slate-900 border border-slate-800 focus:border-slate-600 rounded-xl px-4 py-3 text-slate-300 text-sm font-medium outline-none transition-all placeholder-slate-700"
                      placeholder="اسم الفرع، رقم الهاتف..."
                    />
                  </div>
                )}
              </div>

              {/* Alerts */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl flex items-start gap-3 backdrop-blur-md animate-in slide-in-from-bottom-2">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <span className="text-sm font-bold leading-relaxed">{error}</span>
                </div>
              )}
              {success && (
                <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-2xl flex items-start gap-3 backdrop-blur-md animate-in slide-in-from-bottom-2">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <span className="text-sm font-bold leading-relaxed">{success}</span>
                </div>
              )}

              {/* Massive Call To Action */}
              <button
                type="submit"
                disabled={isLoading || currentBalance < MINIMUM_WITHDRAWAL}
                className="w-full relative overflow-hidden group rounded-[20px] p-[2px] mt-6 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.01] active:scale-[0.98]"
              >
                {/* Background Rotating Gradient */}
                {!(isLoading || currentBalance < MINIMUM_WITHDRAWAL) && (
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-400 bg-[length:200%_auto] animate-[shimmer_3s_linear_infinite]"></div>
                )}
                <div className={`relative flex items-center justify-center gap-2 w-full py-4 rounded-[18px] font-black text-lg transition-all ${
                  isLoading || currentBalance < MINIMUM_WITHDRAWAL 
                    ? 'bg-slate-800 text-slate-500' 
                    : 'bg-black text-yellow-400 hover:bg-neutral-900 shadow-xl'
                }`}>
                  {isLoading ? (
                    <div className="w-6 h-6 border-2 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin"></div>
                  ) : (
                    <>
                      تأكيد عملية السحب <ArrowRightLeft className="w-5 h-5 -scale-x-100 opacity-80" />
                    </>
                  )}
                </div>
              </button>

            </form>
          </div>
        )}

        {/* --- History View --- */}
        {activeTab === 'history' && (
          <div className="animate-in fade-in slide-in-from-right-8 duration-500 space-y-4">
            {withdrawals.length === 0 ? (
              <div className="flex flex-col items-center justify-center bg-[#0b0f19] border border-slate-800 rounded-3xl py-16 px-6 text-center">
                <div className="w-20 h-20 bg-slate-900 rounded-full border border-slate-800 flex items-center justify-center mb-4">
                  <Clock className="w-8 h-8 text-slate-600" />
                </div>
                <h3 className="text-xl font-black text-white mb-2">السجل المالي نظيف</h3>
                <p className="text-slate-500 text-sm font-medium">قم بإجراء سحبك الأول ليظهر التاريخ هنا.</p>
              </div>
            ) : (
              withdrawals.map((w, i) => {
                const methodInfo = methods.find(m => m.id === w.method) || { name: w.method, icon: Landmark, color: 'from-slate-500 to-slate-700' };
                const Icon = methodInfo.icon;
                
                return (
                  <div key={w.id} className="relative group overflow-hidden bg-[#0b0f19] border border-slate-800 hover:border-slate-700 rounded-3xl p-5 transition-all outline-none animate-in fade-in" style={{ animationDelay: `${i * 100}ms` }}>
                    
                    <div className="flex justify-between items-start mb-4 relative z-10">
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-2xl bg-gradient-to-br ${methodInfo.color} shrink-0 shadow-lg text-white`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="text-xl font-black text-white tracking-tight">{w.iqdAmount.toLocaleString()} <span className="text-xs text-slate-500 font-bold">تلايكر</span></div>
                          <div className="text-xs text-slate-400 font-bold mt-1">{methodInfo.name}</div>
                        </div>
                      </div>
                      <div className="-mt-1">
                        {getStatusBadge(w.status)}
                      </div>
                    </div>

                    <div className="bg-slate-900/50 rounded-2xl p-4 space-y-2 border border-slate-800/50 text-xs font-semibold relative z-10">
                      <div className="flex justify-between items-center text-slate-400">
                        <span>إلى حساب:</span>
                        <span className="text-slate-200">{w.bankAccount.recipientName}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-400">
                        <span>الرقم:</span>
                        <span className="font-mono text-cyan-400 tracking-wider bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-800">{w.bankAccount.accountNumber}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-500 text-[10px] pt-2 border-t border-slate-800/50 mt-2">
                        <span>المعرف: {w.id.slice(-8)}</span>
                        <span>{new Date(w.createdAt).toLocaleString('ar-IQ', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default Withdraw;
