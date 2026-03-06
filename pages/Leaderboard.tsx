
import React, { useEffect, useState } from 'react';
import { useGame } from '../context/GameContext';
import { Trophy, ChevronLeft, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UserState } from '../types';

const Leaderboard: React.FC = () => {
  const { user } = useGame();
  const navigate = useNavigate();
  const [leaders, setLeaders] = useState<Partial<UserState>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaders = async () => {
      try {
        const res = await fetch('/api/leaderboard');
        if (res.ok) {
            const data = await res.json();
            setLeaders(data);
        }
      } catch (e) {
        console.error("Error fetching leaderboard", e);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaders();
  }, []);

  return (
    <div className={`h-screen w-full flex flex-col overflow-hidden ${user.theme === 'light' ? 'bg-slate-50' : 'bg-[#020617]'}`} dir="rtl">
      <div className={`shrink-0 w-full flex items-center justify-between p-6 backdrop-blur-xl border-b z-50 ${user.theme === 'light' ? 'bg-white/90 border-slate-200' : 'bg-[#0d1117]/90 border-white/5'}`}>
          <button onClick={() => navigate('/')} className={`w-11 h-11 rounded-2xl flex items-center justify-center active:scale-90 transition-all border ${user.theme === 'light' ? 'bg-white text-slate-800 border-slate-200' : 'bg-[#020617] text-white border-white/5'}`}><ChevronLeft size={22} /></button>
          <div className="text-center">
              <h1 className={`text-xl font-black ${user.theme === 'light' ? 'text-slate-800' : 'text-white'}`}>لوحة الشرف</h1>
              <p className="text-primary text-[9px] font-black uppercase tracking-widest">Global Champions</p>
          </div>
          <div className="w-11 h-11 bg-primary/10 rounded-2xl flex items-center justify-center text-primary"><Trophy size={20} /></div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-8 pb-40">
          {loading ? (
             <div className="flex justify-center py-20">
                <Loader2 className="animate-spin text-primary" size={40} />
             </div>
          ) : (
            <div className="space-y-3">
              {leaders.map((u, index) => (
                  <div key={u.id} className={`p-5 rounded-[2rem] border flex items-center justify-between ${u.id === user.id ? 'bg-primary/5 border-primary/20 ring-1 ring-primary/20' : (user.theme === 'light' ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#0d1117] border-white/5')}`}>
                      <div className="flex items-center gap-4">
                          <span className={`font-black text-xs w-6 text-center ${index < 3 ? 'text-primary text-lg' : 'text-slate-500'}`}>#{index + 1}</span>
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center overflow-hidden border ${user.theme === 'light' ? 'bg-slate-100 border-slate-200' : 'bg-white/5 border-white/5'}`}>
                              <span className={`font-black ${user.theme === 'light' ? 'text-slate-800' : 'text-white'}`}>{u.name ? u.name[0].toUpperCase() : 'U'}</span>
                          </div>
                          <div className="text-right">
                              <p className={`text-sm font-black leading-none mb-1.5 ${user.theme === 'light' ? 'text-slate-800' : 'text-white'}`}>{u.name} {u.id === user.id && '(أنت)'}</p>
                              <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest opacity-60">Level 1</p>
                          </div>
                      </div>
                      <div className="text-left">
                          <p className={`font-black text-base leading-none mb-1 ${user.theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{u.balance.toLocaleString()}</p>
                          <span className="text-[8px] font-black text-primary uppercase opacity-80">Points</span>
                      </div>
                  </div>
              ))}
            </div>
          )}
      </div>
    </div>
  );
};

export default Leaderboard;
