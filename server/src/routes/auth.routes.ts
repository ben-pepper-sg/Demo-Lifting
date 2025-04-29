import express from 'express';
import { register, login, getMe, adminCreateUser, requestPasswordReset, resetPassword } from '../controllers/auth.controller';
import { authenticate, authorizeAdmin } from '../middleware/auth.middleware';

const router = express.Router();

// Register a new user
router.post('/register', register);

// Login user
router.post('/login', login);

// Get current user info
router.get('/me', authenticate, getMe);

// Password reset flow
router.post('/forgot-password', requestPasswordReset);
router.post('/reset-password', resetPassword);

// Admin route to create a user
router.post('/admin/users', authenticate, authorizeAdmin, adminCreateUser);

export default router;