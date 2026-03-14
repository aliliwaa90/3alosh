import React, { useEffect, useState } from 'react';
import { Coins, Zap, Star, Sparkles } from 'lucide-react';

interface SplashScreenProps {
  isLoading: boolean;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ isLoading }) => {
  const [fade, setFade] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setProgress(prev => (prev >= 100 ? 100 : prev + Math.random() * 15));
      }, 200);
      return () => clearInterval(interval);
    }
  }, [isLoading]);

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => setFade(false), 800);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  if (!fade) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center transition-all duration-1000 ${
        fade && isLoading ? 'opacity-100 scale-100' : 'opacity-0 scale-110 pointer-events-none'
      }`}
      style={{
        backgroundImage: `url('https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=3840&q=80')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/60 to-black/80"></div>

      {/* Animated Particles Background */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-primary/30 rounded-full animate-ping"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-yellow-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-12">
        {/* Character Images */}
        <div className="flex items-center justify-center gap-6 mb-8">
          <div className="relative group">
            <img
              src="https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80"
              alt="Character 1"
              className="w-32 h-32 rounded-full border-4 border-primary/50 shadow-2xl animate-bounce transition-transform group-hover:scale-110"
              style={{ animationDelay: '0s' }}
            />
            <div className="absolute -top-3 -right-3 w-8 h-8 bg-yellow-400 rounded-full animate-ping shadow-lg"></div>
            <div className="absolute inset-0 rounded-full bg-gradient-to-t from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </div>
          <div className="relative group">
            <img
              src="https://images.unsplash.com/photo-1608889476561-6242cfdbf622?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80"
              alt="Character 2"
              className="w-32 h-32 rounded-full border-4 border-purple-500/50 shadow-2xl animate-bounce transition-transform group-hover:scale-110"
              style={{ animationDelay: '0.2s' }}
            />
            <div className="absolute -top-3 -right-3 w-8 h-8 bg-purple-400 rounded-full animate-ping shadow-lg"></div>
            <div className="absolute inset-0 rounded-full bg-gradient-to-t from-purple-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </div>
          <div className="relative group">
            <img
              src="https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80"
              alt="Character 3"
              className="w-32 h-32 rounded-full border-4 border-pink-500/50 shadow-2xl animate-bounce transition-transform group-hover:scale-110"
              style={{ animationDelay: '0.4s' }}
            />
            <div className="absolute -top-3 -right-3 w-8 h-8 bg-pink-400 rounded-full animate-ping shadow-lg"></div>
            <div className="absolute inset-0 rounded-full bg-gradient-to-t from-pink-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </div>
        </div>

        {/* Enhanced Logo Animation */}
        <div className="relative group">
          <div className="w-40 h-40 bg-gradient-to-tr from-yellow-400 via-primary to-yellow-200 rounded-full p-3 shadow-2xl shadow-primary/50 animate-pulse">
            <div className="w-full h-full rounded-full bg-gradient-to-br from-black/90 to-black/70 flex items-center justify-center relative overflow-hidden backdrop-blur-sm">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent animate-spin" style={{ animationDuration: '8s' }}></div>
              <Coins size={90} className="text-primary drop-shadow-lg animate-bounce" fill="currentColor" />
              <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-ping"></div>
            </div>
          </div>

          {/* Enhanced Orbiting Elements */}
          <div className="absolute inset-0 w-40 h-40 animate-spin" style={{ animationDuration: '4s' }}>
            <Star className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-4 text-yellow-400 animate-pulse" />
          </div>
          <div className="absolute inset-0 w-40 h-40 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '6s' }}>
            <Sparkles className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 text-purple-400 animate-pulse" />
          </div>
          <div className="absolute inset-0 w-52 h-52 animate-spin" style={{ animationDuration: '10s' }}>
            <Zap className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-5 text-primary animate-pulse" />
          </div>
        </div>

        {/* Enhanced Brand Text */}
        <div className="text-center space-y-4">
          <h1 className="text-7xl font-black text-white tracking-tighter drop-shadow-2xl animate-pulse">
            TLiker
          </h1>
          <p className="text-primary font-black text-lg uppercase tracking-[0.4em] animate-bounce">
            اكسب النقاط والمال
          </p>
          <div className="flex items-center justify-center gap-2 text-slate-300 text-sm font-bold">
            <div className="w-2 h-2 bg-primary rounded-full animate-ping"></div>
            <span>تحميل التطبيق...</span>
          </div>
        </div>

        {/* Enhanced Loading Indicator */}
        <div className="flex flex-col items-center gap-6">
          <div className="flex gap-2">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="w-3 h-3 bg-gradient-to-r from-primary to-purple-500 rounded-full animate-bounce shadow-lg shadow-primary/50"
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>

          {/* Progress Bar */}
          <div className="w-64 h-2 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm border border-white/10">
            <div
              className="h-full bg-gradient-to-r from-primary via-purple-500 to-yellow-500 rounded-full transition-all duration-300 shadow-lg shadow-primary/30"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-white/80 text-xs font-bold">{Math.round(progress)}%</span>
        </div>

        {/* Enhanced Features Teaser */}
        <div className="mt-8 text-center space-y-3">
          <div className="flex items-center justify-center gap-3 text-white/90 text-sm font-bold bg-white/10 rounded-full px-4 py-2 backdrop-blur-sm border border-white/20">
            <Zap size={16} className="text-primary animate-pulse" />
            <span>انقر واربح</span>
          </div>
          <div className="flex items-center justify-center gap-3 text-white/90 text-sm font-bold bg-white/10 rounded-full px-4 py-2 backdrop-blur-sm border border-white/20">
            <Coins size={16} className="text-primary animate-pulse" />
            <span>سحب فوري</span>
          </div>
          <div className="flex items-center justify-center gap-3 text-white/90 text-sm font-bold bg-white/10 rounded-full px-4 py-2 backdrop-blur-sm border border-white/20">
            <Star size={16} className="text-yellow-400 animate-pulse" />
            <span>مكافآت يومية</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
