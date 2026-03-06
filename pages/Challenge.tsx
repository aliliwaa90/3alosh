
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useGame } from '../context/GameContext';
import { 
  Swords, Loader2, Trophy, Frown, Hand, 
  Coins, LogOut, Grid3X3, Zap, Flame, 
  ChevronLeft, Target, Timer, Sparkles,
  RefreshCw, Skull, CheckCircle2, AlertTriangle,
  Bot
} from 'lucide-react';

type GameType = 'XO' | 'NEON_PULSE' | 'CHICKEN' | null;

const NEON_MULTIPLIERS = [1.5, 2.5, 5.0, 12.0, 30.0, 75.0];

const Challenge: React.FC = () => {
  const { user, startChallenge, resolveChallenge } = useGame();
  
  const [view, setView] = useState<'menu' | 'betting' | 'game'>('menu');
  const [selectedGameType, setSelectedGameType] = useState<GameType>(null);
  const [betAmount, setBetAmount] = useState<string>('500');
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost' | 'draw' | 'searching'>('playing');
  
  // XO State
  const [xoBoard, setXoBoard] = useState<(string|null)[]>(Array(9).fill(null));
  const [isUserTurn, setIsUserTurn] = useState(true);

  // Neon Pulse State
  const [pulseLevel, setPulseLevel] = useState(0);
  const [pulseActive, setPulseActive] = useState(false);
  const [pulseTiming, setPulseTiming] = useState(0); // 0 to 100
  const pulseFrameRef = useRef<number>(null);

  // General Helpers
  const handleBack = () => {
      setView('menu');
      setGameState('playing');
      setPulseLevel(0);
      setXoBoard(Array(9).fill(null));
      if (pulseFrameRef.current) cancelAnimationFrame(pulseFrameRef.current);
  };

  const initGame = (type: GameType) => {
      const amt = Number(betAmount);
      if (user.balance < amt) return alert('رصيدك لا يكفي');

      setSelectedGameType(type);
      if (type === 'XO') {
          setView('game');
          setGameState('searching');
      } else if (type === 'NEON_PULSE') {
          if (startChallenge(amt)) {
              setView('game');
              setGameState('playing');
              setPulseLevel(0);
              startPulseRound(0);
          }
      }
  };

  // --- XO AI (Unbeatable Minimax simplified) ---
  const checkWinner = (board: (string|null)[]) => {
      const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
      for (let [a,b,c] of lines) {
          if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
      }
      return board.includes(null) ? null : 'draw';
  };

  const getBestMove = (board: (string|null)[]) => {
      const empty = board.map((v, i) => v === null ? i : null).filter(v => v !== null) as number[];
      // 1. Can win?
      for (let i of empty) {
          let copy = [...board]; copy[i] = 'O';
          if (checkWinner(copy) === 'O') return i;
      }
      // 2. Must block?
      for (let i of empty) {
          let copy = [...board]; copy[i] = 'X';
          if (checkWinner(copy) === 'X') return i;
      }
      // 3. Strategy
      if (board[4] === null) return 4;
      return empty[Math.floor(Math.random() * empty.length)];
  };

  const handleXOMove = (i: number) => {
      if (xoBoard[i] || !isUserTurn || gameState !== 'playing') return;
      const nextBoard = [...xoBoard];
      nextBoard[i] = 'X';
      setXoBoard(nextBoard);
      const res = checkWinner(nextBoard);
      if (res) return endXOGame(res);

      setIsUserTurn(false);
      setTimeout(() => {
          const bMove = getBestMove(nextBoard);
          nextBoard[bMove] = 'O';
          setXoBoard(nextBoard);
          const bRes = checkWinner(nextBoard);
          if (bRes) endXOGame(bRes);
          else setIsUserTurn(true);
      }, 600);
  };

  const endXOGame = (res: string) => {
      if (res === 'X') { setGameState('won'); resolveChallenge(Number(betAmount), 'win'); }
      else if (res === 'O') { setGameState('lost'); resolveChallenge(Number(betAmount), 'loss'); }
      else { setGameState('draw'); resolveChallenge(Number(betAmount), 'win', 1); }
  };

  // --- NEON PULSE LOGIC (NEW GAME) ---
  const startPulseRound = (level: number) => {
      setPulseActive(true);
      setPulseTiming(0);
      let startTime = Date.now();
      const duration = Math.max(800, 2500 - (level * 400)); // Speed increases

      const animate = () => {
          const elapsed = Date.now() - startTime;
          const progress = (elapsed / duration) * 100;
          if (progress >= 100) {
              setPulseActive(false);
              setGameState('lost');
              resolveChallenge(Number(betAmount), 'loss');
              return;
          }
          setPulseTiming(progress);
          pulseFrameRef.current = requestAnimationFrame(animate);
      };
      pulseFrameRef.current = requestAnimationFrame(animate);
  };

  const handlePulseTap = () => {
      if (!pulseActive || gameState !== 'playing') return;
      if (pulseFrameRef.current) cancelAnimationFrame(pulseFrameRef.current);
      setPulseActive(false);

      // Perfect zone is between 85% and 95%
      if (pulseTiming >= 82 && pulseTiming <= 98) {
          if (pulseLevel === 5) {
              setGameState('won');
              resolveChallenge(Number(betAmount), 'win', NEON_MULTIPLIERS[5]);
          } else {
              setPulseLevel(prev => prev + 1);
              setTimeout(() => startPulseRound(pulseLevel + 1), 600);
          }
      } else {
          setGameState('lost');
          resolveChallenge(Number(betAmount), 'loss');
      }
  };

  const cashoutNeon = () => {
      if (gameState !== 'playing' || pulseLevel === 0) return;
      if (pulseFrameRef.current) cancelAnimationFrame(pulseFrameRef.current);
      setGameState('won');
      resolveChallenge(Number(betAmount), 'win', NEON_MULTIPLIERS[pulseLevel - 1]);
  };

  // --- RENDERERS ---

  if (view === 'menu') {
      return (
        <div className="min-h-screen bg-[#020617] pb-40 px-6 pt-12 flex flex-col items-center overflow-y-auto" dir="rtl">
            <div className="flex flex-col items-center mb-12">
                <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center text-primary mb-5 border border-primary/20 shadow-[0_0_30px_rgba(250,204,21,0.1)]">
                    <Swords size={40} className="animate-pulse" />
                </div>
                <h1 className="text-4xl font-black text-white tracking-tighter">المواجهة الكبرى</h1>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] mt-2 opacity-60">High-Stakes Skill Arena</p>
            </div>

            <div className="w-full space-y-4">
                {[
                    { id: 'NEON_PULSE', name: 'نبض النيون', desc: 'تحدي السرعة الخارق (x75)', icon: <Target className="animate-spin-slow"/>, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
                    { id: 'XO', name: 'ذكاء الروبوت', desc: 'اهزم الروبوت المحترف في XO', icon: <Grid3X3 />, color: 'text-rose-400', bg: 'bg-rose-500/10' },
                ].map(g => (
                    <button key={g.id} onClick={() => {setSelectedGameType(g.id as any); setView('betting');}} className="w-full bg-[#0d1117] p-8 rounded-[3rem] border border-white/5 flex items-center justify-between group active:scale-[0.98] transition-all shadow-2xl relative overflow-hidden">
                        <div className={`absolute top-0 right-0 w-32 h-32 ${g.bg} blur-[60px] opacity-20`}></div>
                        <div className="flex items-center gap-6 relative z-10">
                            <div className={`w-16 h-16 ${g.bg} ${g.color} rounded-2xl flex items-center justify-center shadow-inner border border-white/5`}>{g.icon}</div>
                            <div className="text-right">
                                <h3 className="text-white font-black text-lg">{g.name}</h3>
                                <p className="text-slate-500 text-xs font-bold">{g.desc}</p>
                            </div>
                        </div>
                        <ChevronLeft className="text-slate-700 group-hover:text-white transition-colors" size={24}/>
                    </button>
                ))}
            </div>
            
            <div className="mt-12 p-6 bg-white/5 rounded-3xl border border-white/5 flex items-center gap-4 opacity-40">
                <AlertTriangle size={20} className="text-primary"/>
                <p className="text-[10px] font-bold text-slate-400">تحذير: الألعاب في هذه الساحة تتطلب مهارة عالية وتركيزاً كبيراً. الخسارة واردة جداً.</p>
            </div>
        </div>
      );
  }

  if (view === 'betting') {
      return (
          <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center px-6 pb-20" dir="rtl">
               <div className="w-full max-w-sm bg-[#0d1117] p-12 rounded-[4rem] border border-white/5 shadow-2xl text-center">
                    <h2 className="text-3xl font-black text-white mb-8 tracking-tighter">حدد الرهان</h2>
                    <div className="grid grid-cols-2 gap-4 mb-10">
                        {['1000', '5000', '10000', '50000'].map(amt => (
                            <button key={amt} onClick={() => setBetAmount(amt)} className={`py-5 rounded-2xl font-black text-base transition-all border ${betAmount === amt ? 'bg-primary text-black border-primary shadow-xl shadow-primary/20' : 'bg-white/5 text-slate-500 border-white/5 hover:border-white/20'}`}>
                                {Number(amt).toLocaleString()}
                            </button>
                        ))}
                    </div>
                    <div className="flex flex-col gap-4">
                        <button onClick={() => initGame(selectedGameType)} className="w-full h-20 bg-primary text-black font-black rounded-3xl text-lg shadow-2xl active:scale-95 transition-transform flex items-center justify-center gap-3">
                            <Sparkles size={24} /> دخول التحدي
                        </button>
                        <button onClick={handleBack} className="w-full h-14 bg-white/5 text-slate-600 font-black rounded-2xl text-xs">تراجع</button>
                    </div>
               </div>
          </div>
      );
  }

  return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center pt-10 px-6 pb-40" dir="rtl">
          
          <div className="w-full flex justify-between items-center mb-12">
              <button onClick={handleBack} className="w-12 h-12 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-500 border border-rose-500/10"><LogOut size={22}/></button>
              <div className="text-center">
                  <h3 className="text-white font-black text-lg">{selectedGameType === 'NEON_PULSE' ? 'نبض النيون' : 'تحدي XO الصعب'}</h3>
                  <div className="flex items-center gap-2 justify-center mt-1">
                      <Coins size={14} className="text-primary"/>
                      <span className="text-primary text-xs font-black">{Number(betAmount).toLocaleString()}</span>
                  </div>
              </div>
              <div className="w-12"></div>
          </div>

          {/* GAME: NEON PULSE */}
          {selectedGameType === 'NEON_PULSE' && gameState === 'playing' && (
              <div className="w-full max-w-sm flex flex-col items-center animate-scale-in">
                  <div className="w-full flex justify-between items-center mb-10 bg-[#0d1117] p-6 rounded-3xl border border-white/5">
                      <div className="flex flex-col">
                          <span className="text-[10px] font-black text-slate-500 uppercase">المستوى</span>
                          <span className="text-2xl font-black text-white">{pulseLevel + 1}/6</span>
                      </div>
                      <button onClick={cashoutNeon} className={`px-6 py-3 rounded-2xl font-black text-xs transition-all ${pulseLevel > 0 ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'bg-white/5 text-slate-700'}`}>
                          انسحاب بـ x{NEON_MULTIPLIERS[pulseLevel-1] || 0}
                      </button>
                  </div>

                  {/* Visual Game Area */}
                  <div 
                    className="relative w-72 h-72 rounded-full border-8 border-white/5 flex items-center justify-center cursor-pointer active:scale-95 transition-transform select-none"
                    onClick={handlePulseTap}
                  >
                      {/* Inner Target */}
                      <div className="w-20 h-20 bg-cyan-500 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(6,182,212,0.6)] z-20">
                          <Zap size={32} className="text-white fill-white"/>
                      </div>

                      {/* Moving Pulse Ring */}
                      <div 
                        className="absolute rounded-full border-4 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-none"
                        style={{ 
                            width: `${100 - pulseTiming}%`, 
                            height: `${100 - pulseTiming}%`,
                            opacity: pulseTiming > 80 ? 1 : 0.3
                        }}
                      ></div>

                      {/* Static Sweet Spot Ring */}
                      <div className="absolute w-[15%] h-[15%] rounded-full border-2 border-white/20"></div>
                      <div className="absolute w-[25%] h-[25%] rounded-full border-2 border-white/40"></div>
                  </div>

                  <div className="mt-12 text-center">
                      <p className="text-white font-black text-base mb-2">اضغط عندما تقترب الحلقة من المركز!</p>
                      <p className="text-slate-500 text-[10px] font-bold">كلما تقدمت، زادت السرعة.</p>
                  </div>
              </div>
          )}

          {/* GAME: XO */}
          {selectedGameType === 'XO' && gameState === 'playing' && (
              <div className="w-full max-w-sm animate-scale-in">
                  <div className="flex justify-between items-center mb-8 bg-[#0d1117] p-5 rounded-3xl border border-white/5">
                      <div className={`flex items-center gap-3 ${isUserTurn ? 'text-primary' : 'text-slate-600'}`}>
                          <div className="w-10 h-10 rounded-xl bg-current/10 flex items-center justify-center font-black">X</div>
                          <span className="text-sm font-black">أنت</span>
                      </div>
                      <div className="px-4 py-1 bg-white/5 rounded-full text-[10px] font-black text-slate-500">مستوى: مستحيل</div>
                      <div className={`flex items-center gap-3 ${!isUserTurn ? 'text-rose-500' : 'text-slate-600'}`}>
                          <span className="text-sm font-black">البوت</span>
                          <div className="w-10 h-10 rounded-xl bg-current/10 flex items-center justify-center font-black">O</div>
                      </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 bg-[#0d1117] p-5 rounded-[3rem] border border-white/5 shadow-2xl">
                      {xoBoard.map((cell, i) => (
                          <button key={i} onClick={() => handleXOMove(i)} className={`h-28 rounded-3xl text-5xl font-black flex items-center justify-center transition-all ${cell === 'X' ? 'bg-primary/10 text-primary shadow-[inset_0_0_20px_rgba(250,204,21,0.1)]' : cell === 'O' ? 'bg-rose-500/10 text-rose-500 shadow-[inset_0_0_20px_rgba(239,68,68,0.1)]' : 'bg-[#020617] border border-white/5 hover:border-white/10 active:scale-95'}`}>
                              {cell}
                          </button>
                      ))}
                  </div>
              </div>
          )}

          {/* --- RESULTS OVERLAY --- */}
          {(gameState === 'won' || gameState === 'lost' || gameState === 'draw') && (
              <div className="fixed inset-0 z-[200] bg-black/98 backdrop-blur-2xl flex items-center justify-center px-8 animate-fade-in">
                  <div className="w-full max-w-sm text-center">
                      <div className={`w-28 h-28 rounded-[3rem] flex items-center justify-center mx-auto mb-10 shadow-2xl ${gameState === 'won' ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/20 shadow-emerald-500/20' : gameState === 'lost' ? 'bg-rose-500/20 text-rose-500 border border-rose-500/20 shadow-rose-500/20' : 'bg-slate-500/20 text-slate-400'}`}>
                          {gameState === 'won' ? <Trophy size={56} className="animate-bounce" /> : gameState === 'lost' ? <Skull size={56} /> : <RefreshCw size={56}/>}
                      </div>
                      <h2 className="text-5xl font-black text-white mb-4 tracking-tighter">
                          {gameState === 'won' ? 'أحسنت صنعاً!' : gameState === 'lost' ? 'سحقت تماماً' : 'تعادل عادل'}
                      </h2>
                      <p className="text-slate-500 text-sm font-bold mb-12 leading-relaxed px-6">
                          {gameState === 'won' ? 'مهارتك استثنائية! لقد ربحت الرهان وتمت إضافة النقاط لحسابك.' : gameState === 'lost' ? 'هذه اللعبة مخصصة للمحترفين فقط. تدرب جيداً وحاول مرة أخرى.' : 'لقد كان التحدي متكافئاً. تم استعادة مبلغ الرهان.'}
                      </p>
                      <button onClick={handleBack} className="w-full h-20 bg-primary text-black font-black rounded-3xl text-lg active:scale-95 shadow-2xl transition-transform">العودة للساحة</button>
                  </div>
              </div>
          )}

          {gameState === 'searching' && (
             <div className="fixed inset-0 z-[200] bg-[#020617] flex flex-col items-center justify-center px-8">
                  <div className="relative mb-8">
                      <div className="w-24 h-24 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                      <Bot size={40} className="absolute inset-0 m-auto text-primary" />
                  </div>
                  <h2 className="text-2xl font-black text-white mb-2">جاري تجهيز الروبوت...</h2>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Master Bot AI Loading</p>
                  
                  {/* Auto-start search simulation */}
                  {setTimeout(() => {
                      if (gameState === 'searching') {
                          if (startChallenge(Number(betAmount))) {
                              setGameState('playing');
                              setIsUserTurn(true);
                          } else {
                              handleBack();
                              alert('رصيدك لا يكفي');
                          }
                      }
                  }, 2000) && null}
             </div>
          )}

      </div>
  );
};

export default Challenge;
