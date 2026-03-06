
import React, { Suspense } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { GameProvider } from './context/GameContext';
import BottomNav from './components/BottomNav';
import { Loader2 } from 'lucide-react';

const Home = React.lazy(() => import('./pages/Home'));
const Earn = React.lazy(() => import('./pages/Earn'));
const Wallet = React.lazy(() => import('./pages/Wallet'));
const Friends = React.lazy(() => import('./pages/Friends'));
const Settings = React.lazy(() => import('./pages/Settings'));
const Admin = React.lazy(() => import('./pages/Admin'));
const Shop = React.lazy(() => import('./pages/Shop'));
const Leaderboard = React.lazy(() => import('./pages/Leaderboard'));
const Challenge = React.lazy(() => import('./pages/Challenge'));
const LuckWheel = React.lazy(() => import('./pages/LuckWheel'));
const Profile = React.lazy(() => import('./pages/Profile'));
const P2P = React.lazy(() => import('./pages/P2P'));

const LoadingFallback = () => (
  <div className="min-h-screen bg-slate-900 flex items-center justify-center z-50">
    <div className="flex flex-col items-center">
      <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
      <p className="text-slate-400 text-sm font-bold animate-pulse">جاري التحميل...</p>
    </div>
  </div>
);

const RedirectHandler = () => {
  const navigate = useNavigate();
  React.useEffect(() => {
    const tg = window.Telegram?.WebApp;
    const startParamFromTelegram = tg?.initDataUnsafe?.start_param;
    const startParamFromUrl = new URLSearchParams(window.location.search).get('start_param');
    if (startParamFromTelegram === 'admin_panel' || startParamFromUrl === 'admin_panel') {
      navigate('/admin');
    }
  }, [navigate]);
  return null;
};

const App: React.FC = () => {
  const [isTelegram, setIsTelegram] = React.useState(false);
  const [isDev, setIsDev] = React.useState(false);
  const [isAdminRoute, setIsAdminRoute] = React.useState(false);

  React.useEffect(() => {
    const tg = window.Telegram?.WebApp;
    const isTg = !!tg?.initData;
    const isDevEnv = window.location.hostname.includes('localhost') || window.location.hostname.includes('run.app');
    const isAdminPath = window.location.hash.startsWith('#/admin');
    
    if (isTg) {
      setIsTelegram(true);
      tg.ready();
      tg.expand();
      // Set header color to match app
      tg.setHeaderColor('#020617');
    } else {
      setIsTelegram(false);
    }
    setIsDev(isDevEnv);
    setIsAdminRoute(isAdminPath);
  }, []);

  if (!isTelegram && !isDev && !isAdminRoute) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center text-white">
        <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mb-6 animate-pulse">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
        </div>
        <h1 className="text-2xl font-bold mb-2">Telegram Required</h1>
        <p className="text-slate-400 text-sm">This application is designed to run only inside Telegram.</p>
        <a href="https://t.me/" className="mt-8 px-6 py-3 bg-blue-500 rounded-xl font-bold text-sm">Open Telegram</a>
      </div>
    );
  }

  return (
    <GameProvider>
      <Router>
        <RedirectHandler />
        <div className="font-sans antialiased text-white min-h-screen bg-slate-900">
          {!isTelegram && isDev && (
             <div className="bg-amber-500/20 text-amber-500 text-[10px] font-bold text-center py-1">
               Dev Mode: Running outside Telegram
             </div>
          )}
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/p2p" element={<P2P />} />
              <Route path="/challenge" element={<Challenge />} />
              <Route path="/wheel" element={<LuckWheel />} />
              <Route path="/earn" element={<Earn />} />
              <Route path="/wallet" element={<Wallet />} />
              <Route path="/friends" element={<Friends />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
          <BottomNav />
        </div>
      </Router>
    </GameProvider>
  );
};

export default App;
