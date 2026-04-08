import { Router } from 'express';
import {
    getSetting,
    getAllPublicSettings,
    upsertSetting,
    batchUpdateSettings,
    sendTestEmail
} from '../controllers/settings.controller';
import { verifyJWT, isAdmin } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.get('/', getAllPublicSettings);
router.get('/:key', getSetting);

// Admin routes
router.post('/upsert', verifyJWT, isAdmin, upsertSetting);
router.post('/batch', verifyJWT, isAdmin, batchUpdateSettings);
router.post('/test-email', verifyJWT, isAdmin, sendTestEmail);

export default router;
