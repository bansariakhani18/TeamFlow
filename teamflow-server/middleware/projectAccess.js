import mongoose from 'mongoose';
import Project from '../models/Project.js';
import { ApiError } from '../utils/ApiError.js';

export const checkProjectMember = async (req, res, next) => {
  const projectId = req.params.projectId || req.params.id;

  if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
    return next(new ApiError(400, 'Invalid project ID format'));
  }

  const project = await Project.findById(projectId);
  if (!project) {
    return next(new ApiError(404, 'Project not found'));
  }

  const userId = req.user._id ? req.user._id.toString() : req.user.id?.toString();
  const isOwner = project.owner && project.owner.toString() === userId;
  const isMember = project.members && project.members.some(
    (m) => (m.user ? m.user.toString() : m.toString()) === userId
  );

  if (!isOwner && !isMember) {
    return next(new ApiError(403, 'Access denied: You are not a member of this project'));
  }

  req.project = project;
  next();
};

export const checkProjectOwner = async (req, res, next) => {
  const projectId = req.params.projectId || req.params.id;

  let project = req.project;

  if (!project) {
    if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
      return next(new ApiError(400, 'Invalid project ID format'));
    }

    project = await Project.findById(projectId);
    if (!project) {
      return next(new ApiError(404, 'Project not found'));
    }
  }

  const userId = req.user._id ? req.user._id.toString() : req.user.id?.toString();
  if (project.owner && project.owner.toString() !== userId) {
    return next(new ApiError(403, 'Access denied: Only project owner can perform this action'));
  }

  req.project = project;
  next();
};

export default { checkProjectMember, checkProjectOwner };
