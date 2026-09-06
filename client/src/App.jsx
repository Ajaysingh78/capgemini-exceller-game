import { useState } from 'react';
import { GameProvider, useGame } from './context/GameContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthModal from './components/auth/AuthModal';
import DigitChallenge from './games/digit-challenge/DigitChallenge';
import SwitchChallenge from './games/switch-challenge/SwitchChallenge';
import GeoSudo from './games/geo-sudo/GeoSudo';
import GridChallenge from './games/grid-challenge/GridChallenge';
import MotionChallenge from './games/motion-challenge/MotionChallenge';
import InductiveReasoning from './games/inductive-reasoning/InductiveReasoning';
import ColorTheGrid from './games/color-the-grid/ColorTheGrid';
import {
    Calculator,
    Shuffle,
    Grid3X3,
    BrainCircuit,
    Move,
    Lightbulb,
    Palette,
    Play,
    Timer,
    BookOpen,
    Trophy,
    Sparkles,
    CheckCircle2,
    BarChart3,
    LogIn,
    LogOut,
} from 'lucide-react';
import { playClick } from './utils/sound';
import { getCumulativeStats, getHighScores } from './utils/storage';


const GAMES = [
    {
        id: 'digit',
        title: 'Digit Challenge',
        icon: Calculator,
        category: 'Numerical Agility',
        color: 'bg-blue-600 text-blue-600',
        badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
        desc: 'Fill missing digits under strict uniqueness constraints using BODMAS evaluation.'
    },
    {
        id: 'switch',
        title: 'Switch Challenge',
        icon: Shuffle,
        category: 'Deductive Mapping',
        color: 'bg-purple-600 text-purple-600',
        badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
        desc: 'Compare input & output shape orders to decode the hidden 4-digit transposition.'
    },
    {
        id: 'geo',
        title: 'Geo-Sudo',
        icon: Grid3X3,
        category: 'Spatial Deduction',
        color: 'bg-emerald-600 text-emerald-600',
        badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        desc: 'Solve geometric Sudoku grids with zero duplicate symbols across rows and columns.'
    },
    {
        id: 'grid',
        title: 'Grid Challenge',
        icon: BrainCircuit,
        category: 'Working Memory',
        color: 'bg-indigo-600 text-indigo-600',
        badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        desc: 'Memorize dot coordinates while answering interleaved visual symmetry prompts.'
    },
    {
        id: 'motion',
        title: 'Motion Challenge',
        icon: Move,
        category: 'Spatial Planning',
        color: 'bg-orange-600 text-orange-600',
        badgeColor: 'bg-orange-50 text-orange-700 border-orange-200',
        desc: 'Slide blocking tiles to route the red ball into the target with optimal moves.'
    },
    {
        id: 'inductive',
        title: 'Inductive Reasoning',
        icon: Lightbulb,
        category: 'Abstract Logic',
        color: 'bg-amber-600 text-amber-600',
        badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
        desc: 'Spot the single figure that violates the underlying rotational or count rule.'
    },
    {
        id: 'color',
        title: 'Color the Grid',
        icon: Palette,
        category: 'Conditional Execution',
        color: 'bg-rose-600 text-rose-600',
        badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
        desc: 'Rapidly classify 2x2 character matrices against dynamic boolean condition rules.'
    },
];

