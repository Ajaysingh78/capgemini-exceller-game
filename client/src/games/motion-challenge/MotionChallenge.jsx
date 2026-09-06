import { useState, useEffect, useCallback } from 'react';
import { useGame } from '../../context/GameContext';
import GameShell from '../../components/shared/GameShell';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react';
import { playClick } from '../../utils/sound';

const LEVELS = [
    // Level 1: The Box
    [
        [1, 1, 1, 1, 1, 1],
        [1, 3, 0, 2, 0, 1],
        [1, 0, 1, 2, 0, 1],
        [1, 0, 2, 0, 0, 1],
        [1, 0, 1, 0, 4, 1],
        [1, 1, 1, 1, 1, 1],
    ],
    // Level 2: The Corridor
    [
        [1, 1, 1, 1, 1, 1],
        [1, 3, 0, 0, 1, 1],
        [1, 1, 2, 0, 0, 1],
        [1, 1, 0, 2, 0, 1],
        [1, 1, 0, 0, 4, 1],
        [1, 1, 1, 1, 1, 1],
    ],
    // Level 3: Two Rooms
    [
        [1, 1, 1, 1, 1, 1],
        [1, 3, 0, 1, 0, 1],
        [1, 2, 2, 1, 0, 1],
        [1, 0, 0, 0, 0, 1],
        [1, 0, 1, 4, 0, 1],
        [1, 1, 1, 1, 1, 1],
    ],
    // Level 4: The Squeeze
    [
        [1, 1, 1, 1, 1, 1],
        [1, 3, 2, 0, 2, 1],
        [1, 0, 1, 0, 1, 1],
        [1, 0, 2, 0, 0, 1],
        [1, 0, 1, 2, 4, 1],
        [1, 1, 1, 1, 1, 1],
    ],
    // Level 5: Open Field
    [
        [1, 1, 1, 1, 1, 1],
        [1, 3, 0, 2, 0, 1],
        [1, 0, 0, 2, 0, 1],
        [1, 2, 0, 0, 2, 1],
        [1, 0, 2, 4, 0, 1],
        [1, 1, 1, 1, 1, 1],
    ],
    // Level 6: Zig-Zag Alley
    [
        [1, 1, 1, 1, 1, 1],
        [1, 3, 2, 0, 0, 1],
        [1, 1, 1, 2, 0, 1],
        [1, 0, 0, 0, 2, 1],
        [1, 0, 1, 1, 4, 1],
        [1, 1, 1, 1, 1, 1],
    ],
    // Level 7: The Crossroad
    [
        [1, 1, 1, 1, 1, 1],
        [1, 0, 0, 3, 0, 1],
        [1, 0, 1, 2, 0, 1],
        [1, 2, 2, 0, 2, 1],
        [1, 0, 4, 0, 0, 1],
        [1, 1, 1, 1, 1, 1],
    ],
    // Level 8: Double Obstacle Chamber
    [
        [1, 1, 1, 1, 1, 1],
        [1, 3, 0, 1, 0, 1],
        [1, 2, 0, 2, 0, 1],
        [1, 0, 2, 1, 2, 1],
        [1, 0, 0, 0, 4, 1],
        [1, 1, 1, 1, 1, 1],
    ]
];

