import { Router } from 'express';
import { getProfile, updateProfile, getAllUsers } from '../controllers/user.controller';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

router.get('/me', authenticateToken, getProfile);
router.patch('/me', authenticateToken, updateProfile);
// Allow authenticated users to view users (for project member search) or admins
router.get('/', authenticateToken, getAllUsers);

export default router;
