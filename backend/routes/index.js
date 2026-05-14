import { Router } from 'express';
import authRoutes from './authRoutes.js';
import debateRoutes from './debateRoutes.js';
import analyticsRoutes from './analyticsRoutes.js';
import userRoutes from './userRoutes.js';
import topicRoutes from './topicRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/debates', debateRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/users', userRoutes);
router.use('/topics', topicRoutes);

export default router;
