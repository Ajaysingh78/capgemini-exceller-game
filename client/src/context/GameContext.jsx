import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { playCorrect, playWrong, playStreak, playGameOver, playUrgentTick } from '../utils/sound';
import { saveGameScore } from '../utils/storage';
import { launchConfetti } from '../utils/confetti';
import { auth } from '../config/firebase';
import { submitGameScore } from '../utils/api';

const GameContext = createContext();

export const useGame = () => {
    const context = useContext(GameContext);
    if (!context) {
        throw new Error('useGame must be used within a GameProvider');
    }
    return context;
};

export const GameProvider = ({ children }) => {
    const [gameState, setGameState] = useState('IDLE'); // IDLE, PLAYING, PAUSED, GAME_OVER
    const [gameMode, setGameMode] = useState('EXAM'); // EXAM (timed 6m), PRACTICE (untimed)
    const [score, setScore] = useState(0);
    const [level, setLevel] = useState(1);
    const [timeLeft, setTimeLeft] = useState(0);
    const [currentGameId, setCurrentGameId] = useState(null);
    const [streak, setStreak] = useState(0);
    const [isNewHighScore, setIsNewHighScore] = useState(false);

    // Detailed metrics per session
    const [stats, setStats] = useState({
        totalAnswered: 0,
        correctCount: 0,
        wrongCount: 0,
        totalSolveTime: 0,
        questionHistory: [],
    });

    const levelStartTimeRef = useRef(Date.now());
    const lastTickRef = useRef(0);

    const resetLevelTimer = useCallback(() => {
        levelStartTimeRef.current = Date.now();
    }, []);

    const endGame = useCallback(() => {
        setGameState('GAME_OVER');
        playGameOver();
    }, []);

    // Save score & check record on GAME_OVER (LocalStorage + Cloud MongoDB for authenticated candidates)
    useEffect(() => {
        if (gameState === 'GAME_OVER' && currentGameId) {
            const accuracy = stats.totalAnswered > 0
                ? (stats.correctCount / stats.totalAnswered) * 100
                : 100;
            const newRecord = saveGameScore(currentGameId, score, level, accuracy);
            setIsNewHighScore(newRecord);
            if (newRecord || score > 500) {
                setTimeout(() => launchConfetti(), 300);
            }

            // Asynchronously sync to backend MongoDB if candidate is authenticated
            const syncScoreToCloud = async () => {
                try {
                    const currentUser = auth?.currentUser;
                    const token = currentUser ? await currentUser.getIdToken() : null;
                    await submitGameScore({
                        gameId: currentGameId,
                        score,
                        level,
                        accuracy: Math.round(accuracy),
                        timeTaken: stats.totalSolveTime,
                        mode: gameMode,
                    }, token);
                } catch (err) {
                    console.warn('⚠️ Could not sync score to cloud database:', err.message);
                }
            };

            syncScoreToCloud();
        }
    }, [gameState, currentGameId, score, level, stats, gameMode]);


    // Timer Logic for EXAM mode
    useEffect(() => {
        let timer;
        if (gameState === 'PLAYING' && gameMode === 'EXAM' && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        endGame();
                        return 0;
                    }
                    // Audio tick during final 15 seconds
                    if (prev <= 15 && Date.now() - lastTickRef.current > 900) {
                        playUrgentTick();
                        lastTickRef.current = Date.now();
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [gameState, gameMode, timeLeft, endGame]);

    const startGame = useCallback((id, config = {}) => {
        setCurrentGameId(id);
        setScore(0);
        setLevel(1);
        setStreak(0);
        setIsNewHighScore(false);
        setStats({
            totalAnswered: 0,
            correctCount: 0,
            wrongCount: 0,
            totalSolveTime: 0,
            questionHistory: [],
        });

        const selectedMode = config.mode || 'EXAM';
        setGameMode(selectedMode);
        setTimeLeft(selectedMode === 'EXAM' ? (config.duration || 360) : 0);
        levelStartTimeRef.current = Date.now();
        setGameState('PLAYING');
    }, []);

    const submitAnswer = useCallback((isCorrect, explicitTimeTaken) => {
        const now = Date.now();
        const elapsedSeconds = explicitTimeTaken !== undefined
            ? explicitTimeTaken
            : Math.max(1, Math.round((now - levelStartTimeRef.current) / 1000));

        // Reset level start timer for next question
        levelStartTimeRef.current = now;

        if (isCorrect) {
            // Streak multiplier: 1x, 1.25x for 2+, 1.5x for 4+, 2x for 6+
            const currentStreak = streak + 1;
            setStreak(currentStreak);

            let multiplier = 1;
            if (currentStreak >= 6) multiplier = 2.0;
            else if (currentStreak >= 4) multiplier = 1.5;
            else if (currentStreak >= 2) multiplier = 1.25;

            const basePoints = Math.round((Math.pow(level, 2) / Math.max(1, elapsedSeconds)) * 100);
            const pointsAwarded = Math.round(basePoints * multiplier);

            setScore((prev) => prev + pointsAwarded);
            setLevel((prev) => prev + 1);

            if (currentStreak >= 3) {
                playStreak();
            } else {
                playCorrect();
            }

            setStats((prev) => ({
                totalAnswered: prev.totalAnswered + 1,
                correctCount: prev.correctCount + 1,
                wrongCount: prev.wrongCount,
                totalSolveTime: prev.totalSolveTime + elapsedSeconds,
                questionHistory: [
                    ...prev.questionHistory,
                    { level, isCorrect: true, timeTaken: elapsedSeconds, points: pointsAwarded },
                ],
            }));
        } else {
            setStreak(0);
            playWrong();

            setStats((prev) => ({
                totalAnswered: prev.totalAnswered + 1,
                correctCount: prev.correctCount,
                wrongCount: prev.wrongCount + 1,
                totalSolveTime: prev.totalSolveTime + elapsedSeconds,
                questionHistory: [
                    ...prev.questionHistory,
                    { level, isCorrect: false, timeTaken: elapsedSeconds, points: 0 },
                ],
            }));
        }
    }, [level, streak]);

    const resetGame = useCallback(() => {
        setGameState('IDLE');
        setScore(0);
        setLevel(1);
        setTimeLeft(0);
        setStreak(0);
        setCurrentGameId(null);
    }, []);

    const value = {
        gameState,
        gameMode,
        setGameMode,
        score,
        level,
        timeLeft,
        currentGameId,
        streak,
        stats,
        isNewHighScore,
        startGame,
        endGame,
        submitAnswer,
        resetGame,
        resetLevelTimer,
        setGameState,
    };

    return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};
