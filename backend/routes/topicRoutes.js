import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as topicController from '../controllers/topicController.js';

const router = Router();

router.get('/suggestions', asyncHandler(topicController.getTopicSuggestions));
router.post('/refresh', protect, asyncHandler(topicController.refreshTopicIdeas));

export default router;
