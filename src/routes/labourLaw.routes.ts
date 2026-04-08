import { Router } from 'express';
import { verifyJWT, isAdmin } from '../middleware/auth.middleware';
import {
    getAllUpdates,
    getUpdateById,
    upsertUpdate,
    deleteUpdate
} from '../controllers/labourLaw.controller';

const router = Router();

// Public route - get all visible updates
router.get('/', getAllUpdates);

// Public route - get single update by ID
router.get('/:id', getUpdateById);

// Admin routes - require authentication
router.post('/upsert', verifyJWT, isAdmin, upsertUpdate);
router.delete('/:id', verifyJWT, isAdmin, deleteUpdate);

export default router;
