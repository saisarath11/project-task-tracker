import { Router } from 'express';
import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  getProjectMembers,
  addProjectMember,
  removeProjectMember,
} from '../controllers/project.controller';
import { getTasks, createTask } from '../controllers/task.controller';
import { getProjectDashboard } from '../controllers/dashboard.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/', getProjects);
router.post('/', createProject);
router.get('/:id', getProjectById);
router.patch('/:id', updateProject);

// Project Members
router.get('/:id/members', getProjectMembers);
router.post('/:id/members', addProjectMember);
router.delete('/:id/members/:userId', removeProjectMember);

// Nested project tasks
router.get('/:projectId/tasks', getTasks);
router.post('/:projectId/tasks', createTask);

// Project Dashboard
router.get('/:id/dashboard', getProjectDashboard);

export default router;
