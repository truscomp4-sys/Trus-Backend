import { Router } from 'express';
import {
    getResources,
    upsertResource,
    deleteResource
} from '../controllers/resource.controller';
import { verifyJWT, isAdmin } from '../middleware/auth.middleware';

import multer from 'multer';

const router = Router();
const upload = multer();

// Public routes
router.get('/', getResources);

// Admin routes
// Use upload.any() to handle multipart/form-data if sent (text fields or files)
router.post('/upsert', verifyJWT, isAdmin, upload.any(), upsertResource);
router.delete('/:id', verifyJWT, isAdmin, deleteResource);

export default router;
