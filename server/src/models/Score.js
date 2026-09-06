import mongoose from 'mongoose';

const ScoreSchema = new mongoose.Schema(
    {
        playerName: {
            type: String,
            trim: true,
            maxlength: [50, 'Name cannot exceed 50 characters'],
            default: 'Anonymous Candidate',
        },
        collegeName: {
            type: String,
            trim: true,
            maxlength: [100, 'College name cannot exceed 100 characters'],
            default: 'Independent Aspirant',
        },
        gameId: {
            type: String,
            required: [true, 'Game ID is required'],
            enum: ['digit', 'switch', 'geo', 'grid', 'motion', 'inductive', 'color'],
        },
        mode: {
            type: String,
            enum: ['EXAM', 'PRACTICE'],
            default: 'EXAM',
        },
        score: {
            type: Number,
            required: [true, 'Score is required'],
            min: 0,
        },
        level: {
            type: Number,
            required: [true, 'Level is required'],
            min: 1,
        },
        accuracy: {
            type: Number,
            min: 0,
            max: 100,
            default: 100,
        },
        timeTaken: {
            type: Number,
            default: 0,
        },
        firebaseUid: {
            type: String,
            index: true,
            default: null,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// High-performance compound indexes for rapid leaderboard queries
ScoreSchema.index({ gameId: 1, score: -1 });
ScoreSchema.index({ score: -1, createdAt: -1 });
ScoreSchema.index({ collegeName: 1 });
ScoreSchema.index({ firebaseUid: 1, createdAt: -1 });

const Score = mongoose.model('Score', ScoreSchema);

export default Score;
