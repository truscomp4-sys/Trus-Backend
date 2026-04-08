import { Router } from 'express';
import {
    submitEnquiry,
    getAllEnquiries,
    createEnquiry,
    updateEnquiry,
    updateEnquiryStatus,
    deleteEnquiry
} from '../controllers/enquiry.controller';
import { verifyJWT, isAdmin } from '../middleware/auth.middleware';

const router = Router();

// Public route
router.post('/submit', submitEnquiry);

// Admin routes
router.get('/', verifyJWT, isAdmin, getAllEnquiries);
router.post('/', verifyJWT, isAdmin, createEnquiry);
router.put('/:id', verifyJWT, isAdmin, updateEnquiry);
router.patch('/:id/status', verifyJWT, isAdmin, updateEnquiryStatus);
router.delete('/:id', verifyJWT, isAdmin, deleteEnquiry);

export default router;