const Dashboard = () => {
    const { startGame } = useGame();
    const { user, mongoUser, logOut, loading: authLoading } = useAuth();
    const [mode, setMode] = useState('EXAM'); // 'EXAM' | 'PRACTICE'
    const [authModalOpen, setAuthModalOpen] = useState(false);
    const [authModalMode, setAuthModalMode] = useState('login');

    const highScores = getHighScores();
    const stats = getCumulativeStats();

    const handleStart = (gameId) => {
        playClick();
        startGame(gameId, { mode, duration: mode === 'EXAM' ? 360 : 0 });
    };

    return (
        <div className="min-h-screen bg-slate-100 text-slate-800 p-4 sm:p-8 selection:bg-blue-600 selection:text-white">
            <div className="max-w-6xl mx-auto">

                {/* Top Navigation & Student Identity Bar */}
                <nav className="mb-6 flex items-center justify-between py-3 px-4 sm:px-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm shadow-xs">
                            EX
                        </div>
                        <div>
                            <span className="font-extrabold text-slate-900 text-sm tracking-tight block leading-none">
                                Capgemini Exceller
                            </span>
                            <span className="text-[10px] text-slate-400 font-semibold hidden sm:inline">
                                Cognitive Assessment Engine
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {authLoading ? (
                            <div className="text-xs text-slate-400 font-medium">Checking session...</div>
                        ) : user ? (
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200/80 py-1.5 px-3 rounded-xl">
                                    <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-black text-xs uppercase">
                                        {(mongoUser?.displayName || user.displayName || user.email || 'C')[0]}
                                    </div>
                                    <div className="text-left leading-tight hidden sm:block">
                                        <div className="text-xs font-bold text-slate-800 truncate max-w-[150px]">
                                            {mongoUser?.displayName || user.displayName || user.email.split('@')[0]}
                                        </div>
                                        <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
                                            {mongoUser?.collegeName || 'Verified Candidate'}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        playClick();
                                        logOut();
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                                    title="Sign out"
                                >
                                    <LogOut size={14} />
                                    <span className="hidden sm:inline">Sign Out</span>
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => {
                                    playClick();
                                    setAuthModalMode('login');
                                    setAuthModalOpen(true);
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all active:scale-98 cursor-pointer"
                            >
                                <LogIn size={14} />
                                <span>Sign In / Register</span>
                            </button>
                        )}
                    </div>
                </nav>

                {/* Hero Header */}
                <header className="mb-10 text-center">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold mb-4 shadow-2xs">
                        <Sparkles size={14} className="text-blue-600" />
                        Capgemini Exceller Recruitment Aptitude Simulator
                    </div>

                    <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight mb-3">
                        Cognitive Assessment Portal
                    </h1>
                    <p className="text-slate-600 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
                        Practice the exact 7 game-based aptitude modules used in Capgemini Exceller, Aon / cut-e, and top tech screening rounds.
                    </p>

                    {/* Mode Selector Toggle */}
                    <div className="mt-6 inline-flex p-1.5 bg-white rounded-2xl border border-slate-200 shadow-xs">
                        <button
                            onClick={() => {
                                playClick();
                                setMode('EXAM');
                            }}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                                mode === 'EXAM'
                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <Timer size={16} /> Exam Mode (Timed 6m)
                        </button>
                        <button
                            onClick={() => {
                                playClick();
                                setMode('PRACTICE');
                            }}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                                mode === 'PRACTICE'
                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <BookOpen size={16} /> Practice Mode (Untimed & Hints)
                        </button>
                    </div>
                </header>

                {/* Candidate Stats Banner (if user has played) */}
                {stats.totalGamesPlayed > 0 && (
                    <div className="mb-8 p-4 sm:p-5 bg-white rounded-3xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-around gap-4 text-center">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                <BarChart3 size={20} />
                            </div>
                            <div className="text-left">
                                <div className="text-xs font-semibold text-slate-400">Total Attempts</div>
                                <div className="text-lg font-black text-slate-800">{stats.totalGamesPlayed}</div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                <CheckCircle2 size={20} />
                            </div>
                            <div className="text-left">
                                <div className="text-xs font-semibold text-slate-400">Average Accuracy</div>
                                <div className="text-lg font-black text-emerald-600">{stats.avgAccuracy}%</div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                                <Trophy size={20} />
                            </div>
                            <div className="text-left">
                                <div className="text-xs font-semibold text-slate-400">Career Score</div>
                                <div className="text-lg font-black text-amber-600">{stats.totalScore}</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 7 Game Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                    {GAMES.map((game) => {
                        const record = highScores[game.id];

                        return (
                            <div
                                key={game.id}
                                className="group relative bg-white p-6 rounded-3xl shadow-xs hover:shadow-xl transition-all duration-300 border border-slate-200/80 hover:border-blue-400 flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md ${game.color.split(' ')[0]}`}>
                                            <game.icon size={24} strokeWidth={2.2} />
                                        </div>
                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${game.badgeColor}`}>
                                            {game.category}
                                        </span>
                                    </div>

                                    <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">
                                        {game.title}
                                    </h3>
                                    <p className="text-slate-500 text-xs sm:text-sm leading-relaxed mb-6">
                                        {game.desc}
                                    </p>
                                </div>

                                <div>
                                    {/* Personal Record Tag */}
                                    {record && (
                                        <div className="mb-4 flex items-center justify-between text-xs py-1.5 px-3 bg-slate-50 rounded-xl border border-slate-100 text-slate-600">
                                            <span>Best Score: <strong className="text-amber-600 font-bold">{record.score}</strong></span>
                                            <span>Level: <strong className="text-blue-600 font-bold">{record.bestLevel}</strong></span>
                                        </div>
                                    )}

                                    <button
                                        onClick={() => handleStart(game.id)}
                                        className="w-full py-3 px-4 bg-slate-900 hover:bg-blue-600 text-white rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all active:scale-98"
                                    >
                                        <Play size={16} fill="currentColor" />
                                        {mode === 'EXAM' ? 'Start Exam Mode' : 'Start Practice'}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <footer className="mt-16 text-center text-xs text-slate-400 pb-8">
                    Built for Capgemini Exceller, Cognizant, and Aon aptitude preparation • Sound synthesis powered by Web Audio API
                </footer>

                {/* Authentication Modal */}
                <AuthModal
                    isOpen={authModalOpen}
                    onClose={() => setAuthModalOpen(false)}
                    initialMode={authModalMode}
                />
            </div>
        </div>
    );
};

const GameRouter = () => {
    const { currentGameId } = useGame();

    if (!currentGameId) return <Dashboard />;

    switch (currentGameId) {
        case 'digit': return <DigitChallenge />;
        case 'switch': return <SwitchChallenge />;
        case 'geo': return <GeoSudo />;
        case 'grid': return <GridChallenge />;
        case 'motion': return <MotionChallenge />;
        case 'inductive': return <InductiveReasoning />;
        case 'color': return <ColorTheGrid />;
        default: return <Dashboard />;
    }
};

const App = () => {
    return (
        <AuthProvider>
            <GameProvider>
                <GameRouter />
            </GameProvider>
        </AuthProvider>
    );
};

export default App;

