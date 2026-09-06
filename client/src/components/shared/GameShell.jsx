import { useState } from 'react';
import { useGame } from '../../context/GameContext';
import {
    Timer,
    Trophy,
    Activity,
    XCircle,
    Volume2,
    VolumeX,
    Flame,
    RotateCcw,
    Target,
    Award,
    Clock,
    BookOpen
} from 'lucide-react';
import { motion } from 'framer-motion';
import { getSoundMuted, toggleSoundMuted, playClick } from '../../utils/sound';

const GameShell = ({ children, title, instructions, shortcuts = [] }) => {
    const {
        gameState,
        gameMode,
        score,
        level,
        timeLeft,
        streak,
        stats,
        isNewHighScore,
        endGame,
        resetGame,
        startGame,
        currentGameId
    } = useGame();

    const [showInstructions, setShowInstructions] = useState(false);
    const [muted, setMuted] = useState(getSoundMuted());

    const handleSoundToggle = () => {
        const nextMuted = toggleSoundMuted();
        setMuted(nextMuted);
        if (!nextMuted) playClick();
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const accuracyRate = stats.totalAnswered > 0
        ? Math.round((stats.correctCount / stats.totalAnswered) * 100)
        : 100;

    const avgTimePerQuestion = stats.totalAnswered > 0
        ? (stats.totalSolveTime / stats.totalAnswered).toFixed(1)
        : '0.0';

    const getReadinessTier = () => {
        if (score >= 1200 || (level >= 8 && accuracyRate >= 85)) {
            return {
                title: 'Exceller Elite 🌟',
                badgeClass: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
                desc: 'Top 5% candidate performance. Ready for first-round clearance with high confidence.',
            };
        }
        if (score >= 600 || (level >= 5 && accuracyRate >= 70)) {
            return {
                title: 'Competitive Candidate 🎯',
                badgeClass: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
                desc: 'Strong aptitude foundation. Improving speed will place you in the top tier.',
            };
        }
        return {
            title: 'Developing Aptitude 📚',
            badgeClass: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
            desc: 'Good start. Practice untimed mode to master pattern decoding before speed testing.',
        };
    };

    // GAME OVER SCREEN: Comprehensive Student Readiness Report
    if (gameState === 'GAME_OVER') {
        const tier = getReadinessTier();

        return (
            <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl max-w-2xl w-full"
                >
                    <div className="text-center mb-6">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-4 shadow-lg shadow-amber-500/10">
                            <Trophy className="w-10 h-10" />
                        </div>
                        {isNewHighScore && (
                            <span className="inline-block mb-2 px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full text-xs font-bold border border-amber-500/30 uppercase tracking-widest animate-pulse">
                                ★ New Personal Record! ★
                            </span>
                        )}
                        <h2 className="text-3xl font-extrabold tracking-tight">Assessment Performance Report</h2>
                        <p className="text-slate-400 text-sm mt-1">{title} • {gameMode === 'EXAM' ? 'Exam Mode' : 'Practice Mode'}</p>
                    </div>

                    {/* Readiness Tier Card */}
                    <div className={`p-4 rounded-2xl border mb-6 ${tier.badgeClass}`}>
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold uppercase tracking-wider">Candidate Readiness Rating</span>
                            <span className="text-sm font-extrabold">{tier.title}</span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">{tier.desc}</p>
                    </div>

                    {/* Core Metric Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                        <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/50 text-center">
                            <div className="text-xs text-slate-400 mb-1 flex items-center justify-center gap-1">
                                <Award size={14} className="text-amber-400" /> Score
                            </div>
                            <div className="text-2xl font-black text-amber-400">{score}</div>
                        </div>

                        <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/50 text-center">
                            <div className="text-xs text-slate-400 mb-1 flex items-center justify-center gap-1">
                                <Activity size={14} className="text-blue-400" /> Level
                            </div>
                            <div className="text-2xl font-black text-blue-400">{level}</div>
                        </div>

                        <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/50 text-center">
                            <div className="text-xs text-slate-400 mb-1 flex items-center justify-center gap-1">
                                <Target size={14} className="text-emerald-400" /> Accuracy
                            </div>
                            <div className="text-2xl font-black text-emerald-400">{accuracyRate}%</div>
                        </div>

                        <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/50 text-center">
                            <div className="text-xs text-slate-400 mb-1 flex items-center justify-center gap-1">
                                <Clock size={14} className="text-purple-400" /> Avg Speed
                            </div>
                            <div className="text-2xl font-black text-purple-400">{avgTimePerQuestion}s</div>
                        </div>
                    </div>

                    {/* Question Summary pills */}
                    {stats.questionHistory.length > 0 && (
                        <div className="mb-6 p-4 bg-slate-950/60 rounded-2xl border border-slate-800">
                            <div className="text-xs font-semibold text-slate-400 mb-2 flex items-center justify-between">
                                <span>Question Log ({stats.correctCount} Correct / {stats.wrongCount} Incorrect)</span>
                                <span>{stats.totalAnswered} Total</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                                {stats.questionHistory.map((q, idx) => (
                                    <span
                                        key={idx}
                                        title={`Level ${q.level}: ${q.isCorrect ? 'Correct' : 'Incorrect'} in ${q.timeTaken}s (+${q.points} pts)`}
                                        className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold flex items-center gap-1 ${
                                            q.isCorrect
                                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                        }`}
                                    >
                                        {q.isCorrect ? '✓' : '✗'} L{q.level} ({q.timeTaken}s)
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={() => {
                                playClick();
                                startGame(currentGameId, { mode: gameMode, duration: 360 });
                            }}
                            className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all active:scale-98"
                        >
                            <RotateCcw size={18} /> Try Again
                        </button>
                        <button
                            onClick={() => {
                                playClick();
                                resetGame();
                            }}
                            className="flex-1 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold transition-all active:scale-98"
                        >
                            Return to Dashboard
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col relative text-slate-800 selection:bg-blue-500 selection:text-white">
            {/* Header HUD */}
            <header className="bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-200 px-4 sm:px-6 py-3.5 flex items-center justify-between sticky top-0 z-30">
                {/* Left Section */}
                <div className="flex items-center gap-3 sm:gap-4">
                    <button
                        onClick={() => {
                            playClick();
                            resetGame();
                        }}
                        className="text-xs font-bold text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                        title="Back to menu"
                    >
                        ← Hub
                    </button>
                    <div>
                        <h1 className="text-base sm:text-lg font-bold text-slate-800 leading-tight">{title}</h1>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                                {gameMode === 'EXAM' ? 'Exam Mode' : 'Practice Mode'}
                            </span>
                            <button
                                onClick={() => {
                                    playClick();
                                    setShowInstructions(true);
                                }}
                                className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 hover:underline"
                            >
                                <BookOpen size={12} /> Guide
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Section / Metrics */}
                <div className="flex items-center gap-3 sm:gap-6">
                    {/* Level Pill */}
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold border border-blue-100">
                        <Activity size={14} />
                        Level {level}
                    </div>

                    {/* Streak Badge */}
                    {streak >= 2 && (
                        <motion.div
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            className="hidden sm:flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-600 rounded-full text-xs font-bold border border-amber-200 animate-pulse"
                        >
                            <Flame size={14} className="text-amber-500 fill-amber-500" />
                            {streak}x Streak
                        </motion.div>
                    )}

                    {/* Score */}
                    <div className="flex items-center gap-1.5 text-slate-700 font-bold text-sm sm:text-base">
                        <Trophy size={16} className="text-amber-500" />
                        <span>{score}</span>
                    </div>

                    {/* Timer (Exam Mode countdown, or Practice indicator) */}
                    {gameMode === 'EXAM' ? (
                        <div className={`flex items-center gap-1.5 font-mono text-sm sm:text-base font-bold ${
                            timeLeft < 30 ? 'text-red-500 animate-pulse' : 'text-slate-700'
                        }`}>
                            <Timer size={16} />
                            {formatTime(timeLeft)}
                        </div>
                    ) : (
                        <div className="text-xs font-bold text-slate-400 hidden sm:block">
                            Untimed
                        </div>
                    )}

                    {/* Sound Toggle */}
                    <button
                        onClick={handleSoundToggle}
                        className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                        title={muted ? 'Unmute Sound' : 'Mute Sound'}
                    >
                        {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                    </button>

                    {/* Quit / End Session */}
                    <button
                        onClick={() => {
                            playClick();
                            endGame();
                        }}
                        className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-xl transition-colors"
                        title="Finish Assessment"
                    >
                        <XCircle size={20} />
                    </button>
                </div>
            </header>

            {/* Game Content Body */}
            <main className="flex-1 p-4 sm:p-6 overflow-y-auto relative flex flex-col justify-center">
                {children}
            </main>

            {/* Instruction / Guide Modal */}
            {showInstructions && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-3xl shadow-2xl max-w-xl w-full max-h-[85vh] overflow-hidden flex flex-col border border-slate-100"
                    >
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">Mastering {title}</h2>
                                <p className="text-xs text-slate-500 mt-0.5">Capgemini Cognitive Aptitude Guidelines</p>
                            </div>
                            <button
                                onClick={() => {
                                    playClick();
                                    setShowInstructions(false);
                                }}
                                className="p-2 hover:bg-slate-200/60 rounded-full text-slate-400 hover:text-slate-700"
                            >
                                <XCircle size={20} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-6">
                            {Array.isArray(instructions) ? (
                                <div className="space-y-4">
                                    {instructions.map((step, idx) => (
                                        <div key={idx} className="flex gap-3.5">
                                            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                                                {idx + 1}
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-bold text-slate-800 text-sm mb-0.5">{step.title}</h3>
                                                <p className="text-slate-500 text-xs leading-relaxed">{step.desc}</p>
                                                {step.visual && (
                                                    <div className="mt-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                                        {step.visual}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-slate-600 text-sm leading-relaxed">{instructions}</p>
                            )}

                            {/* Keyboard Shortcuts Section */}
                            {shortcuts && shortcuts.length > 0 && (
                                <div className="pt-4 border-t border-slate-100">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                                        ⚡ Keyboard Speed Controls
                                    </h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        {shortcuts.map((sc, i) => (
                                            <div key={i} className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                                                <span className="text-slate-600">{sc.action}</span>
                                                <kbd className="px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-700 font-mono font-bold shadow-xs">
                                                    {sc.key}
                                                </kbd>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                            <button
                                onClick={() => {
                                    playClick();
                                    setShowInstructions(false);
                                }}
                                className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition-colors"
                            >
                                Got it, Let&apos;s Play!
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default GameShell;
