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

export default router;
