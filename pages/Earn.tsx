
import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { CheckCircle, ExternalLink, Calendar, Youtube, Send, Zap, Star, Trophy, ArrowLeftRight } from 'lucide-react';
import { Task } from '../types';
import { useNavigate } from 'react-router-dom';

const Earn: React.FC = () => {
  const { tasks, completeTask, user } = useGame();
  const [activeFilter, setActiveFilter] = useState<'all' | 'social' | 'ad'>('all');
  const navigate = useNavigate();

  const filteredTasks = tasks.filter(t => activeFilter === 'all' || t.type === activeFilter);

  const handleTaskClick = (task: Task) => {
    if (user.completedTaskIds?.includes(task.id)) return;
    if (task.link) window.open(task.link, '_blank');
    setTimeout(() => completeTask(task.id), 2500);
  };

  const FilterBtn = ({ id, label }: { id: any, label: string }) => (
      <button 
        onClick={() => setActiveFilter(id)}
        className={`px-6 py-2 rounded-full text-[10px] font-black transition-all ${activeFilter === id ? 'bg-primary text-black' : 'bg-white/5 text-slate-500 border border-white/5'}`}
      >
          {label}
      </button>
  );

  return (
    <div className="h-screen w-full overflow-y-auto overflow-x-hidden bg-[#020617] pb-40 px-4 pt-10 custom-scrollbar scroll-smooth" dir="rtl">
      
      <div className="text-center mb-10">
          <div className="inline-flex p-3 bg-yellow-500/10 rounded-2xl text-yellow-500 mb-4 border border-yellow-500/20">
              <Star size={28} className="animate-spin-slow" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tighter">مركز المكافآت</h1>
          <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.3em] mt-1">Complete Missions • Level Up</p>
      </div>

      <div className="flex justify-center gap-2 mb-8">
          <FilterBtn id="all" label="الكل" />
          <FilterBtn id="social" label="تواصل" />
          <FilterBtn id="ad" label="فيديو" />
      </div>

      <div className="space-y-4">
          {filteredTasks.map((task) => {
              const isCompleted = user.completedTaskIds?.includes(task.id);
              return (
                  <div key={task.id} className={`bg-[#0d1117] p-5 rounded-[2.5rem] border border-white/5 flex items-center justify-between group transition-all ${isCompleted ? 'opacity-40 grayscale' : ''}`}>
                      <div className="flex items-center gap-4">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-inner ${task.type === 'ad' ? 'bg-rose-500/10 border-rose-500/10 text-rose-500' : 'bg-blue-500/10 border-blue-500/10 text-blue-400'}`}>
                              {task.type === 'ad' ? <Youtube size={24}/> : <Send size={24}/>}
                          </div>
                          <div className="text-right">
                              <h3 className="text-white font-black text-sm mb-1">{task.title}</h3>
                              <div className="flex items-center gap-1.5">
                                  <div className="w-4 h-4 bg-primary/20 rounded-full flex items-center justify-center">
                                      <Zap size={10} className="text-primary fill-primary"/>
                                  </div>
                                  <span className="text-primary font-black text-xs">+{task.reward.toLocaleString()}</span>
                              </div>
                          </div>
                      </div>

                      <button 
                        onClick={() => handleTaskClick(task)}
                        disabled={isCompleted}
                        className={`h-11 px-5 rounded-xl font-black text-[10px] transition-all flex items-center gap-2 ${isCompleted ? 'bg-emerald-500/10 text-emerald-500' : 'bg-primary text-black active:scale-90 shadow-lg shadow-primary/10'}`}
                      >
                          {isCompleted ? <CheckCircle size={16}/> : <ExternalLink size={16}/>}
                          {isCompleted ? 'تم' : 'فتح'}
                      </button>
                  </div>
              );
          })}
      </div>

      <div className="mt-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-8 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
          <div className="relative z-10 text-center">
              <Trophy size={40} className="text-white mx-auto mb-4" />
              <h4 className="text-white font-black text-lg mb-2">هل تريد المزيد؟</h4>
              <p className="text-blue-100 text-[10px] font-bold mb-6">شارك رابطك الخاص واربح 1,000 نقطة عن كل صديق ينضم إليك!</p>
              <button 
                onClick={() => navigate('/friends')}
                className="bg-white text-blue-600 px-8 py-3 rounded-xl font-black text-xs active:scale-95 transition-all"
              >
                  انتقل لمركز الإحالات
              </button>
          </div>
      </div>
    </div>
  );
};

export default Earn;
