import express from 'express';
import { protect } from '../middleware/protect.js';
import { loadTaskAndProject } from '../middleware/taskAccess.js';
import { validate } from '../middleware/validate.js';
import { createCommentSchema } from '../utils/validators.js';
import {
  getTaskById,
  updateTask,
  updateTaskStatus,
  updateTaskAssignee,
  deleteTask,
} from '../controllers/taskController.js';
import {
  createComment,
  getTaskComments,
} from '../controllers/commentController.js';
import {
  getTaskActivity,
} from '../controllers/activityController.js';
import {
  sendTaskReminder,
} from '../controllers/analyticsController.js';

const router = express.Router();

// Apply protect middleware to all task routes
router.use(protect);

// Task comments (Module 3)
router
  .route('/:taskId/comments')
  .post(loadTaskAndProject, validate(createCommentSchema), createComment)
  .get(loadTaskAndProject, getTaskComments);

// Task activity history (Module 3)
router
  .route('/:taskId/activity')
  .get(loadTaskAndProject, getTaskActivity);

// Primary Task CRUD
router
  .route('/:id')
  .get(getTaskById)
  .put(updateTask)
  .delete(deleteTask);

router.patch('/:id/status', updateTaskStatus);
router.patch('/:id/assignee', updateTaskAssignee);
router.post('/:id/remind', sendTaskReminder);
router.post('/:taskId/remind', sendTaskReminder);

export default router;
