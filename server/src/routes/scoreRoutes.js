import express from 'express';
import { submitScore, getLeaderboard, getCollegeRankings, getMyScores } from '../controllers/scoreController.js';
import { optionalAuth, verifyAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', optionalAuth, submitScore);
router.get('/my-scores', verifyAuth, getMyScores);
router.get('/leaderboard', getLeaderboard);
router.get('/colleges', getCollegeRankings);

export default router;

