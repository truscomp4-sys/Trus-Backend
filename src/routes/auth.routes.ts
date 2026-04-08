import { Router } from 'express';
import { login, refresh, logout, initiateEmailChange, verifyEmailChange, forgotPassword, resetPassword } from '../controllers/auth.controller';

import { verifyJWT } from '../middleware/auth.middleware';

const router = Router();

router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);

// Email Change Routes
router.post('/initiate-email-change', verifyJWT, initiateEmailChange);
router.post('/verify-email-change', verifyEmailChange);

// Password Reset Routes
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;
