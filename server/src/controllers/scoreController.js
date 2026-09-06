import mongoose from 'mongoose';
import Score from '../models/Score.js';

const isDBConnected = () => mongoose.connection.readyState === 1;

// @desc    Submit a game score
// @route   POST /api/scores
export const submitScore = async (req, res, next) => {
    try {
        if (!isDBConnected()) {
            return res.status(503).json({
                success: false,
                message: 'Database offline. Paste your MONGODB_URI in server/.env to save live scores.',
            });
        }

        const { playerName, collegeName, gameId, mode, score, level, accuracy, timeTaken } = req.body;

        if (!gameId || score === undefined || level === undefined) {
            return res.status(400).json({
                success: false,
                message: 'gameId, score, and level are required fields.',
            });
        }

        const candidateName = req.mongoUser?.displayName || req.user?.displayName || playerName?.trim() || 'Anonymous Candidate';
        const candidateCollege = req.mongoUser?.collegeName || collegeName?.trim() || 'Independent Aspirant';
        const firebaseUid = req.user?.uid || null;
        const userId = req.mongoUser?._id || null;

        const newScore = await Score.create({
            playerName: candidateName,
            collegeName: candidateCollege,
            gameId,
            mode: mode || 'EXAM',
            score: Number(score),
            level: Number(level),
            accuracy: accuracy !== undefined ? Number(accuracy) : 100,
            timeTaken: timeTaken ? Number(timeTaken) : 0,
            firebaseUid,
            userId,
        });

        // Determine candidate's rank in this game
        const higherScoresCount = await Score.countDocuments({
            gameId,
            score: { $gt: newScore.score },
        });

        res.status(201).json({
            success: true,
            data: newScore,
            rank: higherScoresCount + 1,
            message: 'Score successfully recorded on National Leaderboard!',
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get personal scores for the authenticated candidate
// @route   GET /api/scores/my-scores
// @access  Protected
export const getMyScores = async (req, res, next) => {
    try {
        if (!isDBConnected()) {
            return res.status(200).json({ success: true, data: [] });
        }

        const scores = await Score.find({ firebaseUid: req.user.uid })
            .sort({ createdAt: -1 })
            .limit(50);

        res.status(200).json({
            success: true,
            count: scores.length,
            data: scores,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get top scores leaderboard
// @route   GET /api/leaderboard
export const getLeaderboard = async (req, res, next) => {
    try {
        if (!isDBConnected()) {
            return res.status(200).json({
                success: true,
                data: [],
                isOffline: true,
                message: 'MongoDB is in standby mode. Add MONGODB_URI to view cloud leaderboard.',
            });
        }

        const { gameId, mode = 'EXAM', limit = 10 } = req.query;
        const query = {};

        if (gameId && gameId !== 'all') {
            query.gameId = gameId;
        }
        if (mode) {
            query.mode = mode;
        }

        const safeLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));

        const scores = await Score.find(query)
            .sort({ score: -1, createdAt: -1 })
            .limit(safeLimit)
            .select('playerName collegeName gameId mode score level accuracy createdAt');

        res.status(200).json({
            success: true,
            count: scores.length,
            data: scores,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get college / university rankings
// @route   GET /api/leaderboard/colleges
export const getCollegeRankings = async (req, res, next) => {
    try {
        if (!isDBConnected()) {
            return res.status(200).json({ success: true, data: [] });
        }

        const rankings = await Score.aggregate([
            {
                $group: {
                    _id: '$collegeName',
                    totalCandidates: { $sum: 1 },
                    avgScore: { $avg: '$score' },
                    highestScore: { $max: '$score' },
                },
            },
            {
                $project: {
                    college: '$_id',
                    _id: 0,
                    totalCandidates: 1,
                    avgScore: { $round: ['$avgScore', 0] },
                    highestScore: 1,
                },
            },
            { $sort: { avgScore: -1, totalCandidates: -1 } },
            { $limit: 15 },
        ]);

        res.status(200).json({
            success: true,
            data: rankings,
        });
    } catch (error) {
        next(error);
    }
};
