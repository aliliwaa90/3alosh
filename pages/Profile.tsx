
import React from 'react';
import { useGame } from '../context/GameContext';
import { User, ChevronLeft, Copy, Share2, Users, Coins, Settings, ArrowRightLeft, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Profile: React.FC = () => {
  const { user, copyReferralLink, getReferralLink } = useGame();
  const navigate = useNavigate();
  const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;

  const handleCopy = () => {
    copyReferralLink();
    if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    }
  };

  return (
    <div className="h-screen w-full overflow-y-auto overflow-x-hidden bg-[#020617] pb-40 px-6 pt-8 custom-scrollbar scroll-smooth" dir="rtl">
      
      {/* 🔝 Header Section */}
      <div className="w-full flex justify-between items-center mb-10">
          <button 
            onClick={() => navigate('/')} 
            className="w-11 h-11 bg-[#0d1117] rounded-2xl flex items-center justify-center text-white active:scale-90 transition-transform border border-white/5 shadow-xl"
          >
              <ChevronLeft size={24} />
          </button>
          <div className="text-center">
            <h1 className="text-xl font-black text-white">الملف الشخصي</h1>
            <p className="text-primary text-[8px] font-black uppercase tracking-[0.2em]">Personal ID</p>
          </div>
          <button 
            onClick={() => navigate('/settings')} 
            className="w-11 h-11 bg-[#0d1117] rounded-2xl flex items-center justify-center text-slate-400 active:scale-90 transition-transform border border-white/5 shadow-xl"
          >
              <Settings size={20} />
          </button>
      </div>

      {/* 👤 User Hero Section */}
      <div className="flex flex-col items-center mb-10">
          <div className="w-32 h-32 rounded-[2.5rem] p-1.5 bg-gradient-to-tr from-yellow-500 via-primary to-orange-500 shadow-[0_20px_40px_rgba(250,204,21,0.15)] mb-6 rotate-3">
              <div className="w-full h-full rounded-[2rem] bg-[#0d1117] flex items-center justify-center overflow-hidden border-4 border-[#020617]">
                  {tgUser?.photo_url ? (
                      <img src={tgUser.photo_url} className="w-full h-full object-cover" />
                  ) : (
                      <User size={60} className="text-slate-800" />
                  )}
              </div>
          </div>
          <h2 className="text-3xl font-black text-white tracking-tighter">{user.name || 'مستكشف تلايكر'}</h2>
          <div className="mt-2 px-3 py-1 bg-white/5 rounded-full border border-white/5">
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">ID: {user.id}</p>
          </div>
      </div>

      {/* 📊 Main Stats Cards */}
      <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-[#0d1117] p-6 rounded-[2.5rem] border border-white/5 flex flex-col items-center text-center shadow-xl">
              <div className="w-12 h-12 bg-yellow-500/10 rounded-2xl flex items-center justify-center text-yellow-500 mb-4 border border-yellow-500/10">
                  <Coins size={24} fill="currentColor" />
              </div>
              <span className="text-2xl font-black text-white tabular-nums tracking-tighter">{user.balance.toLocaleString()}</span>
              <p className="text-[9px] text-slate-500 font-black uppercase mt-1 tracking-widest">الرصيد الكلي</p>
          </div>
          
          <div className="bg-[#0d1117] p-6 rounded-[2.5rem] border border-white/5 flex flex-col items-center text-center shadow-xl">
              <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400 mb-4 border border-blue-500/10">
                  <Users size={24} fill="currentColor" />
              </div>
              <span className="text-2xl font-black text-white tabular-nums tracking-tighter">{user.referrals}</span>
              <p className="text-[9px] text-slate-500 font-black uppercase mt-1 tracking-widest">الأصدقاء</p>
          </div>
      </div>

      {/* 🔗 Referral Card */}
      <div className="bg-[#0d1117] p-8 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden group mb-8">
          <div className="absolute top-0 left-0 w-full h-1 bg-primary/30"></div>
          <h3 className="text-sm font-black text-white mb-5 pr-2">رابط الإحالة الخاص بك</h3>
          <div className="bg-[#020617] p-5 rounded-2xl border border-white/10 mb-6 overflow-hidden">
              <code className="text-[11px] text-primary font-black block truncate text-center dir-ltr">{getReferralLink()}</code>
          </div>
          <div className="flex gap-3">
              <button 
                onClick={handleCopy} 
                className="flex-1 bg-primary text-black font-black py-4 rounded-2xl text-xs active:scale-95 transition-all shadow-lg shadow-primary/10"
              >
                  نسخ الرابط
              </button>
              <button 
                onClick={() => window.open(`https://t.me/share/url?url=${getReferralLink()}`, '_blank')}
                className="w-14 h-14 bg-white/5 text-white flex items-center justify-center rounded-2xl border border-white/10 active:scale-95 transition-all"
              >
                  <Share2 size={22} />
              </button>
          </div>
      </div>

      {/* ⚡ Quick Actions List */}
      <div className="space-y-4 mb-10">
          <button 
            onClick={() => navigate('/wallet')} 
            className="w-full bg-[#0d1117]/80 p-6 rounded-[2rem] border border-white/5 flex items-center justify-between active:scale-[0.98] transition-all shadow-lg"
          >
              <div className="flex items-center gap-5">
                  <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 border border-emerald-500/10">
                      <ArrowRightLeft size={22} />
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-white block">مركز تحويل الأرباح</span>
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Withdrawal Center</span>
                  </div>
              </div>
              <ChevronLeft size={20} className="text-slate-700" />
          </button>

          <div className="w-full bg-[#0d1117]/40 p-6 rounded-[2rem] border border-white/5 flex items-center justify-between opacity-50 grayscale">
              <div className="flex items-center gap-5">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500">
                      <ShieldCheck size={22} />
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-white block">توثيق الحساب (قريباً)</span>
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">KYC Verification</span>
                  </div>
              </div>
          </div>
      </div>

      {/* ℹ️ Footer Info */}
      <div className="py-6 text-center">
          <p className="text-[10px] font-black text-slate-800 uppercase tracking-[0.4em]">تلايكر بروتوكول • إصدار 2.5</p>
      </div>

    </div>
  );
};

export default Profile;
