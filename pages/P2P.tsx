
import React, { useState, useMemo } from 'react';
import { useGame } from '../context/GameContext';
import { 
  Plus, ShieldCheck, DollarSign, Coins, ChevronLeft, Info, 
  ArrowRightLeft, BadgeCheck, Lock, Wallet, Tag,
  ShoppingCart, UploadCloud, X, MessageSquare
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const P2P: React.FC = () => {
  const { user, p2pOffers, createP2POffer, buyP2POffer, cancelP2POffer, paymentMethods } = useGame();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'market' | 'my-trades'>('market');
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(false);

  // Create Offer State
  const [newAmt, setNewAmt] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newMethod, setNewMethod] = useState('');

  const marketOffers = useMemo(() => p2pOffers.filter(o => o.status === 'available' && o.sellerId !== user.id), [p2pOffers, user.id]);
  const myTrades = useMemo(() => p2pOffers.filter(o => (o.sellerId === user.id || o.buyerId === user.id)), [p2pOffers, user.id]);

  const handleCreate = async () => {
    if (!newAmt || !newPrice || !newMethod) return alert('يرجى إكمال جميع الحقول');
    setLoading(true);
    const res = await createP2POffer(Number(newAmt), Number(newPrice), newMethod);
    if (res.success) { setShowCreate(false); setNewAmt(''); setNewPrice(''); setNewMethod(''); }
    setLoading(false);
  };

  return (
    <div className="h-screen w-full overflow-y-auto overflow-x-hidden bg-[#020617] pb-40 px-5 pt-10 custom-scrollbar" dir="rtl">
      <div className="flex items-center justify-between mb-8">
          <button onClick={() => navigate('/')} className="w-11 h-11 bg-white/5 rounded-2xl flex items-center justify-center text-white border border-white/10 active:scale-90 transition-all"><ChevronLeft size={22} /></button>
          <div className="text-center">
              <h1 className="text-xl font-black text-white">منصة P2P (محلي)</h1>
              <p className="text-primary text-[9px] font-black uppercase tracking-widest">Standalone Trading</p>
          </div>
          <div className="w-11 h-11 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 border border-emerald-500/20"><ShieldCheck size={20} /></div>
      </div>

      <div className="flex p-1 bg-black/40 rounded-2xl mb-8 border border-white/5">
          <button onClick={() => setActiveTab('market')} className={`flex-1 py-3 rounded-xl text-[11px] font-black transition-all flex items-center justify-center gap-2 ${activeTab === 'market' ? 'bg-primary text-black' : 'text-slate-500'}`}><ShoppingCart size={14}/> السوق</button>
          <button onClick={() => setActiveTab('my-trades')} className={`flex-1 py-3 rounded-xl text-[11px] font-black transition-all flex items-center justify-center gap-2 ${activeTab === 'my-trades' ? 'bg-primary text-black' : 'text-slate-500'}`}><ArrowRightLeft size={14}/> تداولاتي</button>
      </div>

      {activeTab === 'market' && (
          <div className="space-y-4">
              {marketOffers.length === 0 && <div className="text-center py-20 text-slate-600">لا توجد عروض</div>}
              {marketOffers.map(offer => (
                  <div key={offer.id} className="bg-[#0d1117] p-6 rounded-[2.5rem] border border-white/5 shadow-xl relative">
                      <div className="flex justify-between items-center mb-4">
                          <p className="text-white font-black text-xs">{offer.sellerName}</p>
                          <p className="text-emerald-500 font-black text-xl">${offer.priceUsd}</p>
                      </div>
                      <div className="bg-black/20 p-4 rounded-2xl border border-white/5 flex items-center justify-between mb-4">
                          <span className="text-white font-black text-sm">{offer.amount.toLocaleString()} نقطة</span>
                          <span className="text-[8px] text-emerald-500 font-black uppercase tracking-widest">Escrow Active</span>
                      </div>
                      <button onClick={() => buyP2POffer(offer.id)} className="w-full h-12 bg-primary text-black font-black rounded-xl text-xs">بدء الشراء</button>
                  </div>
              ))}
          </div>
      )}

      {activeTab === 'my-trades' && (
          <div className="space-y-4">
              {myTrades.map(trade => (
                  <div key={trade.id} className="bg-[#0d1117] p-6 rounded-[2.5rem] border border-white/5">
                      <div className="flex justify-between mb-4">
                          <span className="text-[10px] text-slate-500">{trade.paymentMethod}</span>
                          <span className="text-primary font-black text-xs">{trade.status}</span>
                      </div>
                      <div className="flex justify-between mb-4">
                          <h4 className="text-white font-black text-lg">${trade.priceUsd}</h4>
                          <p className="text-primary font-bold">{trade.amount.toLocaleString()} P</p>
                      </div>
                      {trade.sellerId === user.id && trade.status === 'available' && (
                          <button onClick={() => cancelP2POffer(trade.id)} className="w-full h-10 bg-rose-500/10 text-rose-500 rounded-xl text-[10px] font-black">إلغاء العرض</button>
                      )}
                  </div>
              ))}
          </div>
      )}

      <button onClick={() => setShowCreate(true)} className="fixed bottom-32 right-6 w-14 h-14 bg-primary text-black rounded-full flex items-center justify-center shadow-2xl z-50 animate-bounce-slow"><Plus size={30}/></button>

      {showCreate && (
          <div className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center px-6">
              <div className="bg-[#0d1117] w-full max-w-sm rounded-[3rem] p-8 border border-white/10">
                  <h2 className="text-2xl font-black text-white mb-6 text-center">عرض بيع جديد</h2>
                  <div className="space-y-4">
                      <input type="number" placeholder="كمية النقاط" value={newAmt} onChange={e=>setNewAmt(e.target.value)} className="w-full bg-[#020617] border border-white/10 rounded-xl p-4 text-white font-black" />
                      <input type="number" placeholder="السعر بالدولار" value={newPrice} onChange={e=>setNewPrice(e.target.value)} className="w-full bg-[#020617] border border-white/10 rounded-xl p-4 text-white font-black" />
                      <select value={newMethod} onChange={e=>setNewMethod(e.target.value)} className="w-full bg-[#020617] border border-white/10 rounded-xl p-4 text-white font-black">
                          <option value="">اختر وسيلة الدفع</option>
                          {paymentMethods.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                      </select>
                      <button onClick={handleCreate} disabled={loading} className="w-full h-14 bg-primary text-black font-black rounded-xl shadow-xl">{loading ? 'جاري النشر...' : 'نشر العرض'}</button>
                      <button onClick={() => setShowCreate(false)} className="w-full text-slate-500 font-bold py-2">تراجع</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default P2P;
