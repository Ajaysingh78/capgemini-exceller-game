import express from 'express';
import { createReport, getReportById, getPlatformStats } from '../controllers/reportController.js';

const router = express.Router();

router.post('/', createReport);
router.get('/stats/overview', getPlatformStats);
router.get('/:id', getReportById);

export default router;
