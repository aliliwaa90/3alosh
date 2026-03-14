
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { Home, Zap, Wallet, Users, ShoppingBag, ArrowUpRight } from 'lucide-react';

const BottomNav: React.FC = () => {
  const { t, user } = useGame();
  
  const navItems = [
    { to: "/", icon: Home, label: t('home') },
    { to: "/earn", icon: Zap, label: t('earn') },
    { to: "/withdraw", icon: ArrowUpRight, label: "سحب" },
    { to: "/friends", icon: Users, label: t('friends') },
    { to: "/shop", icon: ShoppingBag, label: t('shop') },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] px-6 pb-8" dir={user.language === 'en' ? 'ltr' : 'rtl'}>
      <div className={`backdrop-blur-2xl border rounded-[2.5rem] shadow-2xl overflow-hidden ${user.theme === 'light' ? 'bg-white/90 border-slate-200' : 'bg-white/5 border-white/10'}`}>
        <div className="flex flex-row items-center h-20">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 h-full transition-all duration-300 ${
                  isActive ? 'text-primary scale-110' : 'text-slate-500 opacity-60'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} fill={isActive ? "currentColor" : "none"} />
                  <span className={`text-[9px] font-black mt-1 ${isActive ? (user.theme === 'light' ? 'text-slate-900' : 'text-white') : ''}`}>
                    {item.label}
                  </span>
                  {isActive && (
                    <div className="absolute bottom-1 w-1 h-1 bg-primary rounded-full shadow-[0_0_8px_#facc15]"></div>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BottomNav;

