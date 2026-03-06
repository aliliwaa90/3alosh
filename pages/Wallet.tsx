
import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { Wallet as WalletIcon, ChevronLeft, Gift, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TonConnectButton, useTonWallet } from '@tonconnect/ui-react';

const Wallet: React.FC = () => {
  const wallet = useTonWallet();
  const { user, t } = useGame();
  const navigate = useNavigate();

  return (
    <div className="h-screen bg-dark text-white px-6 pt-10 pb-32 overflow-y-auto custom-scrollbar" dir="rtl">
      <div className="flex items-center justify-between mb-8">
        <button onClick={() => navigate('/')} className="p-3 bg-white/5 rounded-xl border border-white/10 active:scale-90 transition-all"><ChevronLeft size={20} /></button>
        <h1 className="text-xl font-black">Airdrop</h1>
        <div className="w-10"></div>
      </div>

      {/* Balance Card */}
      <div className="bg-gradient-to-br from-secondary to-dark p-8 rounded-[2.5rem] border border-white/10 mb-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-primary/20"></div>
          <p className="text-slate-500 text-[10px] font-black uppercase mb-1">{t('current_balance')}</p>
          <div className="flex items-baseline gap-2 mb-4">
              <h2 className="text-4xl font-black">{user.balance.toLocaleString()}</h2>
              <span className="text-primary text-xs font-bold">{t('points')}</span>
          </div>
          <div className="bg-black/30 p-3 rounded-2xl border border-white/5 inline-flex items-center gap-2">
              <Gift size={14} className="text-primary" />
              <span className="text-sm font-black">{t('airdrop_qualified')}</span>
          </div>
      </div>

      {/* TON Connect Section */}
      <div className="bg-white/5 rounded-[2rem] p-6 border border-white/10 mb-8 text-center">
          <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-500">
              <WalletIcon size={32} />
          </div>
          <h3 className="text-lg font-black mb-2">{t('connect_wallet')}</h3>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              {t('connect_wallet_desc')}
          </p>
          
          <div className="flex justify-center">
            <TonConnectButton />
          </div>

          {wallet && (
            <div className="mt-6 bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex items-center justify-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-500"/>
                <p className="text-emerald-500 text-xs font-bold">{t('wallet_connected')}</p>
            </div>
          )}
      </div>

      {/* Airdrop Info */}
      <div className="space-y-4">
          <h3 className="text-sm font-black px-2">{t('airdrop_info')}</h3>
          <div className="bg-[#0d1117] p-5 rounded-[2rem] border border-white/5 relative overflow-hidden">
              <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-black text-lg">1</div>
                  <div>
                      <h4 className="font-black text-sm mb-1">{t('collect_points')}</h4>
                      <p className="text-[10px] text-slate-500 leading-relaxed">{t('collect_points_desc')}</p>
                  </div>
              </div>
          </div>
          <div className="bg-[#0d1117] p-5 rounded-[2rem] border border-white/5 relative overflow-hidden">
              <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-black text-lg">2</div>
                  <div>
                      <h4 className="font-black text-sm mb-1">{t('connect_wallet')}</h4>
                      <p className="text-[10px] text-slate-500 leading-relaxed">{t('connect_wallet_desc')}</p>
                  </div>
              </div>
          </div>
          <div className="bg-[#0d1117] p-5 rounded-[2rem] border border-white/5 relative overflow-hidden opacity-50">
              <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-slate-500 font-black text-lg">3</div>
                  <div>
                      <h4 className="font-black text-sm mb-1 text-slate-400">{t('distribution_soon')}</h4>
                      <p className="text-[10px] text-slate-600 leading-relaxed">{t('distribution_desc')}</p>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};
export default Wallet;
