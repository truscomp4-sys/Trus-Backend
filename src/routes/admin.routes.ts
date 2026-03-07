import { Router } from 'express';
import { verifyJWT, isAdmin } from '../middleware/auth.middleware';
import { getDashboardStats } from '../controllers/dashboard.controller';

const router = Router();

// Integrated Dashboard Stats
router.get('/dashboard/stats', verifyJWT, isAdmin, getDashboardStats);

export default router;
