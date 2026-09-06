import { useState, useEffect, useCallback } from 'react';
import { useGame } from '../../context/GameContext';
import GameShell from '../../components/shared/GameShell';
import { motion } from 'framer-motion';
import { playClick } from '../../utils/sound';

const GridChallenge = () => {
    const { level, submitAnswer, resetLevelTimer } = useGame();

    // Phases: 'MEMORIZE', 'DISTRACT', 'RECALL'
    const [phase, setPhase] = useState('MEMORIZE');
    const [sequence, setSequence] = useState([]);
    const [currentStep, setCurrentStep] = useState(0);
    const [userSequence, setUserSequence] = useState([]);
    const [symmetryTask, setSymmetryTask] = useState(null); // { matrix, isSymmetric }

    const gridSize = 4 + Math.min(2, Math.floor(level / 3)); // 4x4, 5x5, max 6x6
    const sequenceLength = 2 + Math.min(4, Math.floor(level / 2)); // 2 to 6 dots

    // Generate authentic 2D matrix for symmetry distraction
    const generateSymmetryTask = useCallback(() => {
        const matrixSize = 6;
        const isSymmetric = Math.random() > 0.5;
        const matrix = Array(matrixSize).fill(0).map(() => Array(matrixSize).fill(false));

        // Generate left half
        for (let r = 0; r < matrixSize; r++) {
            for (let c = 0; c < matrixSize / 2; c++) {
                const filled = Math.random() > 0.55;
                matrix[r][c] = filled;
                // Mirror to right half
                matrix[r][matrixSize - 1 - c] = filled;
            }
        }

        // If asymmetric, intentionally flip 1 or 2 cells on the right
        if (!isSymmetric) {
            const flipR = Math.floor(Math.random() * matrixSize);
            const flipC = matrixSize - 1 - Math.floor(Math.random() * (matrixSize / 2));
            matrix[flipR][flipC] = !matrix[flipR][flipC];
        }

        setSymmetryTask({ matrix, isSymmetric });
    }, []);

    const startLevel = useCallback(() => {
        const newSeq = [];
        for (let i = 0; i < sequenceLength; i++) {
            newSeq.push({
                r: Math.floor(Math.random() * gridSize),
                c: Math.floor(Math.random() * gridSize),
            });
        }
        setSequence(newSeq);
        setCurrentStep(0);
        setUserSequence([]);
        setPhase('MEMORIZE');
        resetLevelTimer();
    }, [gridSize, sequenceLength, resetLevelTimer]);

    useEffect(() => {
        startLevel();
    }, [startLevel]);

    // Timer to cycle between MEMORIZE and DISTRACT
    useEffect(() => {
        let timer;
        if (phase === 'MEMORIZE') {
            timer = setTimeout(() => {
                generateSymmetryTask();
                setPhase('DISTRACT');
            }, 1800);
        }
        return () => clearTimeout(timer);
    }, [phase, generateSymmetryTask]);

    const handleSymmetryAnswer = useCallback((answer) => {
        playClick();
        // Validate against symmetry task
        const isCorrect = symmetryTask ? answer === symmetryTask.isSymmetric : true;
        if (!isCorrect) {
            // Handled as distraction response
        }
        if (currentStep < sequence.length - 1) {
            setCurrentStep(prev => prev + 1);
            setPhase('MEMORIZE');
        } else {
            setPhase('RECALL');
        }
    }, [currentStep, sequence.length, symmetryTask]);

    const handleGridClick = useCallback((r, c) => {
        if (phase !== 'RECALL') return;

        playClick();
        const newSeq = [...userSequence, { r, c }];
        setUserSequence(newSeq);

        if (newSeq.length === sequence.length) {
            // Check accuracy
            let correct = true;
            for (let i = 0; i < sequence.length; i++) {
                if (newSeq[i].r !== sequence[i].r || newSeq[i].c !== sequence[i].c) {
                    correct = false;
                    break;
                }
            }

            if (correct) {
                setTimeout(() => submitAnswer(true), 400);
            } else {
                submitAnswer(false);
                setTimeout(() => startLevel(), 800);
            }
        }
    }, [phase, userSequence, sequence, submitAnswer, startLevel]);

    // Keyboard support: Y/N for symmetry
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (phase === 'DISTRACT') {
                if (e.key.toLowerCase() === 'y' || e.key === 'ArrowLeft') {
                    e.preventDefault();
                    handleSymmetryAnswer(true);
                } else if (e.key.toLowerCase() === 'n' || e.key === 'ArrowRight') {
                    e.preventDefault();
                    handleSymmetryAnswer(false);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [phase, handleSymmetryAnswer]);

    const SHORTCUTS = [
        { key: 'Y / Arrow Left', action: 'Answer YES (Symmetric)' },
        { key: 'N / Arrow Right', action: 'Answer NO (Asymmetric)' },
        { key: 'Click Grid', action: 'Recall Dot Sequence' },
    ];

    const INSTRUCTIONS = [
        {
            title: "Phase 1: Working Memory Encoding",
            desc: "A blue dot will flash on the grid. Memorize its position carefully.",
        },
        {
            title: "Phase 2: Cognitive Interruption (Distraction)",
            desc: "Before the next dot appears, determine whether the displayed 6x6 pixel figure is vertically symmetrical.",
            visual: <div className="text-xs font-semibold text-center text-slate-500 bg-slate-100 p-2 rounded">Press [Y] for Symmetric, [N] for Asymmetric</div>
        },
        {
            title: "Phase 3: Serial Order Recall",
            desc: "Once all dots have been shown, click the grid cells in the EXACT chronological sequence they appeared.",
        }
    ];

    return (
        <GameShell title="Grid Challenge" instructions={INSTRUCTIONS} shortcuts={SHORTCUTS}>
            <div className="flex flex-col items-center justify-center h-full max-w-lg mx-auto w-full gap-6 sm:gap-8">

                {/* Phase Status Banner */}
                <div className="text-center">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">
                        Step {currentStep + 1} of {sequence.length}
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-800">
                        {phase === 'MEMORIZE' && '👀 Memorize Dot Position!'}
                        {phase === 'DISTRACT' && '⚖️ Is This Pattern Symmetrical?'}
                        {phase === 'RECALL' && '🎯 Click Dots in Original Order!'}
                    </h2>
                </div>

                {/* Main Content Card */}
                <div className="relative w-72 h-72 sm:w-80 sm:h-80 bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden flex items-center justify-center">

                    {/* Grid Mode (MEMORIZE & RECALL) */}
                    {(phase === 'MEMORIZE' || phase === 'RECALL') && (
                        <div
                            className="absolute inset-0 grid gap-2 p-4"
                            style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}
                        >
                            {Array(gridSize * gridSize).fill(0).map((_, i) => {
                                const r = Math.floor(i / gridSize);
                                const c = i % gridSize;

                                const showDot = phase === 'MEMORIZE' && sequence[currentStep]?.r === r && sequence[currentStep]?.c === c;
                                const selectionIndex = userSequence.findIndex(p => p.r === r && p.c === c);
                                const isSelected = selectionIndex !== -1;

                                return (
                                    <button
                                        key={i}
                                        onClick={() => handleGridClick(r, c)}
                                        disabled={phase !== 'RECALL'}
                                        className={`rounded-2xl transition-all flex items-center justify-center font-bold font-mono text-sm ${
                                            showDot
                                                ? 'bg-blue-600 scale-95 shadow-lg shadow-blue-500/40 text-white animate-pulse'
                                                : isSelected
                                                    ? 'bg-blue-500 text-white scale-90 shadow-md'
                                                    : phase === 'RECALL'
                                                        ? 'bg-slate-100 hover:bg-blue-50 hover:border-blue-300 border border-slate-200'
                                                        : 'bg-slate-100/70 border border-slate-200/50'
                                        }`}
                                    >
                                        {isSelected && <span>{selectionIndex + 1}</span>}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Symmetry Task (DISTRACT) */}
                    {phase === 'DISTRACT' && symmetryTask && (
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-slate-50"
                        >
                            {/* 6x6 pixel grid */}
                            <div className="grid grid-cols-6 gap-1 p-2 bg-slate-200 rounded-2xl mb-6 shadow-inner">
                                {symmetryTask.matrix.map((row, r) =>
                                    row.map((filled, c) => (
                                        <div
                                            key={`${r}-${c}`}
                                            className={`w-5 h-5 sm:w-6 sm:h-6 rounded-md transition-colors ${
                                                filled ? 'bg-indigo-600 shadow-xs' : 'bg-white'
                                            }`}
                                        />
                                    ))
                                )}
                            </div>

                            {/* Yes / No Buttons */}
                            <div className="flex gap-3 w-full max-w-xs">
                                <button
                                    onClick={() => handleSymmetryAnswer(true)}
                                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
                                >
                                    YES [Y]
                                </button>
                                <button
                                    onClick={() => handleSymmetryAnswer(false)}
                                    className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-sm shadow-md shadow-rose-600/20 active:scale-95 transition-all"
                                >
                                    NO [N]
                                </button>
                            </div>
                        </motion.div>
                    )}

                </div>

            </div>
        </GameShell>
    );
};

export default GridChallenge;
