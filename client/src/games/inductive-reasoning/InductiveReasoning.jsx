import { useState, useEffect, useCallback } from 'react';
import { useGame } from '../../context/GameContext';
import GameShell from '../../components/shared/GameShell';
import { Circle, Square, HelpCircle } from 'lucide-react';
import { playClick } from '../../utils/sound';

const ArrowIcon = ({ rotation, ...props }) => (
    <svg
        width="28" height="28" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        style={{ transform: `rotate(${rotation}deg)` }}
        {...props}
    >
        <line x1="12" y1="19" x2="12" y2="5"></line>
        <polyline points="5 12 12 5 19 12"></polyline>
    </svg>
);

const InductiveReasoning = () => {
    const { level, gameMode, submitAnswer, resetLevelTimer } = useGame();
    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [showExplanation, setShowExplanation] = useState(false);

    const generateQuestion = useCallback(() => {
        setShowExplanation(false);
        const ruleTypes = ['ROTATION', 'COUNT', 'FILL', 'SIDES'];
        const chosenType = ruleTypes[Math.floor(Math.random() * ruleTypes.length)];
        const correctIdx = Math.floor(Math.random() * 5);
        const options = [];
        let ruleExplanation = '';

        if (chosenType === 'ROTATION') {
            const step = Math.random() > 0.5 ? 90 : 45;
            const start = Math.floor(Math.random() * 8) * 45;
            for (let i = 0; i < 5; i++) {
                let rot = (start + i * step) % 360;
                if (i === correctIdx) {
                    rot = (rot + (step === 90 ? 45 : 90)) % 360;
                }
                options.push({ id: i, rotation: rot, type: 'rotation' });
            }
            ruleExplanation = `All arrows rotate sequentially by ${step}° clockwise, except Option ${String.fromCharCode(65 + correctIdx)}.`;
        } else if (chosenType === 'COUNT') {
            const baseCount = Math.floor(Math.random() * 3) + 2; // 2, 3, 4
            for (let i = 0; i < 5; i++) {
                let count = baseCount;
                if (i === correctIdx) {
                    count = baseCount + 1;
                }
                options.push({ id: i, count, type: 'count' });
            }
            ruleExplanation = `All figures contain exactly ${baseCount} items, except Option ${String.fromCharCode(65 + correctIdx)} which has ${baseCount + 1}.`;
        } else if (chosenType === 'FILL') {
            const majorityFilled = Math.random() > 0.5;
            for (let i = 0; i < 5; i++) {
                const filled = (i === correctIdx) ? !majorityFilled : majorityFilled;
                options.push({ id: i, filled, type: 'fill' });
            }
            ruleExplanation = `Option ${String.fromCharCode(65 + correctIdx)} is the only ${majorityFilled ? 'hollow' : 'filled'} shape.`;
        } else {
            // SIDES / SHAPE TYPE
            for (let i = 0; i < 5; i++) {
                const shapeKind = (i === correctIdx) ? 'square' : 'circle';
                options.push({ id: i, shapeKind, type: 'shape_kind' });
            }
            ruleExplanation = `Option ${String.fromCharCode(65 + correctIdx)} is a Square, while all other options are Circles.`;
        }

        setCurrentQuestion({ options, correct: correctIdx, explanation: ruleExplanation });
        resetLevelTimer();
    }, [resetLevelTimer]);

    useEffect(() => {
        generateQuestion();
    }, [level, generateQuestion]);

    const handleOptionClick = useCallback((idx) => {
        if (!currentQuestion) return;
        playClick();

        if (idx === currentQuestion.correct) {
            setTimeout(() => submitAnswer(true), 400);
        } else {
            submitAnswer(false);
            setTimeout(() => generateQuestion(), 600);
        }
    }, [currentQuestion, submitAnswer, generateQuestion]);

    // Keyboard Hotkeys: A, B, C, D, E or 1-5
    useEffect(() => {
        const handleKeyDown = (e) => {
            const keyMap = {
                '1': 0, '2': 1, '3': 2, '4': 3, '5': 4,
                'a': 0, 'b': 1, 'c': 2, 'd': 3, 'e': 4,
            };
            const lower = e.key.toLowerCase();
            if (lower in keyMap) {
                e.preventDefault();
                handleOptionClick(keyMap[lower]);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleOptionClick]);

    const SHORTCUTS = [
        { key: 'A, B, C, D, E', action: 'Select Figure A to E' },
        { key: '1, 2, 3, 4, 5', action: 'Select Figure 1 to 5' },
    ];

    const INSTRUCTIONS = [
        {
            title: "Spot the Pattern Breaker",
            desc: "Four of the five figures adhere to a consistent logical rule (rotation, element count, or fill style). Exactly one figure violates the rule.",
        },
        {
            title: "Rule Variations",
            desc: "Watch for clockwise rotational progressions, count symmetry, and solid vs hollow fills.",
        },
        {
            title: "Speed Selection",
            desc: "Press [A] through [E] or [1] through [5] on your keyboard to instantly submit your choice.",
        }
    ];

    if (!currentQuestion) return null;

    return (
        <GameShell title="Inductive Reasoning" instructions={INSTRUCTIONS} shortcuts={SHORTCUTS}>
            <div className="flex flex-col items-center justify-center h-full max-w-3xl mx-auto w-full gap-8">

                <div className="text-center">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">
                        Pattern Exception Discovery
                    </span>
                    <h2 className="text-lg sm:text-xl font-bold text-slate-700">
                        Which figure does NOT belong in this set?
                    </h2>
                </div>

                {/* 5 Figures Grid */}
                <div className="grid grid-cols-5 gap-2.5 sm:gap-4 w-full">
                    {currentQuestion.options.map((opt, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleOptionClick(idx)}
                            className="h-28 sm:h-36 flex flex-col items-center justify-center bg-white border-2 border-slate-200 rounded-2xl hover:border-blue-500 hover:bg-blue-50/40 shadow-xs transition-all active:scale-95 group p-2"
                        >
                            <div className="flex-1 flex items-center justify-center">
                                {opt.type === 'rotation' && (
                                    <ArrowIcon rotation={opt.rotation} className="text-slate-700 group-hover:text-blue-600 transition-colors" />
                                )}

                                {opt.type === 'count' && (
                                    <div className="flex flex-wrap justify-center gap-1.5 max-w-14">
                                        {Array(opt.count).fill(0).map((_, i) => (
                                            <Circle key={i} size={11} className="text-blue-600 fill-blue-600" />
                                        ))}
                                    </div>
                                )}

                                {opt.type === 'fill' && (
                                    <Circle
                                        size={28}
                                        className={opt.filled ? 'text-indigo-600 fill-indigo-600' : 'text-slate-400 stroke-2'}
                                    />
                                )}

                                {opt.type === 'shape_kind' && (
                                    opt.shapeKind === 'circle'
                                        ? <Circle size={28} className="text-blue-600 stroke-2" />
                                        : <Square size={28} className="text-amber-500 stroke-2" />
                                )}
                            </div>

                            <span className="text-xs font-mono font-bold text-slate-400 group-hover:text-blue-600">
                                [{String.fromCharCode(65 + idx)}]
                            </span>
                        </button>
                    ))}
                </div>

                {/* Practice Mode Solution */}
                {gameMode === 'PRACTICE' && (
                    <div className="text-center">
                        <button
                            onClick={() => setShowExplanation(!showExplanation)}
                            className="text-xs font-semibold text-slate-500 hover:text-blue-600 flex items-center gap-1 mx-auto"
                        >
                            <HelpCircle size={14} /> {showExplanation ? 'Hide Explanation' : 'Show Rule Explanation'}
                        </button>
                        {showExplanation && (
                            <div className="mt-2 text-xs bg-slate-50 text-slate-700 p-3 rounded-xl border border-slate-200 max-w-md mx-auto">
                                <strong>Answer: Option {String.fromCharCode(65 + currentQuestion.correct)}</strong>
                                <p className="mt-1 text-slate-600">{currentQuestion.explanation}</p>
                            </div>
                        )}
                    </div>
                )}

            </div>
        </GameShell>
    );
};

export default InductiveReasoning;
