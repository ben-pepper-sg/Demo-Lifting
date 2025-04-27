import { Router } from 'express';
import { authenticate, authorizeAdmin } from '../middleware/auth.middleware';

const router = Router();

// All admin routes are protected by authentication and admin authorization
router.use(authenticate);
router.use(authorizeAdmin);

// Example admin route for user management
router.get('/users', async (req, res) => {
  try {
    // This route is already protected by the middleware
    // Any successful access here will be logged by the transaction in authorizeAdmin
    res.status(200).json({ message: 'Admin access successful' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;