import express from 'express';
import { protect } from '../middleware/protect.js';
import {
  createTask,
  getProjectTasks,
} from '../controllers/taskController.js';
import Project from '../models/Project.js';
import { sendSuccess } from '../utils/response.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();

router.use(protect);

// Nested task routes for projects
router
  .route('/:projectId/tasks')
  .post(createTask)
  .get(getProjectTasks);

// Also support /:id/tasks for route param consistency
router
  .route('/:id/tasks')
  .post(createTask)
  .get(getProjectTasks);

// Basic project endpoints to support UI & testing
router.get('/', asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const projects = await Project.find({
    $or: [{ owner: userId }, { 'members.user': userId }],
  }).populate('owner', 'name email').populate('members.user', 'name email');
  return sendSuccess(res, 200, projects, 'Projects retrieved');
}));

router.post('/', asyncHandler(async (req, res, next) => {
  const { name, description } = req.body;
  if (!name || name.trim().length < 3) {
    return next(new ApiError(400, 'Project name must be at least 3 characters'));
  }
  const userId = req.user._id || req.user.id;
  const project = await Project.create({
    name: name.trim(),
    description: description || '',
    owner: userId,
    members: [{ user: userId, joinedAt: new Date() }],
  });
  return sendSuccess(res, 201, project, 'Project created');
}));

router.get('/:projectId', asyncHandler(async (req, res, next) => {
  const projectId = req.params.projectId;
  const project = await Project.findById(projectId)
    .populate('owner', 'name email')
    .populate('members.user', 'name email');
  if (!project) return next(new ApiError(404, 'Project not found'));
  return sendSuccess(res, 200, project, 'Project found');
}));

export default router;

