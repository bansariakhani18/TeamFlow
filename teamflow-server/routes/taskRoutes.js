import express from 'express';
import { protect } from '../middleware/protect.js';
import {
  getTaskById,
  updateTask,
  updateTaskStatus,
  updateTaskAssignee,
  deleteTask,
} from '../controllers/taskController.js';

const router = express.Router();

// Apply protect middleware to all task routes
router.use(protect);

router
  .route('/:id')
  .get(getTaskById)
  .put(updateTask)
  .delete(deleteTask);

router.patch('/:id/status', updateTaskStatus);
router.patch('/:id/assignee', updateTaskAssignee);

export default router;

