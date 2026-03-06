
import React, { useState, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { Moon, Sun, ShieldCheck, ChevronRight, CreditCard, LogOut, CheckCircle, Smartphone, Lock, X, Fingerprint, ShieldAlert, ChevronLeft, Bell, BellOff, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Settings: React.FC = () => {
  const { user, updateWalletAddress, toggleTheme, setLanguage, t } = useGame();
  const navigate = useNavigate();
  const [address, setAddress] = useState(user.walletAddress);
  const [isSaved, setIsSaved] = useState(false);
  
  const handleSave = () => {
    updateWalletAddress(address);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className={`h-screen w-full overflow-y-auto overflow-x-hidden ${user.theme === 'light' ? 'bg-slate-50 text-slate-900' : 'bg-[#020617] text-white'} pb-40 px-6 pt-8 custom-scrollbar scroll-smooth`} dir={user.language === 'en' ? 'ltr' : 'rtl'}>
      
      {/* 🔝 Header */}
      <div className="w-full flex items-center justify-between mb-10">
          <button 
            onClick={() => navigate('/')} 
            className={`w-11 h-11 rounded-2xl flex items-center justify-center active:scale-90 transition-transform shadow-xl ${user.theme === 'light' ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#0d1117] border-white/5 text-white'}`}
          >
              <ChevronLeft size={24} />
          </button>
          <div className="flex-1 flex justify-center items-center py-2">
              <div className="text-center">
                <h1 className="text-xl font-black">{t('settings')}</h1>
                <p className="text-slate-500 text-[8px] font-black uppercase tracking-widest mt-0.5 animate-pulse">{t('global_config')}</p>
              </div>
          </div>
          <div className="w-11"></div>
      </div>

      <div className="w-full space-y-10">
          {/* Appearance Section */}
          <section>
              <div className="flex flex-row items-center gap-2 mb-5 pr-2">
                <Smartphone size={14} className="text-primary" />
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{t('theme')} & {t('language')}</h3>
              </div>
              
              <div className="space-y-4">
                  {/* Theme Toggle */}
                  <div className={`rounded-[2.5rem] p-8 border shadow-2xl flex items-center justify-between group ${user.theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#0d1117] border-white/5'}`}>
                      <div className="flex items-center gap-5">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${user.theme === 'light' ? 'bg-amber-500/10 text-amber-500' : 'bg-primary/10 text-primary border border-primary/10'}`}>
                              {user.theme === 'light' ? <Sun size={24} /> : <Moon size={24} />}
                          </div>
                          <div className={user.language === 'en' ? 'text-left' : 'text-right'}>
                            <p className="text-sm font-black">{user.theme === 'light' ? t('theme_light') : t('theme_dark')}</p>
                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">{t('ui_mode')}</p>
                          </div>
                      </div>
                      <button onClick={toggleTheme} className={`w-14 h-7 rounded-full relative transition-all duration-300 ${user.theme === 'dark' ? 'bg-primary' : 'bg-slate-300'}`}>
                          <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-lg transition-all duration-300 ${user.theme === 'dark' ? (user.language === 'en' ? 'right-1' : 'left-1') : (user.language === 'en' ? 'right-8' : 'left-8')}`}></div>
                      </button>
                  </div>

                  {/* Language Toggle */}
                  <div className={`rounded-[2.5rem] p-8 border shadow-2xl flex items-center justify-between group ${user.theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#0d1117] border-white/5'}`}>
                      <div className="flex items-center gap-5">
                          <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-blue-500/10 text-blue-500">
                              <Globe size={24} />
                          </div>
                          <div className={user.language === 'en' ? 'text-left' : 'text-right'}>
                            <p className="text-sm font-black">{user.language === 'ar' ? 'العربية' : 'English'}</p>
                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">{t('app_language')}</p>
                          </div>
                      </div>
                      <div className="flex gap-2">
                         <button onClick={() => setLanguage('ar')} className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${user.language === 'ar' ? 'bg-primary text-black' : 'bg-slate-700 text-slate-400'}`}>AR</button>
                         <button onClick={() => setLanguage('en')} className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${user.language === 'en' ? 'bg-primary text-black' : 'bg-slate-700 text-slate-400'}`}>EN</button>
                      </div>
                  </div>
              </div>
          </section>

          {/* Payment Section */}
          <section>
              <div className="flex flex-row items-center gap-2 mb-5 pr-2">
                <CreditCard size={14} className="text-primary" />
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{t('wallet')}</h3>
              </div>
              <div className={`rounded-[2.5rem] p-8 border shadow-2xl ${user.theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#0d1117] border-white/5'}`}>
                  <p className="text-[9px] text-slate-600 font-black mb-3 pr-1">{t('payment_address')}</p>
                  <input 
                    type="text" 
                    value={address} 
                    onChange={e => setAddress(e.target.value)} 
                    placeholder="Enter wallet address..." 
                    className={`w-full border rounded-2xl p-5 font-black text-sm outline-none focus:border-primary transition-all text-center mb-6 ${user.theme === 'light' ? 'bg-slate-100 border-slate-200 text-black' : 'bg-[#020617] border-white/10 text-white'}`} 
                  />
                  <button onClick={handleSave} className={`w-full py-5 rounded-2xl font-black text-xs transition-all flex flex-row items-center justify-center gap-3 shadow-xl ${isSaved ? 'bg-emerald-500 text-white' : 'bg-primary text-black active:scale-95'}`}>
                      {isSaved ? <CheckCircle size={20} /> : null}
                      {isSaved ? t('success') : t('save')}
                  </button>
              </div>
          </section>
      </div>
    </div>
  );
};
export default Settings;
