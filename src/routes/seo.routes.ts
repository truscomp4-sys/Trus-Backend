import { Router } from 'express';
import { verifyJWT, isAdmin } from '../middleware/auth.middleware';
import { getSEOAdmin, upsertSEO, deleteSEO, getSEOPublic, getSEODiscovery } from '../controllers/seo.controller';

const router = Router();

// Public route for frontend
router.get('/public', getSEOPublic);

// Admin routes
router.get('/discovery', verifyJWT, isAdmin, getSEODiscovery);
router.get('/', verifyJWT, isAdmin, getSEOAdmin);
router.post('/', verifyJWT, isAdmin, upsertSEO);
router.delete('/:id', verifyJWT, isAdmin, deleteSEO);

export default router;
