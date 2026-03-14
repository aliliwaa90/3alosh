import React, { useEffect, useState } from 'react';
import { useGame } from '../context/GameContext';
import { Gift, X, Sparkles, Coins } from 'lucide-react';

const DailyWelcomeBonus: React.FC = () => {
  const { user } = useGame();
  const [showModal, setShowModal] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Check if 24 hours have passed since the last claim
    const lastClaim = user.lastDailyBonusClaim || 0;
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;

    if (now - lastClaim >= twentyFourHours) {
      // Delay showing the modal slightly for better UX
      const timer = setTimeout(() => {
        setShowModal(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const handleClaim = async () => {
    if (!user || claiming) return;
    setClaiming(true);

    try {
      const now = Date.now();
      const newBalance = user.balance + 100;
      
      // Update via API
      await fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: user.id, 
          balance: newBalance,
          lastDailyBonusClaim: now
        })
      });

      // Optimistic UI update handled by the backend sync in GameContext eventually,
      // but we show success animation here immediately
      setClaimed(true);
      
      // Close modal shortly after
      setTimeout(() => {
        setShowModal(false);
      }, 1500);
    } catch (err) {
      console.error('Failed to claim daily bonus', err);
      // Even if it fails, we close the modal to not block the user
      setShowModal(false);
    } finally {
      setClaiming(false);
    }
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center px-4 animate-in fade-in duration-500" dir="rtl">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !claiming && !claimed && setShowModal(false)}></div>
      
      {/* Modal Container */}
      <div className="relative bg-[#0a0f1c] w-full max-w-sm rounded-[2.5rem] border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
        
        {/* Glow Effects */}
        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-amber-500/20 to-transparent pointer-events-none"></div>
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-amber-500/30 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-yellow-500/20 rounded-full blur-3xl pointer-events-none"></div>
        
        {/* Close Button */}
        {!claiming && !claimed && (
          <button 
            onClick={() => setShowModal(false)}
            className="absolute top-4 right-4 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full transition-colors z-20"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="relative z-10 p-8 flex flex-col items-center text-center">
          
          {/* Icon Area */}
          <div className="relative mb-6 group">
            <div className={`absolute inset-0 bg-yellow-500/20 rounded-full blur-xl transition-all duration-700 ${claimed ? 'opacity-100 scale-150' : 'opacity-0 scale-100 group-hover:opacity-100 group-hover:scale-125'}`}></div>
            <div className={`w-28 h-28 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 p-[2px] shadow-[0_0_30px_rgba(251,191,36,0.5)] relative z-10 transition-transform duration-700 ${claimed ? 'scale-110' : 'animate-bounce-slight'}`}>
              <div className="w-full h-full rounded-full bg-[#0a0f1c] flex items-center justify-center overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-b from-yellow-500/20 to-transparent"></div>
                {claimed ? (
                  <Coins className="w-14 h-14 text-yellow-500 animate-[spin_2s_linear_infinite]" />
                ) : (
                  <Gift className="w-14 h-14 text-yellow-500 animate-[pulse_2s_ease-in-out_infinite]" />
                )}
                <div className="absolute top-0 bottom-0 left-0 w-full bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-full animate-[shimmer_2s_infinite]"></div>
              </div>
            </div>
          </div>

          {/* Text Content */}
          <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70 tracking-tight mb-2 flex items-center gap-2">
            مكافأة يومية <Sparkles className="w-5 h-5 text-yellow-400" />
          </h2>
          
          <p className="text-sm text-slate-400 font-medium mb-8 leading-relaxed px-4">
            {claimed ? 'تم إضافة الأرباح إلى رصيدك بنجاح، عُد غداً للمزيد!' : 'لقد حصلت على مكافأة تسجيل الدخول اليومية. اجمعها الآن لتزيد أرباحك!'}
          </p>

          {/* Reward Amount Display */}
          <div className={`bg-white/5 border border-white/10 rounded-2xl py-4 flex items-center justify-center gap-3 w-full mb-8 transition-all duration-500 ${claimed ? 'bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : ''}`}>
             <span className={`text-4xl font-black ${claimed ? 'text-emerald-400' : 'text-yellow-400'}`}>+100</span>
             <span className="text-sm font-bold text-slate-500 mt-2 tracking-wide">تلايكر</span>
          </div>

          {/* Action Button */}
          <button
            onClick={handleClaim}
            disabled={claiming || claimed}
            className={`w-full overflow-hidden rounded-2xl py-4 font-black transition-all duration-300 relative group  ${
              claimed 
                ? 'bg-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                : 'bg-gradient-to-r from-yellow-400 to-amber-500 text-black shadow-[0_0_30px_rgba(251,191,36,0.3)] hover:shadow-[0_0_40px_rgba(251,191,36,0.5)] hover:-translate-y-1'
            }`}
          >
            {/* Hover Glare */}
            {!claimed && (
               <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 text-white to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
            )}
            
            <span className="relative z-10 flex items-center justify-center gap-2 text-lg">
              {claiming ? (
                 <div className="w-6 h-6 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
              ) : claimed ? (
                 'تم الجمع بنجاح! استمر في التطبيق'
              ) : (
                 'اجمع المكافأة الآن'
              )}
            </span>
          </button>
          
          {!claiming && !claimed && (
            <button 
              onClick={() => setShowModal(false)}
              className="mt-4 text-xs text-slate-500 hover:text-white font-medium transition-colors"
            >
              ربما لاحقاً
            </button>
          )}

        </div>
      </div>

    </div>
  );
};

export default DailyWelcomeBonus;
