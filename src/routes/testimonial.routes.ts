import { Router } from 'express';
import {
    getAllTestimonials,
    upsertTestimonial,
    deleteTestimonial,
    getAllWhyChooseUs,
    upsertWhyChooseUs,
    deleteWhyChooseUs
} from '../controllers/testimonials.controller';
import { verifyJWT, isAdmin } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.get('/', getAllTestimonials);
router.get('/why-choose-us', getAllWhyChooseUs);

// Admin routes
router.post('/upsert', verifyJWT, isAdmin, upsertTestimonial);
router.delete('/:id', verifyJWT, isAdmin, deleteTestimonial);

router.post('/why-choose-us/upsert', verifyJWT, isAdmin, upsertWhyChooseUs);
router.delete('/why-choose-us/:id', verifyJWT, isAdmin, deleteWhyChooseUs);

export default router;
