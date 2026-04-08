import { Router } from 'express';
import {
    getAllBlogs,
    getBlogById,
    upsertBlog,
    deleteBlog
} from '../controllers/blog.controller';
import { verifyJWT, isAdmin } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.get('/', getAllBlogs);
router.get('/:id', getBlogById);

// Admin routes
router.post('/upsert', verifyJWT, isAdmin, upsertBlog);
router.delete('/:id', verifyJWT, isAdmin, deleteBlog);

export default router;
