import { useState, useEffect, useCallback } from 'react';
import { useGame } from '../../context/GameContext';
import GameShell from '../../components/shared/GameShell';
import { motion } from 'framer-motion';
import { Square, Triangle, Circle, Plus, ArrowDown, HelpCircle } from 'lucide-react';
import { playClick } from '../../utils/sound';

const SHAPES = [
    { id: 'square', icon: Square, color: 'text-rose-500', name: 'Square' },
    { id: 'triangle', icon: Triangle, color: 'text-amber-500', name: 'Triangle' },
    { id: 'circle', icon: Circle, color: 'text-emerald-500', name: 'Circle' },
    { id: 'plus', icon: Plus, color: 'text-blue-500', name: 'Plus' },
];

const SwitchChallenge = () => {
    const { level, gameMode, submitAnswer, resetLevelTimer } = useGame();
    const [inputSeq, setInputSeq] = useState([]);
    const [outputSeq, setOutputSeq] = useState([]);
    const [options, setOptions] = useState([]);
    const [correctOption, setCorrectOption] = useState('');
    const [feedback, setFeedback] = useState(null);
    const [showExplanation, setShowExplanation] = useState(false);

    const generateLevel = useCallback(() => {
        setFeedback(null);
        setShowExplanation(false);

        // 1. Generate random input sequence (4 distinct shapes)
        const shuffledShapes = [...SHAPES].sort(() => Math.random() - 0.5);
        setInputSeq(shuffledShapes);

        // 2. Generate a random permutation code of 1,2,3,4
        const indices = [1, 2, 3, 4];
        const perm = indices.sort(() => Math.random() - 0.5);
        const code = perm.join('');
        setCorrectOption(code);

        // 3. Generate Output Sequence based on code
        // Output[i] = inputSeq[perm[i] - 1]
        const newOutput = perm.map(p => shuffledShapes[p - 1]);
        setOutputSeq(newOutput);

        // 4. Generate Distractor Options
        const distractors = new Set();
        distractors.add(code);
        while (distractors.size < 4) {
            const d = [1, 2, 3, 4].sort(() => Math.random() - 0.5).join('');
            distractors.add(d);
        }
        setOptions(Array.from(distractors).sort());
        resetLevelTimer();
    }, [resetLevelTimer]);

    useEffect(() => {
        generateLevel();
    }, [level, generateLevel]);

    const handleOptionClick = useCallback((opt) => {
        playClick();
        if (opt === correctOption) {
            setFeedback('correct');
            setTimeout(() => submitAnswer(true), 500);
        } else {
            setFeedback('wrong');
            submitAnswer(false);
            setTimeout(() => setFeedback(null), 800);
        }
    }, [correctOption, submitAnswer]);

    // Keyboard Hotkeys: 1, 2, 3, 4
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (feedback !== null) return;
            const keyMap = { '1': 0, '2': 1, '3': 2, '4': 3, 'a': 0, 'b': 1, 'c': 2, 'd': 3 };
            const lowerKey = e.key.toLowerCase();
            if (lowerKey in keyMap && options[keyMap[lowerKey]]) {
                e.preventDefault();
                handleOptionClick(options[keyMap[lowerKey]]);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [options, handleOptionClick, feedback]);

    const SHORTCUTS = [
        { key: '1, 2, 3, 4', action: 'Select Options 1 to 4' },
        { key: 'A, B, C, D', action: 'Alternative Option Keys' },
    ];

    const INSTRUCTIONS = [
        {
            title: "Inspect Input & Output Sequences",
            desc: "The top row shows the input positions 1, 2, 3, 4. The bottom row shows the transformed output positions.",
            visual: (
                <div className="flex flex-col items-center gap-1.5 p-2 bg-slate-50 rounded-xl">
                    <div className="flex gap-2"><Square size={18} className="text-rose-500" /><Triangle size={18} className="text-amber-500" /></div>
                    <ArrowDown size={14} className="text-slate-400" />
                    <div className="flex gap-2"><Triangle size={18} className="text-amber-500" /><Square size={18} className="text-rose-500" /></div>
                </div>
            )
        },
        {
            title: "Decode the 4-Digit Permutation",
            desc: "Each digit in the code indicates the ORIGINAL index of the item that now occupies that position in the output.",
            visual: <div className="text-xs text-slate-600 bg-slate-100 p-2 rounded text-center">If Output 1st item came from Input slot #2, the code starts with <strong>2...</strong></div>
        },
        {
            title: "Fast Keyboard Selection",
            desc: "Press 1, 2, 3, 4 or A, B, C, D on your keyboard to lock in your answer with maximum speed.",
        }
    ];

    return (
        <GameShell title="Switch Challenge" instructions={INSTRUCTIONS} shortcuts={SHORTCUTS}>
            <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto w-full gap-8 sm:gap-10">

                {/* Input Sequence */}
                <div className="flex flex-col items-center">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2.5">
                        Input Sequence (Positions 1 to 4)
                    </span>
                    <div className="flex gap-3 sm:gap-5 p-4 sm:p-5 bg-white rounded-3xl shadow-sm border border-slate-200">
                        {inputSeq.map((shape, i) => (
                            <div key={i} className="flex flex-col items-center gap-1.5">
                                <motion.div
                                    initial={{ scale: 0.8 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: i * 0.05 }}
                                    className={`w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center bg-slate-50 rounded-2xl border border-slate-100 ${shape.color} shadow-xs`}
                                >
                                    <shape.icon size={30} strokeWidth={2.5} />
                                </motion.div>
                                <span className="text-xs font-mono font-bold text-slate-400">{i + 1}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Switch Funnel Visual */}
                <div className="flex items-center gap-3 px-5 py-2 bg-slate-200/70 text-slate-600 rounded-full text-xs font-mono font-bold tracking-widest border border-slate-300">
                    <ArrowDown size={14} className="animate-bounce" />
                    TRANSFORMATION SWITCH
                    <ArrowDown size={14} className="animate-bounce" />
                </div>

                {/* Output Sequence */}
                <div className="flex flex-col items-center">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2.5">
                        Output Sequence (Rearranged)
                    </span>
                    <div className="flex gap-3 sm:gap-5 p-4 sm:p-5 bg-white rounded-3xl shadow-sm border border-slate-200">
                        {outputSeq.map((shape, i) => (
                            <div key={i} className="flex flex-col items-center gap-1.5">
                                <motion.div
                                    initial={{ scale: 0.8 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.2 + i * 0.05 }}
                                    className={`w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center bg-slate-50 rounded-2xl border border-slate-100 ${shape.color} shadow-xs`}
                                >
                                    <shape.icon size={30} strokeWidth={2.5} />
                                </motion.div>
                                <span className="text-xs font-mono font-bold text-slate-300">#{i + 1}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Options */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-xl">
                    {options.map((opt, idx) => (
                        <button
                            key={opt}
                            onClick={() => handleOptionClick(opt)}
                            className={`py-4 px-3 flex flex-col items-center justify-center bg-white border-2 rounded-2xl transition-all shadow-xs active:scale-95 group ${
                                feedback === 'wrong' && opt === correctOption
                                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                    : 'border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 text-slate-700'
                            }`}
                        >
                            <span className="text-xs font-bold text-slate-400 group-hover:text-blue-500 mb-1">
                                [{['A', 'B', 'C', 'D'][idx]}]
                            </span>
                            <span className="text-2xl font-mono font-black tracking-widest text-slate-800 group-hover:text-blue-600">
                                {opt}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Practice Mode Step-by-Step Explanation */}
                {gameMode === 'PRACTICE' && (
                    <div className="text-center">
                        <button
                            onClick={() => setShowExplanation(!showExplanation)}
                            className="text-xs font-semibold text-slate-500 hover:text-blue-600 flex items-center gap-1 mx-auto"
                        >
                            <HelpCircle size={14} /> {showExplanation ? 'Hide Explanation' : 'Show Step-by-Step Solution'}
                        </button>
                        {showExplanation && (
                            <div className="mt-3 text-xs bg-slate-50 text-slate-700 p-4 rounded-2xl border border-slate-200 max-w-md mx-auto text-left space-y-1.5">
                                <div className="font-bold text-slate-800">Correct Permutation: {correctOption}</div>
                                {correctOption.split('').map((pos, outIdx) => (
                                    <div key={outIdx} className="text-slate-600">
                                        • Output slot #{outIdx + 1} ({outputSeq[outIdx]?.name}) originated from Input slot #{pos}.
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

            </div>
        </GameShell>
    );
};

export default SwitchChallenge;
