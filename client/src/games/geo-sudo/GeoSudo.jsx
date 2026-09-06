import { useState, useEffect, useCallback } from 'react';
import { useGame } from '../../context/GameContext';
import GameShell from '../../components/shared/GameShell';
import { motion } from 'framer-motion';
import { Square, Triangle, Circle, Plus, AlertCircle } from 'lucide-react';
import { playClick } from '../../utils/sound';

const SHAPES = [
    { id: 1, icon: Square, color: 'text-rose-500', name: 'Square' },
    { id: 2, icon: Triangle, color: 'text-amber-500', name: 'Triangle' },
    { id: 3, icon: Circle, color: 'text-emerald-500', name: 'Circle' },
    { id: 4, icon: Plus, color: 'text-blue-500', name: 'Plus' },
];

const GeoSudo = () => {
    const { level, submitAnswer, resetLevelTimer } = useGame();
    const [grid, setGrid] = useState([]);
    const [initialGrid, setInitialGrid] = useState([]);
    const [size] = useState(4);
    const [selectedCell, setSelectedCell] = useState({ r: 0, c: 0 });
    const [hasConflict, setHasConflict] = useState(false);

    const isValid = useCallback((board, r, c, num, s) => {
        for (let i = 0; i < s; i++) if (board[r][i] === num) return false;
        for (let i = 0; i < s; i++) if (board[i][c] === num) return false;
        return true;
    }, []);

    const solve = useCallback((board, s) => {
        for (let r = 0; r < s; r++) {
            for (let c = 0; c < s; c++) {
                if (board[r][c] === 0) {
                    const nums = [1, 2, 3, 4].sort(() => Math.random() - 0.5);
                    for (let num of nums) {
                        if (isValid(board, r, c, num, s)) {
                            board[r][c] = num;
                            if (solve(board, s)) return true;
                            board[r][c] = 0;
                        }
                    }
                    return false;
                }
            }
        }
        return true;
    }, [isValid]);

    const createSolvedGrid = useCallback((s) => {
        const board = Array(s).fill(0).map(() => Array(s).fill(0));
        solve(board, s);
        return board;
    }, [solve]);

    const generateLevel = useCallback((s) => {
        const fullGrid = createSolvedGrid(s);
        // Mask cells based on difficulty (5 to 9 cells masked)
        const removeCount = Math.min(s * s - 3, Math.max(5, level + 4));
        const newGrid = fullGrid.map(row => [...row]);
        const mask = fullGrid.map(row => row.map(() => true));

        let removed = 0;
        let attempts = 0;
        while (removed < removeCount && attempts < 100) {
            attempts++;
            const r = Math.floor(Math.random() * s);
            const c = Math.floor(Math.random() * s);
            if (newGrid[r][c] !== 0) {
                newGrid[r][c] = 0;
                mask[r][c] = false;
                removed++;
            }
        }

        setGrid(newGrid);
        setInitialGrid(mask);

        // Find first empty cell to select
        let firstR = 0, firstC = 0;
        for (let r = 0; r < s; r++) {
            for (let c = 0; c < s; c++) {
                if (!mask[r][c]) {
                    firstR = r;
                    firstC = c;
                    break;
                }
            }
        }
        setSelectedCell({ r: firstR, c: firstC });
        setHasConflict(false);
        resetLevelTimer();
    }, [createSolvedGrid, level, resetLevelTimer]);

    useEffect(() => {
        generateLevel(size);
    }, [level, size, generateLevel]);

    // Check for row/col duplicates in the active grid
    const checkConflicts = useCallback((currentGrid) => {
        let conflict = false;
        for (let r = 0; r < size; r++) {
            const seenRow = new Set();
            const seenCol = new Set();
            for (let c = 0; c < size; c++) {
                const rowVal = currentGrid[r][c];
                const colVal = currentGrid[c][r];
                if (rowVal !== 0) {
                    if (seenRow.has(rowVal)) conflict = true;
                    seenRow.add(rowVal);
                }
                if (colVal !== 0) {
                    if (seenCol.has(colVal)) conflict = true;
                    seenCol.add(colVal);
                }
            }
        }
        setHasConflict(conflict);
        return conflict;
    }, [size]);

    const handleShapeSelect = useCallback((shapeId) => {
        if (!selectedCell) return;
        const { r, c } = selectedCell;
        if (initialGrid[r] && initialGrid[r][c]) return; // Fixed cell

        playClick();
        const newGrid = grid.map(row => [...row]);
        newGrid[r][c] = shapeId;
        setGrid(newGrid);

        const conflict = checkConflicts(newGrid);

        // Check completion if no empty cells
        let isFull = true;
        for (let row = 0; row < size; row++) {
            for (let col = 0; col < size; col++) {
                if (newGrid[row][col] === 0) isFull = false;
            }
        }

        if (isFull && !conflict) {
            setTimeout(() => submitAnswer(true), 400);
        }
    }, [selectedCell, initialGrid, grid, checkConflicts, size, submitAnswer]);

    const handleCellClick = (r, c) => {
        playClick();
        setSelectedCell({ r, c });
    };

    // Keyboard controls: 1-4 for shapes, Backspace/0 for clear, Arrow keys for cell navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key >= '1' && e.key <= '4') {
                e.preventDefault();
                handleShapeSelect(Number(e.key));
            } else if (e.key === 'Backspace' || e.key === '0' || e.key === 'Delete') {
                e.preventDefault();
                handleShapeSelect(0);
            } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                e.preventDefault();
                setSelectedCell(prev => {
                    if (!prev) return { r: 0, c: 0 };
                    let nr = prev.r;
                    let nc = prev.c;
                    if (e.key === 'ArrowUp') nr = Math.max(0, nr - 1);
                    if (e.key === 'ArrowDown') nr = Math.min(size - 1, nr + 1);
                    if (e.key === 'ArrowLeft') nc = Math.max(0, nc - 1);
                    if (e.key === 'ArrowRight') nc = Math.min(size - 1, nc + 1);
                    return { r: nr, c: nc };
                });
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleShapeSelect, size]);

    const SHORTCUTS = [
        { key: '1, 2, 3, 4', action: 'Place Shape' },
        { key: 'Backspace', action: 'Clear Cell' },
        { key: 'Arrow Keys', action: 'Navigate Grid Cells' },
    ];

    const INSTRUCTIONS = [
        {
            title: "Geometric Sudoku Rules",
            desc: "Every row and every column must contain each of the 4 shapes exactly once. No shape may repeat in the same row or column.",
            visual: (
                <div className="grid grid-cols-2 gap-1.5 w-20 h-20 bg-slate-200 p-1.5 rounded-xl">
                    <div className="bg-white rounded-lg flex items-center justify-center"><Square size={14} className="text-rose-500" /></div>
                    <div className="bg-white rounded-lg flex items-center justify-center"><Triangle size={14} className="text-amber-500" /></div>
                    <div className="bg-white rounded-lg flex items-center justify-center"><Circle size={14} className="text-emerald-500" /></div>
                    <div className="bg-white rounded-lg flex items-center justify-center"><Plus size={14} className="text-blue-500" /></div>
                </div>
            )
        },
        {
            title: "Conflict Detection",
            desc: "If you place duplicate shapes in the same row or column, the system flags the conflict to help you isolate errors quickly.",
        },
        {
            title: "Keyboard Control",
            desc: "Use the Arrow keys to move between cells, and press 1 to 4 on your keyboard to instantly place shapes.",
        }
    ];

    return (
        <GameShell title="Geo-Sudo" instructions={INSTRUCTIONS} shortcuts={SHORTCUTS}>
            <div className="flex flex-col items-center justify-center h-full max-w-lg mx-auto w-full gap-6 sm:gap-8">

                {/* Conflict Notice */}
                {hasConflict && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 rounded-full text-xs font-bold border border-rose-200 animate-shake">
                        <AlertCircle size={16} /> Duplicate shape detected in a row or column!
                    </div>
                )}

                {/* 4x4 Grid */}
                <div className="grid grid-cols-4 gap-2.5 p-3.5 sm:p-4 bg-slate-200/80 rounded-3xl shadow-inner border border-slate-300">
                    {grid.map((row, r) => (
                        row.map((val, c) => {
                            const ShapeIcon = val ? SHAPES[val - 1]?.icon : null;
                            const isFixed = initialGrid[r] && initialGrid[r][c];
                            const isSelected = selectedCell?.r === r && selectedCell?.c === c;

                            return (
                                <motion.button
                                    key={`${r}-${c}`}
                                    onClick={() => handleCellClick(r, c)}
                                    whileHover={!isFixed ? { scale: 1.04 } : {}}
                                    className={`w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center rounded-2xl cursor-pointer transition-all ${
                                        isFixed
                                            ? 'bg-slate-300/80 cursor-not-allowed border border-slate-400/30'
                                            : 'bg-white shadow-xs hover:border-blue-300 border border-transparent'
                                    } ${
                                        isSelected
                                            ? 'ring-4 ring-blue-500 ring-offset-2 z-10 shadow-md scale-102'
                                            : ''
                                    }`}
                                >
                                    {ShapeIcon && (
                                        <ShapeIcon
                                            size={32}
                                            className={SHAPES[val - 1]?.color}
                                            strokeWidth={isFixed ? 3 : 2.5}
                                        />
                                    )}
                                </motion.button>
                            );
                        })
                    ))}
                </div>

                {/* Shape Palette */}
                <div className="flex items-center gap-2 sm:gap-3 p-3 bg-white rounded-2xl shadow-sm border border-slate-200">
                    {SHAPES.map((shape) => (
                        <button
                            key={shape.id}
                            onClick={() => handleShapeSelect(shape.id)}
                            className="p-3 sm:p-3.5 hover:bg-slate-100 rounded-xl transition-all active:scale-95 flex flex-col items-center gap-1 group"
                            title={`Place ${shape.name} [Key ${shape.id}]`}
                        >
                            <shape.icon size={26} className={shape.color} strokeWidth={2.5} />
                            <span className="text-[10px] font-bold text-slate-400 group-hover:text-blue-600">
                                [{shape.id}]
                            </span>
                        </button>
                    ))}

                    <div className="h-8 w-px bg-slate-200 mx-1"></div>

                    <button
                        onClick={() => handleShapeSelect(0)}
                        className="px-3 py-2 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-xl transition-colors text-xs font-bold"
                        title="Clear Cell [Backspace]"
                    >
                        Clear
                    </button>
                </div>

            </div>
        </GameShell>
    );
};

export default GeoSudo;
