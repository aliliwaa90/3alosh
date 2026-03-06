
import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { Coins, Zap, Trophy, Settings, UserCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Home: React.FC = () => {
  const { user, handleClick, isReady, t } = useGame();
  const [taps, setTaps] = useState<{id: number, x: number, y: number}[]>([]);
  const navigate = useNavigate();

  const handleTap = (e: React.TouchEvent) => {
    if (!isReady || user.isBanned) return;
    
    // Explicitly casting the touches to avoid 'unknown' type issues in some environments
    const touches = e.changedTouches;
    for (let i = 0; i < touches.length; i++) {
      const t = touches[i] as unknown as { clientX: number, clientY: number };
      if (handleClick()) {
        const id = Date.now() + Math.random();
        setTaps(prev => [...prev.slice(-15), { id, x: t.clientX, y: t.clientY }]);
        
        if (window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
        }
        
        setTimeout(() => setTaps(prev => prev.filter(tap => tap.id !== id)), 800);
      }
    }
  };

  return (
    <div className={`min-h-screen flex flex-col items-center px-6 pt-12 pb-32 select-none touch-none overflow-hidden ${user.theme === 'light' ? 'bg-slate-50 text-slate-900' : 'bg-dark text-white'}`} dir={user.language === 'en' ? 'ltr' : 'rtl'}>
      
      {/* Top Header */}
      <div className="w-full flex justify-between items-center mb-12">
        <div className={`flex items-center gap-3 p-2 pr-4 rounded-2xl border cursor-pointer ${user.theme === 'light' ? 'bg-white border-slate-200' : 'bg-white/5 border-white/10'}`} onClick={() => navigate('/profile')}>
           <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary">
              <UserCircle size={28} />
           </div>
           <div className={user.language === 'en' ? 'text-left' : 'text-right'}>
              <p className="text-xs font-black truncate max-w-[120px]">{user.name || t('explorer')}</p>
              <p className="text-[9px] text-primary font-bold uppercase tracking-widest">{t('level')} 1</p>
           </div>
        </div>
        <div className="flex gap-2">
           <button onClick={() => navigate('/leaderboard')} className={`w-11 h-11 rounded-xl flex items-center justify-center text-primary border active:scale-90 transition-transform ${user.theme === 'light' ? 'bg-white border-slate-200' : 'bg-white/5 border-white/10'}`}>
              <Trophy size={22} fill="currentColor" />
           </button>
           <button onClick={() => navigate('/settings')} className={`w-11 h-11 rounded-xl flex items-center justify-center text-slate-400 border active:scale-90 transition-transform ${user.theme === 'light' ? 'bg-white border-slate-200' : 'bg-white/5 border-white/10'}`}>
              <Settings size={22} />
           </button>
        </div>
      </div>

      {/* Balance Display */}
      <div className="flex flex-col items-center mb-16">
          <div className="flex items-center gap-4 mb-2">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(250,204,21,0.5)]">
                 <Coins size={28} className="text-black" fill="currentColor" />
              </div>
              <h2 className="text-6xl font-black tracking-tighter tabular-nums drop-shadow-2xl">
                {Math.floor(user.balance).toLocaleString()}
              </h2>
          </div>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em]">{t('total_points')}</p>
      </div>

      {/* Main Action Area */}
      <div className="relative w-full flex justify-center mb-16">
          <div onTouchStart={handleTap} className="relative w-80 h-80 flex items-center justify-center press-effect active:scale-90">
              {/* Outer Rings */}
              <div className="absolute inset-0 rounded-full bg-primary/5 animate-pulse"></div>
              <div className="absolute inset-6 rounded-full border-[10px] border-primary/10"></div>
              
              {/* Gold Coin */}
              <div className="w-72 h-72 rounded-full bg-gradient-to-tr from-yellow-700 via-primary to-yellow-300 p-2 shadow-2xl coin-glow ring-4 ring-black/20">
                  <div className="w-full h-full rounded-full bg-[#020617] flex items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent"></div>
                      <Coins size={140} className="text-primary/90 drop-shadow-[0_0_20px_rgba(250,204,21,0.4)]" fill="currentColor" />
                  </div>
              </div>
          </div>
          
          {/* Floating Text Animations */}
          {taps.map(tap => (
            <div key={tap.id} style={{ left: tap.x, top: tap.y }} className="tap-animation text-primary">{t('tap_value')}</div>
          ))}
      </div>

      {/* Energy Bar */}
      <div className="w-full max-w-sm">
          <div className={`p-6 rounded-[2.5rem] border backdrop-blur-xl shadow-2xl ${user.theme === 'light' ? 'bg-white/80 border-slate-200' : 'bg-white/5 border-white/10'}`}>
              <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-3">
                      <Zap size={22} className="text-primary fill-primary" />
                      <span className="text-2xl font-black tabular-nums">{Math.floor(user.energy)}</span>
                  </div>
                  <span className="text-slate-500 text-[11px] font-black uppercase">/ {user.maxEnergy} {t('energy')}</span>
              </div>
              <div className="w-full h-4 bg-black/40 rounded-full overflow-hidden border border-white/5 p-1">
                  <div className="h-full bg-gradient-to-r from-yellow-600 to-primary rounded-full transition-all duration-300 shadow-[0_0_15px_rgba(250,204,21,0.3)]" 
                       style={{ width: `${(user.energy / user.maxEnergy) * 100}%` }}></div>
              </div>
          </div>
      </div>
      
    </div>
  );
};
export default Home;
