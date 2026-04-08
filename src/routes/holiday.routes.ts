import { Router } from 'express';
import {
    getAllHolidays,
    upsertHoliday,
    deleteHoliday
} from '../controllers/holiday.controller';
import { verifyJWT, isAdmin } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.get('/', getAllHolidays);

// Admin routes
router.post('/upsert', verifyJWT, isAdmin, upsertHoliday);
router.delete('/:id', verifyJWT, isAdmin, deleteHoliday);

export default router;
