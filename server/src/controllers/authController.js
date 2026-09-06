import mongoose from 'mongoose';
import User from '../models/User.js';

const isDBConnected = () => mongoose.connection.readyState === 1;

/**
 * @desc    Sync authenticated Firebase user into MongoDB Atlas
 * @route   POST /api/auth/sync
 * @access  Protected (Firebase Token required)
 */
export const syncUser = async (req, res, next) => {
    try {
        if (!isDBConnected()) {
            return res.status(503).json({
                success: false,
                message: 'MongoDB Atlas is offline. Please check MONGODB_URI in server/.env.',
            });
        }

        const { uid, email } = req.user;
        const { displayName, collegeName, photoURL } = req.body;

        if (!uid || !email) {
            return res.status(400).json({
                success: false,
                message: 'UID and email are required to synchronize profile.',
            });
        }

        // Check if user already exists in MongoDB
        let user = await User.findOne({ firebaseUid: uid });

        if (!user) {
            // Check if user exists with the same email (e.g. earlier linked)
            user = await User.findOne({ email: email.toLowerCase() });
            if (user) {
                user.firebaseUid = uid;
                if (displayName) user.displayName = displayName.trim();
                if (collegeName) user.collegeName = collegeName.trim();
                if (photoURL) user.photoURL = photoURL;
                user.lastLoginAt = new Date();
                await user.save();
            } else {
                // Create brand new user in MongoDB
                user = await User.create({
                    firebaseUid: uid,
                    email: email.toLowerCase(),
                    displayName: displayName?.trim() || req.user.displayName || email.split('@')[0],
                    collegeName: collegeName?.trim() || 'Independent Aspirant',
                    photoURL: photoURL || req.user.photoURL || '',
                    lastLoginAt: new Date(),
                });
            }

            return res.status(201).json({
                success: true,
                isNewUser: true,
                data: user,
                message: 'User profile successfully initialized in MongoDB Atlas.',
            });
        }

        // Existing user - update last login and optional fields if provided
        user.lastLoginAt = new Date();
        if (displayName && displayName.trim()) user.displayName = displayName.trim();
        if (collegeName && collegeName.trim()) user.collegeName = collegeName.trim();
        if (photoURL) user.photoURL = photoURL;
        await user.save();

        res.status(200).json({
            success: true,
            isNewUser: false,
            data: user,
            message: 'User profile synchronized successfully.',
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get current authenticated user profile from MongoDB
 * @route   GET /api/auth/me
 * @access  Protected
 */
export const getCurrentUser = async (req, res, next) => {
    try {
        if (!isDBConnected()) {
            return res.status(503).json({
                success: false,
                message: 'MongoDB Atlas is offline.',
            });
        }

        const user = await User.findOne({ firebaseUid: req.user.uid });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User profile not found in MongoDB. Please call /api/auth/sync first.',
            });
        }

        res.status(200).json({
            success: true,
            data: user,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update candidate profile details in MongoDB
 * @route   PUT /api/auth/profile
 * @access  Protected
 */
export const updateProfile = async (req, res, next) => {
    try {
        if (!isDBConnected()) {
            return res.status(503).json({
                success: false,
                message: 'MongoDB Atlas is offline.',
            });
        }

        const { displayName, collegeName, photoURL } = req.body;
        const user = await User.findOne({ firebaseUid: req.user.uid });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User profile not found in MongoDB.',
            });
        }

        if (displayName !== undefined) user.displayName = displayName.trim();
        if (collegeName !== undefined) user.collegeName = collegeName.trim();
        if (photoURL !== undefined) user.photoURL = photoURL;

        await user.save();

        res.status(200).json({
            success: true,
            data: user,
            message: 'Profile updated successfully.',
        });
    } catch (error) {
        next(error);
    }
};
