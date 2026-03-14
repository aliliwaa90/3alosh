import React, { useEffect, useState } from 'react';
import { Coins, Zap } from 'lucide-react';

interface SplashScreenProps {
  isLoading: boolean;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ isLoading }) => {
  const [fade, setFade] = useState(true);

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => setFade(false), 500);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  if (!fade) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-gradient-to-br from-[#020617] via-[#0d1117] to-[#020617] flex flex-col items-center justify-center transition-opacity duration-500 ${
        fade && isLoading ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 right-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 left-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* Logo Animation */}
        <div className="relative">
          <div className="w-32 h-32 bg-gradient-to-tr from-yellow-700 via-primary to-yellow-300 rounded-full p-2 shadow-2xl animate-bounce">
            <div className="w-full h-full rounded-full bg-[#020617] flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent"></div>
              <Coins size={80} className="text-primary/90" fill="currentColor" />
            </div>
          </div>

          {/* Orbiting Particles */}
          <div className="absolute inset-0 w-32 h-32 animate-spin">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-primary rounded-full shadow-lg shadow-primary/50"></div>
          </div>
          <div className="absolute inset-0 w-32 h-32 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '3s' }}>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-purple-500 rounded-full shadow-lg shadow-purple-500/50"></div>
          </div>
        </div>

        {/* Brand Text */}
        <div className="text-center">
          <h1 className="text-5xl font-black text-white tracking-tighter mb-2 drop-shadow-lg">
            TLiker
          </h1>
          <p className="text-primary font-black text-sm uppercase tracking-[0.3em] mb-4">
            اكسب النقاط والمال
          </p>
        </div>

        {/* Loading Indicator */}
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
          </div>
          <span className="text-slate-400 text-[11px] font-black uppercase">جاري التحميل</span>
        </div>

        {/* Progress Bar */}
        <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden mt-4">
          <div className="h-full bg-gradient-to-r from-primary to-purple-500 rounded-full animate-pulse" style={{ width: '60%' }}></div>
        </div>

        {/* Features Teaser */}
        <div className="mt-8 text-center space-y-2">
          <div className="flex items-center justify-center gap-2 text-slate-400 text-[10px] font-bold">
            <Zap size={12} className="text-primary" />
            <span>انقر واربح</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-slate-400 text-[10px] font-bold">
            <Coins size={12} className="text-primary" />
            <span>سحب فوري</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
