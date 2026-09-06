// LocalStorage Persistence for Scores, Stats, and History

const STORAGE_KEYS = {
    HIGH_SCORES: 'cap_game_high_scores',
    STATS: 'cap_game_user_stats',
    HISTORY: 'cap_game_history',
    PREFERENCES: 'cap_game_preferences',
};

export const getHighScores = () => {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.HIGH_SCORES);
        return data ? JSON.parse(data) : {};
    } catch {
        return {};
    }
};

export const saveGameScore = (gameId, score, level, accuracy = 100) => {
    try {
        const scores = getHighScores();
        const currentBest = scores[gameId]?.score || 0;
        const isNewRecord = score > currentBest;

        scores[gameId] = {
            score: Math.max(currentBest, score),
            bestLevel: Math.max(scores[gameId]?.bestLevel || 1, level),
            lastPlayed: new Date().toISOString(),
            accuracy: Math.round(accuracy),
        };
        localStorage.setItem(STORAGE_KEYS.HIGH_SCORES, JSON.stringify(scores));

        // Also append to history
        appendSessionHistory({
            gameId,
            score,
            level,
            accuracy,
            date: new Date().toISOString(),
        });

        return isNewRecord;
    } catch {
        return false;
    }
};

export const getSessionHistory = () => {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.HISTORY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
};

const appendSessionHistory = (session) => {
    try {
        const history = getSessionHistory();
        history.unshift(session);
        // Keep last 30 sessions
        localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history.slice(0, 30)));
    } catch {
        // Ignored
    }
};

export const getCumulativeStats = () => {
    const history = getSessionHistory();
    const highScores = getHighScores();

    const totalGamesPlayed = history.length;
    const totalScore = history.reduce((acc, h) => acc + (h.score || 0), 0);
    const avgAccuracy = totalGamesPlayed > 0
        ? Math.round(history.reduce((acc, h) => acc + (h.accuracy || 100), 0) / totalGamesPlayed)
        : 0;

    return {
        totalGamesPlayed,
        totalScore,
        avgAccuracy,
        highScores,
    };
};
