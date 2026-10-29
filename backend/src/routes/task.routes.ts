import { Router } from 'express';
import {
  getTaskById,
  updateTask,
  updateTaskStatus,
  deleteTask,
  addComment,
  getComments,
} from '../controllers/task.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/:id', getTaskById);
router.patch('/:id', updateTask);
router.patch('/:id/status', updateTaskStatus);
router.delete('/:id', deleteTask);

// Comments
router.post('/:id/comments', addComment);
router.get('/:id/comments', getComments);

export default router;
