import { useState, useEffect, useCallback } from 'react';
import { useGame } from '../../context/GameContext';
import GameShell from '../../components/shared/GameShell';
import { playClick } from '../../utils/sound';

const COLORS = [
    { id: 'orange', class: 'bg-amber-500', textClass: 'text-amber-600', name: 'Orange' },
    { id: 'blue', class: 'bg-blue-600', textClass: 'text-blue-600', name: 'Blue' },
    { id: 'green', class: 'bg-emerald-500', textClass: 'text-emerald-600', name: 'Green' },
    { id: 'grey', class: 'bg-slate-400', textClass: 'text-slate-500', name: 'Grey' },
];

const RULES = [
    {
        text: "If grid contains 'Z', mark Orange. Otherwise mark Blue.",
        check: (content) => content.includes('Z') ? 'orange' : 'blue',
        allowedColors: ['orange', 'blue'],
    },
    {
        text: "If all numbers are Even, mark Green. Otherwise mark Grey.",
        check: (content) => {
            const nums = content.filter(c => typeof c === 'number');
            const allEven = nums.length > 0 && nums.every(n => n % 2 === 0);
            return allEven ? 'green' : 'grey';
        },
        allowedColors: ['green', 'grey'],
    },
    {
        text: "If grid contains any Vowel (A, E, I), mark Orange. Otherwise mark Blue.",
        check: (content) => content.some(c => typeof c === 'string' && 'AEI'.includes(c)) ? 'orange' : 'blue',
        allowedColors: ['orange', 'blue'],
    },
    {
        text: "If the sum of all numbers exceeds 10, mark Green. Otherwise mark Grey.",
        check: (content) => {
            const sum = content.filter(c => typeof c === 'number').reduce((a, b) => a + b, 0);
            return sum > 10 ? 'green' : 'grey';
        },
        allowedColors: ['green', 'grey'],
    },
    {
        text: "If grid contains 3 or more Numbers, mark Orange. Otherwise mark Blue.",
        check: (content) => {
            const numCount = content.filter(c => typeof c === 'number').length;
            return numCount >= 3 ? 'orange' : 'blue';
        },
        allowedColors: ['orange', 'blue'],
    },
    {
        text: "If grid contains at least one Odd number, mark Green. Otherwise mark Grey.",
        check: (content) => {
            const hasOdd = content.some(c => typeof c === 'number' && c % 2 !== 0);
            return hasOdd ? 'green' : 'grey';
        },
        allowedColors: ['green', 'grey'],
    }
];

