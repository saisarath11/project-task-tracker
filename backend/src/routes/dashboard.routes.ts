import { Router } from 'express';
import {
  getUserDashboard,
  getAdminDashboard,
  getProjectDashboard,
} from '../controllers/dashboard.controller';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/me', getUserDashboard);
router.get('/admin', requireAdmin, getAdminDashboard);
router.get('/projects/:id', getProjectDashboard);

export default router;
