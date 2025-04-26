import express from 'express';
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} from '../controllers/user.controller';
import { authenticate, authorizeAdmin } from '../middleware/auth.middleware';

const router = express.Router();

// Get all users (admin only)
router.get('/', authenticate, authorizeAdmin, getAllUsers);

// Get a single user
router.get('/:id', authenticate, getUserById);

// Update a user
router.put('/:id', authenticate, updateUser);

// Delete a user (admin only)
router.delete('/:id', authenticate, authorizeAdmin, deleteUser);

export default router;