const ColorTheGrid = () => {
    const { level, submitAnswer, resetLevelTimer } = useGame();
    const [grids, setGrids] = useState([]);
    const [rule, setRule] = useState(null);
    const [selectedColor, setSelectedColor] = useState(COLORS[0].id);
    const [userColors, setUserColors] = useState({});
    const [feedback, setFeedback] = useState(null);

    const generateGridContent = useCallback(() => {
        const content = [];
        const chars = 'ABEZXY';
        for (let i = 0; i < 4; i++) {
            if (Math.random() > 0.45) {
                content.push(Math.floor(Math.random() * 9) + 1);
            } else {
                content.push(chars[Math.floor(Math.random() * chars.length)]);
            }
        }
        return content;
    }, []);

    const generateLevel = useCallback(() => {
        setFeedback(null);
        const newGrids = [];
        for (let i = 0; i < 4; i++) {
            newGrids.push(generateGridContent());
        }
        setGrids(newGrids);
        setUserColors({});

        const chosenRule = RULES[Math.floor(Math.random() * RULES.length)];
        setRule(chosenRule);
        setSelectedColor(chosenRule.allowedColors[0]);
        resetLevelTimer();
    }, [generateGridContent, resetLevelTimer]);

    useEffect(() => {
        generateLevel();
    }, [level, generateLevel]);

    const handleGridClick = (index) => {
        playClick();
        setUserColors(prev => ({ ...prev, [index]: selectedColor }));
    };

    const handleSubmit = () => {
        if (!rule) return;
        playClick();

        let correct = true;
        for (let i = 0; i < grids.length; i++) {
            const expected = rule.check(grids[i]);
            if (userColors[i] !== expected) {
                correct = false;
                break;
            }
        }

        if (correct) {
            setFeedback('correct');
            setTimeout(() => submitAnswer(true), 400);
        } else {
            setFeedback('wrong');
            submitAnswer(false);
            setTimeout(() => setFeedback(null), 800);
        }
    };

    // Keyboard Hotkeys: 1-4 for palette
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key >= '1' && e.key <= '4') {
                const idx = Number(e.key) - 1;
                if (COLORS[idx]) {
                    e.preventDefault();
                    playClick();
                    setSelectedColor(COLORS[idx].id);
                }
            } else if (e.key === 'Enter') {
                e.preventDefault();
                handleSubmit();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    });

    const SHORTCUTS = [
        { key: '1, 2, 3, 4', action: 'Select Color' },
        { key: 'Enter', action: 'Submit Colors' },
    ];

    const INSTRUCTIONS = [
        {
            title: "Rule-Based Classification",
            desc: "Read the active conditional statement at the top. Determine whether each of the 4 grids satisfies or violates the condition.",
        },
        {
            title: "Color Tagging",
            desc: "Pick the corresponding color from the palette, then click each grid to assign that tag.",
        },
        {
            title: "Rapid Execution",
            desc: "Press 1-4 to switch active colors quickly, and press Enter to lock in your submission.",
        }
    ];

    if (!rule) return null;

    return (
        <GameShell title="Color the Grid" instructions={INSTRUCTIONS} shortcuts={SHORTCUTS}>
            <div className="flex flex-col items-center justify-center h-full max-w-3xl mx-auto w-full gap-7 sm:gap-8">

                {/* Active Rule Pill */}
                <div className="bg-blue-50/80 p-4 sm:p-5 rounded-2xl border border-blue-200 text-blue-900 font-bold text-center max-w-xl shadow-xs">
                    <span className="text-[10px] uppercase font-bold text-blue-500 tracking-wider block mb-1">
                        Active Evaluation Rule
                    </span>
                    <p className="text-sm sm:text-base">{rule.text}</p>
                </div>

                {/* 4 Grids */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
                    {grids.map((content, idx) => {
                        const colorId = userColors[idx];
                        const colorObj = COLORS.find(c => c.id === colorId);

                        return (
                            <div key={idx} className="flex flex-col items-center gap-2">
                                <button
                                    onClick={() => handleGridClick(idx)}
                                    className={`w-28 h-28 sm:w-32 sm:h-32 grid grid-cols-2 gap-1.5 p-2 rounded-2xl shadow-xs cursor-pointer transition-all border-3 ${
                                        colorObj
                                            ? `${colorObj.class} border-transparent shadow-md scale-102`
                                            : 'bg-white border-slate-200 hover:border-blue-400'
                                    }`}
                                >
                                    {content.map((item, i) => (
                                        <div
                                            key={i}
                                            className="flex items-center justify-center bg-white/90 rounded-lg font-black font-mono text-base text-slate-800 shadow-2xs"
                                        >
                                            {item}
                                        </div>
                                    ))}
                                </button>
                                <span className="text-xs font-mono font-bold text-slate-400">
                                    Grid #{idx + 1}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* Color Palette */}
                <div className="flex items-center gap-3 p-2.5 sm:p-3 bg-white rounded-full shadow-sm border border-slate-200">
                    {COLORS.map((c, i) => (
                        <button
                            key={c.id}
                            onClick={() => {
                                playClick();
                                setSelectedColor(c.id);
                            }}
                            className={`px-3 py-1.5 rounded-full flex items-center gap-2 text-xs font-bold transition-all ${
                                selectedColor === c.id
                                    ? `${c.class} text-white shadow-sm scale-105`
                                    : 'hover:bg-slate-100 text-slate-600'
                            }`}
                        >
                            <span className={`w-3.5 h-3.5 rounded-full ${c.class} border border-white/50`} />
                            {c.name} <span className="opacity-60 text-[10px]">[{i + 1}]</span>
                        </button>
                    ))}
                </div>

                {/* Submit button */}
                <button
                    onClick={handleSubmit}
                    className="px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-sm shadow-lg shadow-slate-900/10 active:scale-95 transition-all"
                >
                    Submit Grids [Enter]
                </button>

                {feedback && (
                    <div className={`text-xs font-bold ${feedback === 'correct' ? 'text-emerald-600' : 'text-rose-500'}`}>
                        {feedback === 'correct' ? '✓ Rule correctly applied!' : '✗ Condition mismatch. Review the rule carefully.'}
                    </div>
                )}

            </div>
        </GameShell>
    );
};

export default ColorTheGrid;
