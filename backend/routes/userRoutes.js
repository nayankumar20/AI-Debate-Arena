import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as userProfileController from '../controllers/userProfileController.js';

const router = Router();

router.get('/profile', protect, asyncHandler(userProfileController.getProfile));
router.patch('/profile', protect, asyncHandler(userProfileController.updateProfile));

export default router;
