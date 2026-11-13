import express from 'express';
import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
} from '../controllers/projectController.js';
import {
  createTask,
  getProjectTasks,
} from '../controllers/taskController.js';
import {
  getProjectActivity,
} from '../controllers/activityController.js';
import analyticsRoutes from './analyticsRoutes.js';
import { protect } from '../middleware/protect.js';
import { checkProjectMember, checkProjectOwner } from '../middleware/projectAccess.js';
import { validate } from '../middleware/validate.js';
import {
  createProjectSchema,
  updateProjectSchema,
  addMemberSchema,
} from '../utils/validators.js';

const router = express.Router();

// Apply protect middleware to all project routes
router.use(protect);

router
  .route('/')
  .post(validate(createProjectSchema), createProject)
  .get(getProjects);

router
  .route('/:projectId')
  .get(checkProjectMember, getProjectById)
  .put(checkProjectOwner, validate(updateProjectSchema), updateProject)
  .delete(checkProjectOwner, deleteProject);

router
  .route('/:projectId/members')
  .post(checkProjectOwner, validate(addMemberSchema), addMember);

router
  .route('/:projectId/members/:userId')
  .delete(checkProjectMember, removeMember);

// Nested task routes (Module 2)
router
  .route('/:projectId/tasks')
  .post(checkProjectMember, createTask)
  .get(checkProjectMember, getProjectTasks);

// Nested project activity route (Module 3)
router
  .route('/:projectId/activity')
  .get(checkProjectMember, getProjectActivity);

// Module 4: Analytics, Dashboard & Notification routes
router.use('/', analyticsRoutes);

export default router;
