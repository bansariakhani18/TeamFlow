import mongoose from 'mongoose';
import Task from '../models/Task.js';
import Project from '../models/Project.js';
import { ApiError } from '../utils/ApiError.js';

export const loadTaskAndProject = async (req, res, next) => {
  const taskId = req.params.id || req.params.taskId;

  if (!taskId || !mongoose.Types.ObjectId.isValid(taskId)) {
    return next(new ApiError(400, 'Invalid task ID format'));
  }

  const task = await Task.findById(taskId);
  if (!task) {
    return next(new ApiError(404, 'Task not found'));
  }

  const project = await Project.findById(task.project);
  if (!project) {
    return next(new ApiError(404, 'Project associated with this task not found'));
  }

  const userId = req.user._id ? req.user._id.toString() : req.user.id?.toString();
  const isOwner = project.owner && project.owner.toString() === userId;
  const isMember = project.members && project.members.some(
    (m) => (m.user ? m.user.toString() : m.toString()) === userId
  );

  if (!isOwner && !isMember) {
    return next(new ApiError(403, 'Access denied: You are not a member of this project'));
  }

  req.task = task;
  req.project = project;
  next();
};

export default { loadTaskAndProject };

