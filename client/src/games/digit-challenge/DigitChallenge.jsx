import { useState, useEffect, useMemo, useCallback } from 'react';
import { useGame } from '../../context/GameContext';
import GameShell from '../../components/shared/GameShell';
import { motion, AnimatePresence } from 'framer-motion';
import { Delete, Check, HelpCircle } from 'lucide-react';
import { playClick } from '../../utils/sound';

const DigitChallenge = () => {
    const { level, gameMode, submitAnswer, resetLevelTimer } = useGame();
    const [equation, setEquation] = useState({ parts: [], missingIndices: [] });
    const [userInputs, setUserInputs] = useState({});
    const [feedback, setFeedback] = useState(null); // 'correct' | 'wrong'
    const [showHint, setShowHint] = useState(false);

    const evaluateExpression = useCallback((parts) => {
        const tokens = [...parts];
        const collapsed = [];

        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];

            if ((token === '×' || token === '÷') && collapsed.length > 0 && i + 1 < tokens.length) {
                const left = collapsed.pop();
                const right = tokens[i + 1];
                const value = token === '×' ? left * right : left / right;
                collapsed.push(value);
                i += 1;
            } else {
                collapsed.push(token);
            }
        }

        let result = collapsed[0];
        for (let i = 1; i < collapsed.length; i += 2) {
            const operator = collapsed[i];
            const value = collapsed[i + 1];

            if (operator === '+') result += value;
            if (operator === '-') result -= value;
        }

        return result;
    }, []);

    const checkUnique = useCallback((nums) => {
        const str = nums.join('');
        const unique = new Set(str.split(''));
        return unique.size === str.length;
    }, []);

    const generateLevel = useCallback(() => {
        setUserInputs({});
        setFeedback(null);
        setShowHint(false);

        let parts = [];
        let missingIndices = [];
        let isValid = false;
        let attempts = 0;

        while (!isValid && attempts < 150) {
            attempts++;
            parts = [];
            missingIndices = [];

            if (level <= 2) {
                const a = Math.floor(Math.random() * 9) + 1;
                const b = Math.floor(Math.random() * 9) + 1;
                const res = a + b;
                if (checkUnique([a, b, res])) {
                    parts = [a, '+', b, '=', res];
                    missingIndices = [0];
                    isValid = true;
                }
            } else if (level <= 5) {
                const a = Math.floor(Math.random() * 9) + 1;
                const b = Math.floor(Math.random() * 9) + 1;
                const c = Math.floor(Math.random() * 9) + 1;
                const res = a * b + c;

                if (res < 100 && checkUnique([a, b, c, res])) {
                    parts = [a, '×', b, '+', c, '=', res];
                    missingIndices = [0, 4];
                    isValid = true;
                }
            } else {
                const a = Math.floor(Math.random() * 9) + 1;
                const b = Math.floor(Math.random() * 9) + 1;
                const c = Math.floor(Math.random() * 9) + 1;
                const res = a * b - c;

                if (res > 0 && res < 100 && checkUnique([a, b, c, res])) {
                    parts = [a, '×', b, '-', c, '=', res];
                    missingIndices = [0, 2, 4];
                    isValid = true;
                }
            }
        }

        if (!isValid) {
            parts = [2, '+', 3, '=', 5];
            missingIndices = [0];
        }

        setEquation({ parts, missingIndices });
        resetLevelTimer();
    }, [checkUnique, level, resetLevelTimer]);

    useEffect(() => {
        generateLevel();
    }, [generateLevel]);

    const usedDigits = useMemo(() => {
        if (!equation.parts) return [];
        const used = new Set();

        equation.parts.forEach((part, idx) => {
            if (typeof part === 'number' && !equation.missingIndices.includes(idx)) {
                String(part).split('').forEach(d => used.add(Number(d)));
            }
        });

        Object.values(userInputs).forEach(val => {
            if (val !== undefined) used.add(val);
        });

        return Array.from(used);
    }, [equation, userInputs]);

    const handleDigitClick = useCallback((digit) => {
        if (usedDigits.includes(digit)) return;
        const firstEmpty = equation.missingIndices.find(idx => userInputs[idx] === undefined);
        if (firstEmpty !== undefined) {
            playClick();
            setUserInputs(prev => ({ ...prev, [firstEmpty]: digit }));
        }
    }, [equation.missingIndices, usedDigits, userInputs]);

    const handleBackspace = useCallback(() => {
        const filledIndices = Object.keys(userInputs).map(Number).sort((a, b) => b - a);
        if (filledIndices.length > 0) {
            playClick();
            const lastFilled = filledIndices[0];
            const newInputs = { ...userInputs };
            delete newInputs[lastFilled];
            setUserInputs(newInputs);
        }
    }, [userInputs]);

    const checkAnswer = useCallback(() => {
        let filledParts = [...equation.parts];
        let isComplete = true;

        equation.missingIndices.forEach(idx => {
            if (userInputs[idx] === undefined) isComplete = false;
            filledParts[idx] = userInputs[idx];
        });

        if (!isComplete) return;

        const expressionParts = filledParts.slice(0, filledParts.indexOf('='));
        const target = filledParts[filledParts.length - 1];

        try {
            const result = evaluateExpression(expressionParts);
            if (result === target) {
                setFeedback('correct');
                setTimeout(() => submitAnswer(true), 600);
            } else {
                setFeedback('wrong');
                submitAnswer(false);
                setTimeout(() => {
                    setFeedback(null);
                    setUserInputs({});
                }, 800);
            }
        } catch (e) {
            console.error(e);
        }
    }, [equation, evaluateExpression, submitAnswer, userInputs]);

    // Global Keyboard Listener
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (feedback !== null) return;
            if (e.key >= '1' && e.key <= '9') {
                e.preventDefault();
                handleDigitClick(Number(e.key));
            } else if (e.key === 'Backspace' || e.key === 'Delete') {
                e.preventDefault();
                handleBackspace();
            } else if (e.key === 'Enter') {
                e.preventDefault();
                checkAnswer();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleDigitClick, handleBackspace, checkAnswer, feedback]);

    const SHORTCUTS = [
        { key: '1 - 9', action: 'Input Digit' },
        { key: 'Backspace', action: 'Clear Slot' },
        { key: 'Enter', action: 'Submit Answer' },
    ];

    const INSTRUCTIONS = [
        {
            title: "Solve the Arithmetic Expression",
            desc: "Determine which unique digits (1-9) make the equation mathematically true following standard operation precedence (× before + or -).",
            visual: <div className="flex gap-2 justify-center text-xl font-bold font-mono bg-slate-100 p-2 rounded"><span className="text-blue-500 font-black">?</span><span>×</span><span>3</span><span>+</span><span>2</span><span>=</span><span>17</span></div>
        },
        {
            title: "Strict Digit Uniqueness",
            desc: "Each digit from 1 to 9 can be used only ONCE across the entire equation, including fixed numbers and your inputs.",
            visual: <div className="text-xs text-amber-700 font-semibold bg-amber-50 p-2 rounded border border-amber-200 text-center">Digits already appearing in the equation are disabled on the keypad.</div>
        },
        {
            title: "Keyboard Ready",
            desc: "Use your numeric keypad (1-9) for rapid input. Press Backspace to undo, and Enter to submit instantly.",
        }
    ];

    return (
        <GameShell title="Digit Challenge" instructions={INSTRUCTIONS} shortcuts={SHORTCUTS}>
            <div className="flex flex-col items-center justify-center h-full max-w-xl mx-auto w-full">

                {/* Equation Display */}
                <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-8 text-3xl sm:text-5xl font-black text-slate-800">
                    {equation.parts && equation.parts.map((part, idx) => {
                        const isMissing = equation.missingIndices.includes(idx);
                        if (isMissing) {
                            return (
                                <motion.div
                                    key={idx}
                                    animate={feedback === 'wrong' ? { x: [-8, 8, -8, 8, 0] } : {}}
                                    className={`w-14 h-16 sm:w-18 sm:h-22 flex items-center justify-center rounded-2xl border-3 font-mono transition-all shadow-sm ${
                                        userInputs[idx] !== undefined
                                            ? 'bg-blue-50 border-blue-500 text-blue-600 shadow-blue-100 scale-105'
                                            : 'bg-white border-slate-300 border-dashed text-slate-400'
                                    }`}
                                >
                                    {userInputs[idx] !== undefined ? userInputs[idx] : '?'}
                                </motion.div>
                            );
                        }
                        return <div key={idx} className="text-slate-700">{part}</div>;
                    })}
                </div>

                {/* Keypad */}
                <div className="grid grid-cols-3 gap-3 mb-6 w-full max-w-xs sm:max-w-sm">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => {
                        const isUsed = usedDigits.includes(digit);
                        return (
                            <button
                                key={digit}
                                onClick={() => handleDigitClick(digit)}
                                disabled={isUsed}
                                className={`h-14 sm:h-16 text-2xl font-bold border-2 rounded-2xl transition-all flex items-center justify-center shadow-xs select-none ${
                                    isUsed
                                        ? 'bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed'
                                        : 'bg-white border-slate-200 text-slate-700 hover:border-blue-400 hover:bg-blue-50/50 hover:scale-102 active:scale-95'
                                }`}
                            >
                                {digit}
                            </button>
                        );
                    })}
                </div>

                {/* Action Controls */}
                <div className="flex gap-3 w-full max-w-xs sm:max-w-sm">
                    <button
                        onClick={handleBackspace}
                        className="flex-1 py-3.5 flex items-center justify-center gap-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold text-sm transition-all active:scale-95"
                    >
                        <Delete size={18} /> Clear
                    </button>
                    <button
                        onClick={checkAnswer}
                        className="flex-1 py-3.5 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm shadow-md shadow-emerald-600/20 transition-all active:scale-95"
                    >
                        <Check size={18} /> Submit
                    </button>
                </div>

                {/* Practice Mode Hint */}
                {gameMode === 'PRACTICE' && (
                    <div className="mt-4 text-center">
                        <button
                            onClick={() => setShowHint(!showHint)}
                            className="text-xs font-semibold text-slate-500 hover:text-blue-600 flex items-center gap-1 mx-auto"
                        >
                            <HelpCircle size={14} /> {showHint ? 'Hide Hint' : 'Need a hint?'}
                        </button>
                        {showHint && (
                            <div className="mt-2 text-xs bg-blue-50 text-blue-700 p-2.5 rounded-xl border border-blue-200 animate-fadeIn">
                                Available remaining digits: <strong>{[1,2,3,4,5,6,7,8,9].filter(d => !usedDigits.includes(d)).join(', ')}</strong>
                            </div>
                        )}
                    </div>
                )}

                {/* Feedback Overlay */}
                <AnimatePresence>
                    {feedback === 'correct' && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 flex items-center justify-center bg-emerald-950/20 backdrop-blur-xs z-40 pointer-events-none"
                        >
                            <div className="bg-emerald-600 text-white p-6 rounded-full shadow-2xl animate-bounce">
                                <Check size={48} strokeWidth={3} />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>
        </GameShell>
    );
};

export default DigitChallenge;
