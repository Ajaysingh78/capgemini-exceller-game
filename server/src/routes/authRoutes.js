import express from 'express';
import { syncUser, getCurrentUser, updateProfile } from '../controllers/authController.js';
import { verifyAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// All auth routes require a valid Firebase ID token
router.post('/sync', verifyAuth, syncUser);
router.get('/me', verifyAuth, getCurrentUser);
router.put('/profile', verifyAuth, updateProfile);

export default router;
