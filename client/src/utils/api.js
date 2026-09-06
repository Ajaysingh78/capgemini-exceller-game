// API Client for Capgemini Exceller Backend

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Execute a fetch request with optional Bearer token authorization
 */
export const fetchApi = async (endpoint, options = {}, token = null) => {
    const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const res = await fetch(url, {
            ...options,
            headers,
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
            const error = new Error(data.message || `Request failed with status ${res.status}`);
            error.status = res.status;
            error.data = data;
            throw error;
        }

        return data;
    } catch (err) {
        // Enhance network connectivity error messages
        if (err.name === 'TypeError' && err.message.includes('fetch')) {
            const networkErr = new Error('Cannot reach the backend server. Please verify the backend is running at http://localhost:5000.');
            networkErr.isNetworkError = true;
            throw networkErr;
        }
        throw err;
    }
};

/**
 * Synchronize authenticated Firebase user with MongoDB Atlas
 */
export const syncUserWithBackend = async (token, profileData = {}) => {
    return fetchApi('/auth/sync', {
        method: 'POST',
        body: JSON.stringify(profileData),
    }, token);
};

/**
 * Fetch current MongoDB user profile
 */
export const fetchCurrentUserProfile = async (token) => {
    return fetchApi('/auth/me', {
        method: 'GET',
    }, token);
};

/**
 * Update candidate profile in MongoDB
 */
export const updateUserProfile = async (token, profileData) => {
    return fetchApi('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData),
    }, token);
};

/**
 * Submit a game score to backend (associates with Firebase UID if token provided)
 */
export const submitGameScore = async (scoreData, token = null) => {
    return fetchApi('/scores', {
        method: 'POST',
        body: JSON.stringify(scoreData),
    }, token);
};

/**
 * Get personal scores for the authenticated candidate
 */
export const fetchMyScores = async (token) => {
    return fetchApi('/scores/my-scores', {
        method: 'GET',
    }, token);
};

/**
 * Get global leaderboard
 */
export const fetchLeaderboard = async (gameId = 'all', mode = 'EXAM', limit = 10) => {
    return fetchApi(`/scores/leaderboard?gameId=${gameId}&mode=${mode}&limit=${limit}`, {
        method: 'GET',
    });
};