const MotionChallenge = () => {
    const { level, submitAnswer, resetLevelTimer } = useGame();
    const [grid, setGrid] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null); // { r, c, val }
    const [moves, setMoves] = useState(0);

    const loadLevel = useCallback(() => {
        const levelIndex = (level - 1) % LEVELS.length;
        const template = LEVELS[levelIndex];
        const newGrid = template.map(row => [...row]);

        setGrid(newGrid);
        setMoves(0);

        // Auto-select the Red Ball (val = 3) for convenience
        for (let r = 0; r < newGrid.length; r++) {
            for (let c = 0; c < newGrid[r].length; c++) {
                if (newGrid[r][c] === 3) {
                    setSelectedItem({ r, c, val: 3 });
                    break;
                }
            }
        }
        resetLevelTimer();
    }, [level, resetLevelTimer]);

    useEffect(() => {
        loadLevel();
    }, [loadLevel]);

    const handleCellClick = (r, c) => {
        const val = grid[r][c];
        if (val === 2 || val === 3) {
            playClick();
            setSelectedItem({ r, c, val });
        }
    };

    const moveItem = useCallback((dr, dc) => {
        if (!selectedItem) return;

        const { r, c, val } = selectedItem;
        const nr = r + dr;
        const nc = c + dc;

        // Check grid boundary
        if (nr < 0 || nr >= grid.length || nc < 0 || nc >= grid[0].length) return;

        const targetCell = grid[nr][nc];

        // Ball entering the hole (Goal)
        if (targetCell === 4 && val === 3) {
            playClick();
            const newGrid = grid.map(row => [...row]);
            newGrid[r][c] = 0;
            setGrid(newGrid);
            setMoves(m => m + 1);
            setTimeout(() => submitAnswer(true), 400);
            return;
        }

        // Move to empty space
        if (targetCell === 0) {
            playClick();
            const newGrid = grid.map(row => [...row]);
            newGrid[r][c] = 0;
            newGrid[nr][nc] = val;
            setGrid(newGrid);
            setSelectedItem({ r: nr, c: nc, val });
            setMoves(m => m + 1);
        }
    }, [grid, selectedItem, submitAnswer]);

    // Keyboard support: Arrows and WASD
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
                e.preventDefault();
                moveItem(-1, 0);
            } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
                e.preventDefault();
                moveItem(1, 0);
            } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
                e.preventDefault();
                moveItem(0, -1);
            } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
                e.preventDefault();
                moveItem(0, 1);
            } else if (e.key === 'r' || e.key === 'R') {
                e.preventDefault();
                loadLevel();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [moveItem, loadLevel]);

    const SHORTCUTS = [
        { key: 'Arrow Keys / WASD', action: 'Move Selected Piece' },
        { key: 'R', action: 'Reset Level Map' },
    ];

    const INSTRUCTIONS = [
        {
            title: "Objective: Navigate Ball to Hole",
            desc: "Guide the red ball into the black target hole with as few moves as possible.",
        },
        {
            title: "Slide Blocking Obstacles",
            desc: "Click on blue blocks to select and move them into open space, clearing a direct route for the red ball.",
        },
        {
            title: "Controls & Reset",
            desc: "Use Arrow keys or WASD to move. Press [R] anytime to reset the current level if you get blocked.",
        }
    ];

    return (
        <GameShell title="Motion Challenge" instructions={INSTRUCTIONS} shortcuts={SHORTCUTS}>
            <div className="flex flex-col items-center justify-center h-full max-w-lg mx-auto w-full gap-6 sm:gap-8">

                {/* Move Counter & Reset */}
                <div className="flex items-center justify-between w-full max-w-xs px-2">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Moves: <span className="text-blue-600 font-mono text-sm">{moves}</span>
                    </div>
                    <button
                        onClick={() => {
                            playClick();
                            loadLevel();
                        }}
                        className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                        <RotateCcw size={12} /> Reset Map [R]
                    </button>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-6 gap-1.5 p-3 bg-slate-900 rounded-3xl shadow-xl border border-slate-800">
                    {grid.map((row, r) => (
                        row.map((val, c) => {
                            const isSelected = selectedItem?.r === r && selectedItem?.c === c;

                            return (
                                <button
                                    key={`${r}-${c}`}
                                    onClick={() => handleCellClick(r, c)}
                                    className={`w-11 h-11 sm:w-13 sm:h-13 flex items-center justify-center rounded-xl transition-all ${
                                        val === 1
                                            ? 'bg-slate-800 border border-slate-700/50 cursor-default' // Wall
                                            : val === 0
                                                ? 'bg-slate-950/60 cursor-default' // Empty
                                                : val === 4
                                                    ? 'bg-black border-2 border-emerald-500/50 shadow-inner' // Hole
                                                    : 'cursor-pointer' // Movable item
                                    } ${
                                        isSelected ? 'ring-3 ring-white ring-offset-2 ring-offset-slate-900 z-10' : ''
                                    }`}
                                >
                                    {val === 2 && (
                                        <div className="w-8 h-8 sm:w-9 sm:h-9 bg-blue-500 rounded-lg shadow-md border border-blue-400/30" />
                                    )}
                                    {val === 3 && (
                                        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-rose-500 rounded-full shadow-lg border border-rose-400/40 animate-pulse" />
                                    )}
                                    {val === 4 && (
                                        <div className="w-5 h-5 bg-emerald-500/30 rounded-full flex items-center justify-center">
                                            <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full" />
                                        </div>
                                    )}
                                </button>
                            );
                        })
                    ))}
                </div>

                {/* Control D-Pad */}
                <div className="grid grid-cols-3 gap-2 w-36">
                    <div />
                    <button
                        onClick={() => moveItem(-1, 0)}
                        className="h-12 flex items-center justify-center bg-white border border-slate-200 rounded-2xl shadow-xs hover:bg-slate-50 active:scale-95 text-slate-700"
                        title="Up [↑ / W]"
                    >
                        <ArrowUp size={20} />
                    </button>
                    <div />
                    <button
                        onClick={() => moveItem(0, -1)}
                        className="h-12 flex items-center justify-center bg-white border border-slate-200 rounded-2xl shadow-xs hover:bg-slate-50 active:scale-95 text-slate-700"
                        title="Left [← / A]"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <button
                        onClick={() => moveItem(1, 0)}
                        className="h-12 flex items-center justify-center bg-white border border-slate-200 rounded-2xl shadow-xs hover:bg-slate-50 active:scale-95 text-slate-700"
                        title="Down [↓ / S]"
                    >
                        <ArrowDown size={20} />
                    </button>
                    <button
                        onClick={() => moveItem(0, 1)}
                        className="h-12 flex items-center justify-center bg-white border border-slate-200 rounded-2xl shadow-xs hover:bg-slate-50 active:scale-95 text-slate-700"
                        title="Right [→ / D]"
                    >
                        <ArrowRight size={20} />
                    </button>
                </div>

            </div>
        </GameShell>
    );
};

export default MotionChallenge;
