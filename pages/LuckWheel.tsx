
import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { Sparkles, Trophy, Coins, Clock, RotateCw, Gift, X, Star, ChevronLeft, Zap, PartyPopper, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PRIZES = [
    { label: '5000', value: 5000, color: 'from-yellow-400 to-orange-500', icon: <Trophy size={20} />, rarity: 'jackpot', probability: 0.05 },
    { label: '100', value: 100, color: 'from-slate-700 to-slate-900', icon: <Coins size={18} />, rarity: 'common', probability: 0.20 },
    { label: 'حظ أوفر', value: 0, color: 'from-red-500 to-red-700', icon: <X size={18} />, rarity: 'none', probability: 0.20 },
    { label: '500', value: 500, color: 'from-blue-500 to-indigo-600', icon: <Zap size={18} />, rarity: 'uncommon', probability: 0.15 },
    { label: '250', value: 250, color: 'from-emerald-500 to-teal-700', icon: <TrendingUp size={18} />, rarity: 'common', probability: 0.15 },
    { label: '1000', value: 1000, color: 'from-purple-500 to-pink-600', icon: <Star size={18} />, rarity: 'rare', probability: 0.10 },
    { label: 'حظ أوفر', value: 0, color: 'from-red-500 to-red-700', icon: <X size={18} />, rarity: 'none', probability: 0.10 },
    { label: '2500', value: 2500, color: 'from-orange-400 to-red-500', icon: <Gift size={18} />, rarity: 'epic', probability: 0.05 },
];

const LuckWheel: React.FC = () => {
    const { user, spinWheel } = useGame();
    const [isSpinning, setIsSpinning] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [result, setResult] = useState<typeof PRIZES[0] | null>(null);
    const [showCelebration, setShowCelebration] = useState(false);
    const [showSpinConfirm, setShowSpinConfirm] = useState(false);
    const [showClaimDialog, setShowClaimDialog] = useState(false);
    const [cooldown, setCooldown] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const checkCooldown = () => {
            const lastSpin = user.lastWheelSpin || 0;
            const now = Date.now();
            const ONE_DAY = 24 * 60 * 60 * 1000;
            if (now - lastSpin < ONE_DAY) {
                const diff = ONE_DAY - (now - lastSpin);
                const h = Math.floor(diff / (1000 * 60 * 60));
                const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                setCooldown(`${h}س و ${m}د`);
            } else {
                setCooldown(null);
            }
        };
        checkCooldown();
        const timer = setInterval(checkCooldown, 60000);
        return () => clearInterval(timer);
    }, [user.lastWheelSpin]);

    const initiateSpin = () => {
        if (isSpinning || cooldown) return;
        setShowSpinConfirm(true);
    };

    const handleSpin = () => {
        setShowSpinConfirm(false);
        setIsSpinning(true);
        setResult(null);
        setShowCelebration(false);
        setShowClaimDialog(false);

        let random = Math.random();
        let selectedIndex = 0;
        let cumulativeProbability = 0;

        for (let i = 0; i < PRIZES.length; i++) {
            cumulativeProbability += PRIZES[i].probability;
            if (random < cumulativeProbability) {
                selectedIndex = i;
                break;
            }
        }

        const prize = PRIZES[selectedIndex];
        const sliceAngle = 360 / PRIZES.length;
        const targetRotation = (selectedIndex * sliceAngle);
        const totalRotation = rotation + (360 * 10) - targetRotation - (rotation % 360);
        
        setRotation(totalRotation);

        if (window.Telegram?.WebApp?.HapticFeedback) {
            window.Telegram.WebApp.HapticFeedback.impactOccurred('heavy');
        }

        setTimeout(async () => {
            setIsSpinning(false);
            setResult(prize);
            
            if (prize.value > 0) {
                setShowClaimDialog(true);
                if (window.Telegram?.WebApp?.HapticFeedback) {
                    window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
                }
            } else {
                await spinWheel(0);
                if (window.Telegram?.WebApp?.HapticFeedback) {
                    window.Telegram.WebApp.HapticFeedback.notificationOccurred('warning');
                }
            }
        }, 5500); 
    };

    const confirmClaim = async () => {
        if (!result || result.value <= 0) return;
        setShowClaimDialog(false);
        setShowCelebration(true);
        await spinWheel(result.value);
    };

    return (
        <div className="min-h-screen bg-navy-dark pb-32 px-4 pt-6 overflow-hidden page-slide-up flex flex-col items-center custom-scrollbar">
            
            <div className="w-full flex items-center justify-between mb-8">
                <button onClick={() => navigate('/')} className="w-11 h-11 flex items-center justify-center rounded-2xl bg-navy-light text-white shadow-xl border border-white/5 active:scale-90 transition-all">
                    <ChevronLeft size={22} />
                </button>
                <div className="text-center">
                    <h1 className="text-xl font-black text-white tracking-tighter">عجلة الحظ</h1>
                    <p className="text-primary text-[9px] font-black uppercase tracking-widest">Premium Draw</p>
                </div>
                <div className="w-11 h-11 flex items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
                    <Sparkles size={18} className="animate-pulse" />
                </div>
            </div>

            <div className="relative w-[85vw] max-w-[340px] aspect-square flex items-center justify-center mb-10">
                <div className="absolute top-[-15px] left-1/2 -translate-x-1/2 z-[60] flex flex-col items-center drop-shadow-2xl">
                    <div className="w-10 h-12 bg-primary rounded-b-3xl border-4 border-navy-dark flex items-center justify-center shadow-lg">
                        <div className="w-3 h-3 bg-white rounded-full animate-pulse shadow-[0_0_10px_white]"></div>
                    </div>
                </div>

                <div className="absolute inset-0 rounded-full border-[12px] border-navy-light shadow-2xl z-0"></div>
                
                <div 
                    className="w-full h-full rounded-full border-[4px] border-navy-light relative overflow-hidden transition-transform duration-[5500ms] z-10"
                    style={{ 
                        transform: `rotate(${rotation}deg)`,
                        transitionTimingFunction: 'cubic-bezier(0.15, 0, 0.1, 1)',
                    }}
                >
                    {PRIZES.map((p, i) => (
                        <div 
                            key={i} 
                            className={`absolute top-0 left-1/2 h-1/2 w-full -translate-x-1/2 origin-bottom flex flex-col items-center pt-8 bg-gradient-to-b ${p.color}`}
                            style={{ 
                                clipPath: 'polygon(50% 100%, 20% 0, 80% 0)',
                                transform: `translateX(-50%) rotate(${i * (360/PRIZES.length)}deg)` 
                            }}
                        >
                            <div className="flex flex-col items-center gap-1.5 transform rotate-180">
                                <div className="text-white drop-shadow-md">{p.icon}</div>
                                <span className="font-black text-[10px] text-white uppercase tracking-tighter">{p.label}</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="absolute inset-0 m-auto w-16 h-16 bg-navy-dark rounded-full border-[4px] border-navy-light flex items-center justify-center shadow-2xl z-30 ring-2 ring-primary/20">
                    <div className="flex flex-col items-center">
                        <Coins size={20} className="text-primary animate-bounce-short" />
                        <span className="text-[6px] font-black text-primary uppercase tracking-widest">LUCKY</span>
                    </div>
                </div>
            </div>

            <div className="w-full max-w-xs mt-4">
                {cooldown ? (
                    <div className="bg-navy-light/60 backdrop-blur-md p-8 rounded-[3rem] border border-white/5 text-center shadow-xl">
                        <div className="flex items-center justify-center gap-2 text-slate-500 font-black text-[10px] mb-2 uppercase tracking-widest">
                            <Clock size={16} className="text-primary" />
                            <span>المحاولة القادمة</span>
                        </div>
                        <span className="text-white font-black text-3xl tracking-tighter block">{cooldown}</span>
                    </div>
                ) : (
                    <button 
                        onClick={initiateSpin}
                        disabled={isSpinning}
                        className={`w-full h-16 rounded-3xl font-black text-lg tracking-tight flex items-center justify-center transition-all transform active:scale-95 shadow-2xl relative overflow-hidden group ${
                            isSpinning 
                            ? 'bg-white/5 text-slate-500 cursor-not-allowed' 
                            : 'bg-primary text-black'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                           <RotateCw className={isSpinning ? "animate-spin" : ""} size={22} />
                           <span>{isSpinning ? 'جاري السحب...' : 'سحب مجاني الآن'}</span>
                        </div>
                    </button>
                )}
            </div>

            {/* MODALS RENDERED HERE... (KEEPING EXISTING LOGIC) */}
            {showSpinConfirm && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-md px-6 animate-fade-in">
                    <div className="bg-navy-light p-8 rounded-[3rem] w-full max-w-sm text-center shadow-2xl border border-white/5">
                        <div className="w-16 h-16 bg-primary/20 rounded-3xl flex items-center justify-center mx-auto mb-6 text-primary"><AlertCircle size={32} /></div>
                        <h2 className="text-2xl font-black text-white mb-2 tracking-tighter">تأكيد السحب</h2>
                        <p className="text-slate-500 text-xs font-bold leading-relaxed mb-8 px-4 uppercase tracking-wider">هل أنت مستعد لتجربة حظك اليوم؟</p>
                        <div className="flex flex-col gap-3">
                            <button onClick={handleSpin} className="w-full h-14 bg-primary text-black font-black rounded-2xl text-sm active:scale-95">بدء السحب</button>
                            <button onClick={() => setShowSpinConfirm(false)} className="w-full h-14 bg-white/5 text-slate-500 font-black rounded-2xl text-sm active:scale-95">إلغاء</button>
                        </div>
                    </div>
                </div>
            )}

            {showClaimDialog && result && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 backdrop-blur-md px-6 animate-fade-in">
                    <div className="bg-navy-light p-10 rounded-[3rem] w-full max-w-sm text-center shadow-2xl relative overflow-hidden border border-primary/20">
                        <div className="relative mb-8">
                            <div className="w-24 h-24 bg-primary/10 rounded-[2.5rem] flex items-center justify-center mx-auto border-2 border-primary/30 rotate-6"><Trophy size={48} className="text-primary drop-shadow-lg" /></div>
                        </div>
                        <h2 className="text-3xl font-black text-white mb-2 tracking-tighter">مبروك!</h2>
                        <div className="bg-black/30 rounded-[2rem] p-7 mb-8 border border-white/5">
                            <span className="text-5xl font-black text-primary block mb-1">+{result.value.toLocaleString()}</span>
                            <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Points Added</span>
                        </div>
                        <button onClick={confirmClaim} className="w-full h-16 bg-primary text-black font-black rounded-2xl text-lg shadow-xl active:scale-95">تأكيد الاستلام</button>
                    </div>
                </div>
            )}
            
            {result && result.value === 0 && !isSpinning && !showClaimDialog && (
                 <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl px-4 animate-fade-in">
                    <div className="w-full max-w-[320px] bg-navy-light p-10 rounded-[3rem] text-center relative overflow-hidden border border-white/5 shadow-2xl">
                        <div className="w-24 h-24 bg-white/5 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border border-white/5"><X size={48} className="text-slate-600" /></div>
                        <h2 className="text-3xl font-black text-white mb-3 tracking-tighter">حظ أوفر!</h2>
                        <p className="text-slate-500 font-bold text-sm leading-relaxed mb-10 px-4">لم يحالفك الحظ هذه المرة. عد غداً للمحاولة مرة أخرى!</p>
                        <button onClick={() => setResult(null)} className="w-full h-14 bg-white/5 text-white font-black rounded-2xl text-base active:scale-95 border border-white/10">موافق</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LuckWheel;
