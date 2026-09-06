import mongoose from 'mongoose';

const ModuleBreakdownSchema = new mongoose.Schema(
    {
        gameId: { type: String, required: true },
        score: { type: Number, default: 0 },
        level: { type: Number, default: 1 },
        accuracy: { type: Number, default: 100 },
        timeTaken: { type: Number, default: 0 },
    },
    { _id: false }
);

const ReportSchema = new mongoose.Schema(
    {
        reportId: {
            type: String,
            required: true,
            unique: true,
            index: true,
            uppercase: true,
        },
        candidateName: {
            type: String,
            trim: true,
            default: 'Candidate Aspirant',
        },
        college: {
            type: String,
            trim: true,
            default: 'Independent Aspirant',
        },
        totalScore: {
            type: Number,
            required: true,
        },
        readinessTier: {
            type: String,
            required: true,
            enum: ['Exceller Elite 🌟', 'Competitive Candidate 🎯', 'Developing Aptitude 📚'],
        },
        overallAccuracy: {
            type: Number,
            default: 100,
        },
        moduleBreakdown: [ModuleBreakdownSchema],
    },
    {
        timestamps: true,
    }
);

const Report = mongoose.model('Report', ReportSchema);
export default Report;
