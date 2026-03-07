import { Router } from 'express';
import {
    getAllServices,
    getServiceBySlug,
    upsertService,
    deleteService,
    renameCategory,
    getServiceCategories,
    updateServiceCategories
} from '../controllers/service.controller';
import { verifyJWT, isAdmin } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.get('/', getAllServices);

// Admin routes - MUST be defined before /:slug to prevent wildcard from capturing them
router.post('/upsert', verifyJWT, isAdmin, upsertService);
router.get('/categories/all', verifyJWT, isAdmin, getServiceCategories);
router.post('/categories/update', verifyJWT, isAdmin, updateServiceCategories);
router.post('/category/rename', verifyJWT, isAdmin, renameCategory);
router.delete('/:id', verifyJWT, isAdmin, deleteService);

// Public detail route - MUST be last as it matches any path segment
router.get('/:slug', getServiceBySlug);

export default router;
