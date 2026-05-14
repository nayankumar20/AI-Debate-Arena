import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as analyticsController from '../controllers/analyticsController.js';

const router = Router();

router.get('/dashboard', protect, asyncHandler(analyticsController.getDashboardAnalytics));
router.get('/arena-pulse', protect, asyncHandler(analyticsController.getArenaPulseAnalytics));

export default router;
