
import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { 
    ShoppingBag, Star, Coins, ChevronLeft, 
    ShieldCheck, Package, Cpu, Sparkles, TrendingUp
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Shop: React.FC = () => {
  const { digitalProducts, user, buyProductWithPoints, buyProductWithStars } = useGame();
  const [loading, setLoading] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'browse' | 'my-items'>('browse');
  const navigate = useNavigate();

  const handleBuyPoints = async (id: string) => {
      if (loading) return;
      setLoading(id);
      const res = await buyProductWithPoints(id);
      setMsg({ type: res.success ? 'success' : 'error', text: res.message });
      setLoading(null);
      setTimeout(() => setMsg(null), 3500);
  };

  const myItems = digitalProducts.filter(p => user.ownedProducts?.includes(p.id));

  return (
    <div className="h-screen w-full overflow-y-auto overflow-x-hidden bg-[#020617] pb-40 px-5 pt-10 custom-scrollbar scroll-smooth" dir="rtl">
      
      <div className="flex items-center justify-between mb-10 px-1">
          <button onClick={() => navigate('/')} className="w-12 h-12 bg-white/5 rounded-[1.2rem] flex items-center justify-center text-white border border-white/10 active:scale-90 shadow-xl transition-all">
              <ChevronLeft size={24} />
          </button>
          <div className="text-center">
              <h1 className="text-2xl font-black text-white tracking-tight">سوق العدادات</h1>
              <p className="text-primary text-[8px] font-black uppercase tracking-[0.3em] mt-1 opacity-80">Mining Hardware Store</p>
          </div>
          <div className="w-12 h-12 bg-primary/10 rounded-[1.2rem] flex items-center justify-center text-primary border border-primary/20">
              <Cpu size={24} />
          </div>
      </div>

      <div className="flex p-1.5 bg-[#0d1117] rounded-[1.8rem] border border-white/5 mb-10 shadow-2xl">
          <button onClick={() => setActiveTab('browse')} className={`flex-1 py-4 rounded-[1.4rem] text-[11px] font-black transition-all flex items-center justify-center gap-2.5 ${activeTab === 'browse' ? 'bg-primary text-black' : 'text-slate-500'}`}>
              <ShoppingBag size={18}/> الأجهزة المتاحة
          </button>
          <button onClick={() => setActiveTab('my-items')} className={`flex-1 py-4 rounded-[1.4rem] text-[11px] font-black transition-all flex items-center justify-center gap-2.5 ${activeTab === 'my-items' ? 'bg-primary text-black' : 'text-slate-500'}`}>
              <Package size={18}/> أجهزتي ({myItems.length})
          </button>
      </div>

      {msg && (
          <div className={`fixed top-14 left-6 right-6 z-[200] p-5 rounded-[2rem] shadow-2xl text-center border-2 animate-scale-in bg-[#0d1117] ${msg.type === 'success' ? 'border-emerald-500/20 text-emerald-500' : 'border-rose-500/20 text-rose-500'}`}>
              {msg.text}
          </div>
      )}

      {activeTab === 'browse' ? (
          <div className="grid grid-cols-1 gap-6">
              {digitalProducts.map(product => {
                  const alreadyOwned = user.ownedProducts?.includes(product.id);
                  return (
                      <div key={product.id} className="bg-[#0d1117] rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl relative">
                          <div className="flex p-5 gap-5">
                              <div className="relative w-32 h-32 shrink-0 rounded-[1.8rem] overflow-hidden border border-white/10 bg-[#020617]">
                                  <img src={product.imageData} className="w-full h-full object-cover" />
                                  {alreadyOwned && <div className="absolute inset-0 bg-emerald-500/20 backdrop-blur-[2px] flex items-center justify-center"><ShieldCheck size={28} className="text-emerald-400" /></div>}
                              </div>
                              <div className="flex flex-col justify-between flex-1 py-1">
                                  <div>
                                      <h3 className="text-white font-black text-base mb-1">{product.name}</h3>
                                      <div className="flex items-center gap-1.5 text-primary mb-2">
                                          <TrendingUp size={12}/>
                                          <span className="text-[10px] font-black">{product.earningRate} نقطة/ث</span>
                                      </div>
                                      <p className="text-slate-500 text-[10px] font-bold line-clamp-2">{product.description}</p>
                                  </div>
                                  <button 
                                    onClick={() => handleBuyPoints(product.id)}
                                    disabled={loading === product.id || alreadyOwned}
                                    className={`w-full h-11 rounded-xl font-black text-[10px] transition-all flex items-center justify-center gap-2 ${alreadyOwned ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-primary text-black active:scale-95'}`}
                                  >
                                      {alreadyOwned ? <ShieldCheck size={14}/> : <Coins size={14}/>}
                                      {alreadyOwned ? 'مملوك' : `اشتر بـ ${product.pricePoints.toLocaleString()}`}
                                  </button>
                              </div>
                          </div>
                      </div>
                  );
              })}
          </div>
      ) : (
          <div className="space-y-6">
              {myItems.map(p => (
                  <div key={p.id} className="bg-[#0d1117] p-6 rounded-[2.5rem] border border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                          <img src={p.imageData} className="w-14 h-14 rounded-2xl object-cover" />
                          <div>
                              <h4 className="text-white font-black text-sm">{p.name}</h4>
                              <p className="text-primary text-[9px] font-black uppercase">يربح {p.earningRate} /ثانية</p>
                          </div>
                      </div>
                      <div className="px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-lg border border-emerald-500/20 text-[8px] font-black">نشط دائم</div>
                  </div>
              ))}
          </div>
      )}
    </div>
  );
};
export default Shop;
