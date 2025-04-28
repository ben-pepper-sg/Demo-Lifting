import express from 'express';
import { register, login, getMe, adminCreateUser } from '../controllers/auth.controller';
import { authenticate, authorizeAdmin } from '../middleware/auth.middleware';

const router = express.Router();

// Register a new user
router.post('/register', register);

// Login user
router.post('/login', login);

// Get current user info
router.get('/me', authenticate, getMe);

// Admin route to create a user
router.post('/admin/users', authenticate, authorizeAdmin, adminCreateUser);

export default router;