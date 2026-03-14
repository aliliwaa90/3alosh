import React, { Suspense, useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { GameProvider } from './context/GameContext';
import BottomNav from './components/BottomNav';
import SplashScreen from './components/SplashScreen';
import { Loader2 } from 'lucide-react';

const Home = React.lazy(() => import('./pages/Home'));
const Earn = React.lazy(() => import('./pages/Earn'));
const Withdraw = React.lazy(() => import('./pages/Withdraw'));
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
      <p className="text-slate-400 text-sm font-bold animate-pulse">جارٍ التحميل...</p>
    </div>
  </div>
);

const getInitialIsTelegram = (): boolean => {
  if (typeof window === 'undefined') return false;
  return Boolean(window.Telegram?.WebApp?.initData);
};

const getInitialIsDev = (): boolean => {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return host.includes('localhost') || host.includes('run.app');
};

const isAdminPath = (routePath: string, hash: string, physicalPath: string): boolean =>
  routePath === '/admin' ||
  routePath.startsWith('/admin/') ||
  hash.startsWith('#/admin') ||
  physicalPath === '/admin' ||
  physicalPath.startsWith('/admin/');

const RedirectHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    const physicalPath = window.location.pathname || '/';
    const openedDirectAdminPath = physicalPath === '/admin' || physicalPath.startsWith('/admin/');
    if (openedDirectAdminPath && !window.location.hash.startsWith('#/admin')) {
      navigate('/admin', { replace: true });
      return;
    }

    const tg = window.Telegram?.WebApp;
    const startParamFromTelegram = tg?.initDataUnsafe?.start_param;
    const params = new URLSearchParams(window.location.search);
    const startParamFromUrl = params.get('start_param') || params.get('startapp');

    if (startParamFromTelegram === 'admin_panel' || startParamFromUrl === 'admin_panel') {
      if (location.pathname !== '/admin') {
        navigate('/admin', { replace: true });
      }
    }
  }, [navigate, location.pathname]);

  return null;
};

const AppShell: React.FC = () => {
  const location = useLocation();
  const [isTelegram, setIsTelegram] = React.useState<boolean>(() => getInitialIsTelegram());
  const [isDev] = React.useState<boolean>(() => getInitialIsDev());
  const [showSplash, setShowSplash] = useState(true);

  React.useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg?.initData) {
      setIsTelegram(true);
      tg.ready();
      tg.expand();
      tg.setHeaderColor('#020617');
    } else {
      setIsTelegram(false);
    }
    // Hide splash screen after 3 seconds
    const timer = setTimeout(() => setShowSplash(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const inAdminRoute = isAdminPath(location.pathname, window.location.hash, window.location.pathname);

  if (!isTelegram && !isDev && !inAdminRoute) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center text-white">
        <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mb-6 animate-pulse">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m22 2-7 20-4-9-9-4Z" />
            <path d="M22 2 11 13" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-2">Telegram Required</h1>
        <p className="text-slate-400 text-sm">This application is designed to run only inside Telegram.</p>
        <a href="https://t.me/" className="mt-8 px-6 py-3 bg-blue-500 rounded-xl font-bold text-sm">
          Open Telegram
        </a>
      </div>
    );
  }

  return (
    <div className="font-sans antialiased text-white min-h-screen bg-slate-900">
      <SplashScreen isLoading={showSplash} />
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
          <Route path="/withdraw" element={<Withdraw />} />
          <Route path="/wallet" element={<Wallet />} />
          <Route path="/friends" element={<Friends />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>

      {!inAdminRoute && <BottomNav />}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <GameProvider>
      <Router>
        <RedirectHandler />
        <AppShell />
      </Router>
    </GameProvider>
  );
};

export default App;
