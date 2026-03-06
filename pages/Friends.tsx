
import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { Users, Copy, Share2, Gift, User, Loader2, Coins, UserPlus, Sparkles, Check, ArrowRightLeft } from 'lucide-react';
import { UserState } from '../types';

const Friends: React.FC = () => {
  const { user, copyReferralLink, getReferralLink, fetchReferralsList, referralReward } = useGame();
  const [copied, setCopied] = useState(false);
  const [referralsList, setReferralsList] = useState<UserState[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
      const loadData = async () => {
          setLoading(true);
          const list = await fetchReferralsList();
          setReferralsList(list);
          setLoading(false);
      };
      loadData();
  }, []);

  const handleCopy = () => {
    copyReferralLink();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    }
  };

  const handleShare = () => {
      const link = getReferralLink();
      // Friendly, non-spammy text compliant with policies
      const text = `دعوة للانضمام إلى تلايكر 🎁\n\nأحصل على نقاط مجانية عند الدخول وتجربة التعدين السحابي.\n\nرابط الدخول:\n${link}`;
      const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`;
      window.open(telegramUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-background pb-32 px-4 pt-6 flex flex-col items-center custom-scrollbar overflow-y-auto">
      
      {/* Premium Header Card */}
      <div className="w-full relative overflow-hidden rounded-[2.5rem] p-8 mb-6 text-center border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] bg-slate-800/50 backdrop-blur-md">
        <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-primary/20 blur-[100px] rounded-full animate-pulse-slow"></div>
        <div className="relative z-10 flex flex-col items-center">
            <div className="w-20 h-20 bg-gradient-to-br from-primary via-yellow-400 to-orange-500 rounded-3xl flex items-center justify-center mb-5 shadow-[0_0_30px_rgba(255,215,0,0.4)] rotate-3">
                <Gift className="w-10 h-10 text-black" strokeWidth={2.5} />
            </div>
            <h1 className="text-3xl font-black text-white mb-2 tracking-tight">نظام المكافآت</h1>
            <p className="text-slate-400 text-xs font-bold leading-relaxed">ادعُ أصدقاءك واربحوا معاً 1,000 نقطة هدية فورية لكل صديق!</p>
        </div>
      </div>

      {/* Action Section */}
      <div className="w-full glass-panel rounded-3xl p-5 mb-6 border-t border-white/10 shadow-xl">
        <h3 className="text-xs font-black text-white mb-4 flex items-center">
            <Sparkles size={16} className="ml-2 text-primary animate-pulse" />
            رابط دعوتك الذهبي
        </h3>
        <div className="bg-black/40 rounded-2xl p-4 mb-5 border border-white/5 flex flex-col items-center gap-2">
             <div className="w-full overflow-hidden text-center">
                <code className="text-[10px] text-primary font-bold break-all dir-ltr select-all">
                    {getReferralLink()}
                </code>
             </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
            <button onClick={handleCopy} className={`h-12 rounded-2xl font-black flex items-center justify-center transition-all ${copied ? 'bg-green-600 text-white' : 'bg-slate-800 text-white active:scale-95'}`}>
                {copied ? <Check size={18} className="ml-2" /> : <Copy size={18} className="ml-2" />}
                <span className="text-xs">{copied ? 'تم النسخ' : 'نسخ الرابط'}</span>
            </button>
            <button onClick={handleShare} className="h-12 bg-primary text-black font-black rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-all text-xs">
                <Share2 size={18} className="ml-2" />
                مشاركة
            </button>
        </div>
      </div>

      {/* RAISED UP: List Section (Now comes before Stats) */}
      <div className="w-full px-1 mb-6">
          <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-black text-white flex items-center">
                  <ArrowRightLeft size={16} className="ml-2 text-slate-400" />
                  قائمة المنضمين
              </h3>
              <div className="px-2.5 py-1 bg-slate-900 rounded-full text-[9px] font-bold text-slate-500 border border-white/5">
                  أحدث النشاطات
              </div>
          </div>

          {loading ? (
               <div className="w-full py-10 flex flex-col items-center">
                   <Loader2 size={32} className="text-primary animate-spin mb-2" />
                   <p className="text-slate-600 text-[10px] font-bold">جاري التحميل...</p>
               </div>
          ) : referralsList.length === 0 ? (
              <div className="w-full py-10 bg-black/20 rounded-[2rem] border-2 border-dashed border-white/5 flex flex-col items-center justify-center text-center px-8">
                  <UserPlus size={40} className="text-slate-800 mb-3 opacity-30" />
                  <p className="text-slate-600 text-xs font-bold">لا يوجد أصدقاء منضمين حالياً</p>
              </div>
          ) : (
              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                  {referralsList.map((refUser, idx) => (
                      <div key={refUser.id || idx} className="w-full bg-slate-900/40 rounded-2xl p-3 border border-white/5 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-white font-black text-xs border border-white/5">
                                  {refUser.name ? refUser.name[0].toUpperCase() : 'U'}
                              </div>
                              <div>
                                  <h4 className="text-xs font-black text-white mb-0.5 truncate max-w-[120px]">{refUser.name || 'مستكشف جديد'}</h4>
                                  <p className="text-[9px] font-bold text-slate-500">{refUser.joinDate}</p>
                              </div>
                          </div>
                          <div className="px-3 py-1 bg-primary/10 rounded-lg border border-primary/20">
                              <span className="text-primary font-black text-[10px]">+1,000</span>
                          </div>
                      </div>
                  ))}
              </div>
          )}
      </div>

      {/* Stats Board (Moved Down) */}
      <div className="w-full grid grid-cols-2 gap-3 mb-6">
          <div className="bg-slate-900/40 rounded-[2rem] p-5 border border-white/5 flex flex-col items-center shadow-lg">
              <Users size={18} className="text-blue-400 mb-1.5" />
              <span className="text-xl font-black text-white">{user.referrals}</span>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">صديق مسجل</span>
          </div>
          <div className="bg-slate-900/40 rounded-[2rem] p-5 border border-white/5 flex flex-col items-center shadow-lg">
              <Coins size={18} className="text-yellow-400 mb-1.5" />
              <span className="text-xl font-black text-white">{(user.referrals * referralReward).toLocaleString()}</span>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">إجمالي الأرباح</span>
          </div>
      </div>

    </div>
  );
};

export default Friends;
