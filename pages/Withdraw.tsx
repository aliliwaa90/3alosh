import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { ArrowUpRight, Send, AlertCircle, CheckCircle, Clock, DollarSign, Wallet } from 'lucide-react';
import { Withdrawal } from '../types';

const Withdraw: React.FC = () => {
  const { user } = useGame();
  const [amount, setAmount] = useState('10000');
  const [method, setMethod] = useState<'zain-cash' | 'k-card' | 'fib' | 'okx' | 'binance'>('zain-cash');
  const [accountNumber, setAccountNumber] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [bankName, setBankName] = useState('');
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState<'request' | 'history'>('request');

  const CONVERSION_RATE = 1; // 1 Tliker = 1 IQD
  const minimumWithdrawal = 10000; // 10,000 دينار عراقي
  const iqdAmount = Math.floor(Number(amount) * CONVERSION_RATE);

  const methodLabels: Record<string, { ar: string, icon: string }> = {
    'zain-cash': { ar: 'زين كاش', icon: '📱' },
    'k-card': { ar: 'كي-كارد', icon: '💳' },
    'fib': { ar: 'منصة FIB', icon: '🏦' },
    'okx': { ar: 'منصة OKX', icon: '📊' },
    'binance': { ar: 'بينانس', icon: '💰' },
  };

  // Fetch user's withdrawals
  useEffect(() => {
    const fetchWithdrawals = async () => {
      try {
        const response = await fetch(`/api/withdrawals/user/${user.id}`);
        const data = await response.json();
        if (data.success) {
          setWithdrawals(data.withdrawals);
        }
      } catch (err) {
        console.error('Failed to fetch withdrawals:', err);
      }
    };

    if (user.id) {
      fetchWithdrawals();
    }
  }, [user.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const numAmount = Number(amount);

    if (numAmount < minimumWithdrawal) {
      setError(`الحد الأدنى للسحب هو ${minimumWithdrawal.toLocaleString()} دينار عراقي`);
      return;
    }

    if (numAmount > user.balance) {
      setError('رصيدك غير كافي للسحب');
      return;
    }

    if (!accountNumber.trim()) {
      setError('أدخل رقم الحساب');
      return;
    }

    if (!recipientName.trim()) {
      setError('أدخل اسم المستقبل');
      return;
    }

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

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'حدث خطأ في السحب');
        return;
      }

      setSuccess('تم إرسال طلب السحب بنجاح! سيتم مراجعته من قبل الإدارة');
      setAmount('10000');
      setAccountNumber('');
      setRecipientName('');
      setBankName('');

      // Refresh withdrawals
      const refreshResponse = await fetch(`/api/withdrawals/user/${user.id}`);
      const refreshData = await refreshResponse.json();
      if (refreshData.success) {
        setWithdrawals(refreshData.withdrawals);
      }
    } catch (err) {
      setError('فشل الاتصال بالخادم');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return { bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', text: 'text-yellow-500', label: 'قيد الانتظار' };
      case 'completed':
        return { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-500', label: 'مكتمل' };
      case 'rejected':
        return { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-500', label: 'مرفوض' };
      case 'approved':
        return { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-500', label: 'موافق عليه' };
      default:
        return { bg: 'bg-slate-500/10', border: 'border-slate-500/20', text: 'text-slate-500', label: status };
    }
  };

  const progressPercentage = (user.balance / minimumWithdrawal) * 100;

  return (
    <div className="h-screen w-full overflow-y-auto overflow-x-hidden bg-gradient-to-br from-[#020617] via-[#0a0e1a] to-[#020617] pb-40 px-4 pt-10 custom-scrollbar scroll-smooth" dir="rtl">
      
      {/* Header with Gradient */}
      <div className="text-center mb-8">
        <div className="inline-flex p-4 bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 rounded-2xl border border-emerald-500/20 mb-4">
          <ArrowUpRight size={32} className="text-emerald-500" />
        </div>
        <h1 className="text-4xl font-black text-white tracking-tighter mb-1">سحب الأرباح</h1>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.3em]">حول أرباحك إلى نقود حقيقية</p>
      </div>

      {/* Balance Card with Animation */}
      <div className="bg-gradient-to-br from-emerald-600/20 to-emerald-800/20 rounded-[2.5rem] p-8 mb-8 relative overflow-hidden border border-emerald-500/20 shadow-2xl">
        <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-emerald-200/70 text-xs font-bold uppercase mb-2">رصيدك الحالي</p>
              <h2 className="text-5xl font-black text-white drop-shadow-lg">
                {user.balance.toLocaleString()}
              </h2>
              <p className="text-emerald-200 text-sm font-bold mt-1">تلايكر</p>
            </div>
            <div className="text-right">
              <Wallet size={48} className="text-emerald-400/80" />
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6 pt-6 border-t border-emerald-400/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-emerald-200">حتى الحد الأدنى للسحب</span>
              <span className="text-xs font-black text-emerald-400">{Math.min(100, progressPercentage).toFixed(0)}%</span>
            </div>
            <div className="w-full h-3 bg-emerald-600/20 rounded-full overflow-hidden border border-emerald-400/30">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, progressPercentage)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setActiveTab('request')}
          className={`flex-1 py-3 px-4 rounded-xl font-black text-sm transition-all ${
            activeTab === 'request'
              ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-black shadow-lg shadow-emerald-500/20'
              : 'bg-white/5 text-slate-400 border border-white/10'
          }`}
        >
          طلب جديد
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-3 px-4 rounded-xl font-black text-sm transition-all ${
            activeTab === 'history'
              ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-black shadow-lg shadow-emerald-500/20'
              : 'bg-white/5 text-slate-400 border border-white/10'
          }`}
        >
          السجل
        </button>
      </div>

      {/* Request Form Tab */}
      {activeTab === 'request' && (
        <form onSubmit={handleSubmit} className="space-y-5 mb-10">
          {/* Amount Input */}
          <div className="space-y-2">
            <label className="block text-white font-black text-sm flex items-center gap-2">
              <DollarSign size={16} className="text-emerald-500" />
              المبلغ (دينار عراقي)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min={minimumWithdrawal}
              step={1000}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold focus:outline-none focus:border-emerald-500/50 focus:bg-white/10 transition-all text-lg"
              placeholder="أدخل المبلغ"
            />
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 pt-2">
              <span>الحد الأدنى: {minimumWithdrawal.toLocaleString()}</span>
              <span>الرصيد: {user.balance.toLocaleString()}</span>
            </div>
          </div>

          {/* Conversion Info */}
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-emerald-200 text-sm font-bold">المبلغ المحول</span>
              <div className="text-right">
                <p className="text-emerald-500 font-black text-lg">{iqdAmount.toLocaleString()}</p>
                <p className="text-emerald-400/70 text-xs">دينار عراقي</p>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <label className="block text-white font-black text-sm">طريقة الدفع</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(methodLabels).map(([key, value]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setMethod(key as any)}
                  className={`p-4 rounded-xl font-black text-sm transition-all border ${
                    method === key
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-lg shadow-emerald-500/20'
                      : 'bg-white/5 border-white/10 text-slate-400'
                  }`}
                >
                  <div className="text-2xl mb-1">{value.icon}</div>
                  <div className="text-xs">{value.ar}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Recipient Name */}
          <div className="space-y-2">
            <label className="block text-white font-black text-sm">اسم المستقبل</label>
            <input
              type="text"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold focus:outline-none focus:border-emerald-500/50 focus:bg-white/10 transition-all"
              placeholder="اسمك الكامل"
            />
          </div>

          {/* Account Number */}
          <div className="space-y-2">
            <label className="block text-white font-black text-sm">رقم الحساب</label>
            <input
              type="text"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold focus:outline-none focus:border-emerald-500/50 focus:bg-white/10 transition-all"
              placeholder="رقم محفظتك أو حسابك"
            />
          </div>

          {/* Bank Name (Optional) */}
          <div className="space-y-2">
            <label className="block text-white font-black text-sm text-opacity-70">اسم البنك (اختياري)</label>
            <input
              type="text"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold focus:outline-none focus:border-emerald-500/50 focus:bg-white/10 transition-all"
              placeholder="مثال: بنك الرافدين"
            />
          </div>

          {/* Alerts */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex gap-3 items-start">
              <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm font-bold">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex gap-3 items-start animate-pulse">
              <CheckCircle size={20} className="text-emerald-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-emerald-400 text-sm font-black">{success}</p>
                <p className="text-emerald-400/70 text-xs mt-1">قد يأخذ التحويل من 10 إلى 30 دقيقة</p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:from-emerald-500/50 disabled:to-emerald-600/50 text-black font-black py-5 rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 text-lg"
          >
            <Send size={20} />
            {isLoading ? 'جاري الإرسال...' : 'طلب السحب الآن'}
          </button>
        </form>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {withdrawals.length === 0 ? (
            <div className="text-center py-16 bg-white/5 rounded-[2.5rem] border border-white/10">
              <Clock size={48} className="text-slate-600 mx-auto mb-4" />
              <p className="text-slate-500 font-bold text-lg">لا توجد طلبات سحب حالياً</p>
              <p className="text-slate-600 text-xs mt-2">ابدأ برفع طلب سحب من الآن!</p>
            </div>
          ) : (
            withdrawals.map((w) => {
              const status = getStatusColor(w.status);
              return (
                <div
                  key={w.id}
                  className={`${status.bg} border ${status.border} rounded-2xl p-5 backdrop-blur-sm transition-all hover:shadow-lg`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-12 h-12 ${status.bg} border ${status.border} rounded-xl flex items-center justify-center text-xl`}>
                          {methodLabels[w.method]?.icon}
                        </div>
                        <div>
                          <p className="text-white font-black text-sm">
                            {w.iqdAmount.toLocaleString()} دينار
                          </p>
                          <p className="text-slate-400 text-xs font-bold">
                            {methodLabels[w.method]?.ar}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-lg text-xs font-black ${status.bg} border ${status.border} ${status.text}`}>
                      {status.label}
                    </div>
                  </div>

                  <div className="bg-black/20 rounded-xl p-3 text-xs space-y-1">
                    <div className="flex justify-between text-slate-400">
                      <span>المستقبل:</span>
                      <span className="text-slate-300 font-bold">{w.bankAccount.recipientName}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>الرقم:</span>
                      <span className="text-slate-300 font-mono">{w.bankAccount.accountNumber}</span>
                    </div>
                    <div className="flex justify-between text-slate-500 text-xs">
                      <span>التاريخ:</span>
                      <span>{new Date(w.createdAt).toLocaleDateString('ar-IQ')}</span>
                    </div>
                  </div>

                  {w.rejectionReason && (
                    <div className="mt-3 pt-3 border-t border-red-500/20 text-red-400 text-xs font-bold">
                      السبب: {w.rejectionReason}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default Withdraw;
