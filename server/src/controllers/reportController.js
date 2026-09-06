import mongoose from 'mongoose';
import Report from '../models/Report.js';
import Score from '../models/Score.js';

const isDBConnected = () => mongoose.connection.readyState === 1;

// Helper to generate readable ID: EXC-XXXXXX
const generateReportId = () => {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = 'EXC-';
    for (let i = 0; i < 6; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
};

// @desc    Generate a verified assessment scorecard
// @route   POST /api/reports
export const createReport = async (req, res, next) => {
    try {
        if (!isDBConnected()) {
            return res.status(503).json({
                success: false,
                message: 'Database offline. Paste your MONGODB_URI in server/.env to generate verified scorecards.',
            });
        }

        const { candidateName, college, totalScore, readinessTier, overallAccuracy, moduleBreakdown } = req.body;

        if (totalScore === undefined || !readinessTier) {
            return res.status(400).json({
                success: false,
                message: 'totalScore and readinessTier are required.',
            });
        }

        let reportId = generateReportId();
        let exists = await Report.findOne({ reportId });
        while (exists) {
            reportId = generateReportId();
            exists = await Report.findOne({ reportId });
        }

        const report = await Report.create({
            reportId,
            candidateName: candidateName?.trim() || 'Candidate Aspirant',
            college: college?.trim() || 'Independent Aspirant',
            totalScore: Number(totalScore),
            readinessTier,
            overallAccuracy: overallAccuracy ? Number(overallAccuracy) : 100,
            moduleBreakdown: Array.isArray(moduleBreakdown) ? moduleBreakdown : [],
        });

        res.status(201).json({
            success: true,
            data: report,
            shareUrl: `/verify/${report.reportId}`,
            message: 'Verified Assessment Certificate generated successfully!',
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get verified scorecard by ID
// @route   GET /api/reports/:id
export const getReportById = async (req, res, next) => {
    try {
        if (!isDBConnected()) {
            return res.status(503).json({
                success: false,
                message: 'Database offline. Configure MONGODB_URI to verify scorecards.',
            });
        }

        const { id } = req.params;
        const report = await Report.findOne({ reportId: id.toUpperCase() });

        if (!report) {
            return res.status(404).json({
                success: false,
                message: `Assessment Certificate with ID ${id} was not found.`,
            });
        }

        res.status(200).json({
            success: true,
            data: report,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get aggregate platform metrics
// @route   GET /api/stats/overview
export const getPlatformStats = async (req, res, next) => {
    try {
        if (!isDBConnected()) {
            return res.status(200).json({
                success: true,
                data: {
                    totalTestsAttempted: 0,
                    totalCandidates: 0,
                    averageScore: 0,
                    isOffline: true,
                },
            });
        }

        const [totalScores, scoreStats, reportCount] = await Promise.all([
            Score.countDocuments(),
            Score.aggregate([
                {
                    $group: {
                        _id: null,
                        avgScore: { $avg: '$score' },
                        highestScore: { $max: '$score' },
                    },
                },
            ]),
            Report.countDocuments(),
        ]);

        res.status(200).json({
            success: true,
            data: {
                totalTestsAttempted: totalScores,
                totalVerifiedCertificates: reportCount,
                averageScore: scoreStats[0]?.avgScore ? Math.round(scoreStats[0].avgScore) : 0,
                highestScoreRecorded: scoreStats[0]?.highestScore || 0,
            },
        });
    } catch (error) {
        next(error);
    }
};
