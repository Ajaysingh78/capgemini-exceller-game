import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
    {
        firebaseUid: {
            type: String,
            required: [true, 'Firebase UID is required'],
            unique: true,
            index: true,
            trim: true,
        },
        email: {
            type: String,
            required: [true, 'Email address is required'],
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        displayName: {
            type: String,
            trim: true,
            maxlength: [100, 'Display name cannot exceed 100 characters'],
            default: 'Candidate Aspirant',
        },
        collegeName: {
            type: String,
            trim: true,
            maxlength: [120, 'College name cannot exceed 120 characters'],
            default: 'Independent Aspirant',
        },
        role: {
            type: String,
            enum: ['student', 'admin'],
            default: 'student',
        },
        photoURL: {
            type: String,
            default: '',
        },
        lastLoginAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

// Compound index for querying active students
UserSchema.index({ email: 1, firebaseUid: 1 });

const User = mongoose.model('User', UserSchema);
export default User;
