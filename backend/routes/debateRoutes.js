import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as debateController from '../controllers/debateController.js';

const router = Router();

router.get('/', protect, asyncHandler(debateController.listDebates));
router.post('/create', protect, asyncHandler(debateController.createDebate));
router.post('/:id/judge', protect, asyncHandler(debateController.requestJudge));
router.post('/:id/comments', protect, asyncHandler(debateController.addDebateComment));
router.get('/:id', protect, asyncHandler(debateController.getDebate));
router.post('/:id/start', protect, asyncHandler(debateController.startDebateStep));
router.post('/:id/vote', protect, asyncHandler(debateController.voteDebate));

export default router;
