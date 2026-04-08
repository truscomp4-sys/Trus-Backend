import { Router } from 'express';
import {
    getAllComplianceUpdates,
    getComplianceUpdateBySlug,
    upsertComplianceUpdate,
    deleteComplianceUpdate
} from '../controllers/compliance.controller';
import { verifyJWT, isAdmin } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.get('/', getAllComplianceUpdates);
router.get('/:slug', getComplianceUpdateBySlug);

// Admin routes
router.post('/upsert', verifyJWT, isAdmin, upsertComplianceUpdate);
router.delete('/:id', verifyJWT, isAdmin, deleteComplianceUpdate);

export default router;
