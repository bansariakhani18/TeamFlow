import mongoose from 'mongoose';
import Project from '../models/Project.js';
import User from '../models/User.js';
import Task from '../models/Task.js';
import Comment from '../models/Comment.js';
import Activity from '../models/Activity.js';
import Notification from '../models/Notification.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import { logActivity } from '../services/activityService.js';

// @desc    Create new project
// @route   POST /api/projects
// @access  Private
export const createProject = asyncHandler(async (req, res) => {
  const { name, description, startDate, endDate } = req.body;

  const project = await Project.create({
    name,
    description: description || '',
    owner: req.user._id,
    members: [{ user: req.user._id, joinedAt: new Date() }],
    startDate: startDate || null,
    endDate: endDate || null,
  });

  const populated = await Project.findById(project._id)
    .populate('owner', 'name email')
    .populate('members.user', 'name email');

  return sendSuccess(res, 201, populated, 'Project created successfully');
});

// @desc    Get user's projects with search, sort, and pagination
// @route   GET /api/projects
// @access  Private
export const getProjects = asyncHandler(async (req, res) => {
  const { search, sort = '-createdAt', page = 1, limit = 10 } = req.query;

  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (parsedPage - 1) * parsedLimit;

  const query = {
    'members.user': req.user._id,
  };

  if (search && search.trim()) {
    query.name = { $regex: search.trim(), $options: 'i' };
  }

  // Whitelist sort fields
  const allowedSortFields = {
    createdAt: 'createdAt',
    '-createdAt': '-createdAt',
    name: 'name',
    '-name': '-name',
    endDate: 'endDate',
    '-endDate': '-endDate',
  };

  const sortOption = allowedSortFields[sort] || '-createdAt';

  const [projects, total] = await Promise.all([
    Project.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(parsedLimit)
      .populate('owner', 'name email')
      .populate('members.user', 'name email')
      .lean(),
    Project.countDocuments(query),
  ]);

  const pages = Math.ceil(total / parsedLimit) || 1;

  return sendSuccess(
    res,
    200,
    projects,
    'Projects retrieved successfully',
    {
      page: parsedPage,
      limit: parsedLimit,
      total,
      pages,
    }
  );
});

// @desc    Get single project by ID
// @route   GET /api/projects/:projectId
// @access  Private (Project Member or Owner)
export const getProjectById = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.project._id)
    .populate('owner', 'name email')
    .populate('members.user', 'name email');

  return sendSuccess(res, 200, project, 'Project retrieved successfully');
});

// @desc    Update project details
// @route   PUT /api/projects/:projectId
// @access  Private (Project Owner)
export const updateProject = asyncHandler(async (req, res) => {
  const { name, description, startDate, endDate } = req.body;

  const project = req.project;
  project.name = name;
  project.description = description !== undefined ? description : project.description;
  project.startDate = startDate || null;
  project.endDate = endDate || null;

  await project.save();

  const updated = await Project.findById(project._id)
    .populate('owner', 'name email')
    .populate('members.user', 'name email');

  return sendSuccess(res, 200, updated, 'Project updated successfully');
});

// @desc    Delete project
// @route   DELETE /api/projects/:projectId
// @access  Private (Project Owner)
export const deleteProject = asyncHandler(async (req, res) => {
  const project = req.project;

  await Project.findByIdAndDelete(project._id);
  await Task.deleteMany({ project: project._id });
  await Comment.deleteMany({ project: project._id });
  await Activity.deleteMany({ project: project._id });
  await Notification.deleteMany({ project: project._id });

  return sendSuccess(res, 200, { deletedId: project._id }, 'Project deleted successfully');
});

// @desc    Add member to project by email
// @route   POST /api/projects/:projectId/members
// @access  Private (Project Owner)
export const addMember = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  const userToAdd = await User.findOne({ email: email.toLowerCase().trim() });
  if (!userToAdd) {
    return next(new ApiError(404, 'User not found with this email'));
  }

  const project = req.project;
  const isAlreadyMember = project.members.some(
    (m) => m.user && m.user.toString() === userToAdd._id.toString()
  );

  if (isAlreadyMember) {
    return next(new ApiError(409, 'User is already a member of this project'));
  }

  project.members.push({
    user: userToAdd._id,
    joinedAt: new Date(),
  });

  await project.save();

  await logActivity({
    project: project._id,
    actor: req.user._id,
    action: 'MEMBER_ADDED',
    details: {
      memberId: userToAdd._id,
      name: userToAdd.name,
      email: userToAdd.email,
    },
  });

  const updated = await Project.findById(project._id)
    .populate('owner', 'name email')
    .populate('members.user', 'name email');

  return sendSuccess(res, 201, updated, 'Member added successfully');
});

// @desc    Remove member from project or leave project
// @route   DELETE /api/projects/:projectId/members/:userId
// @access  Private (Owner or Self)
export const removeMember = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;
  const project = req.project;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return next(new ApiError(400, 'Invalid user ID format'));
  }

  // Block removing owner
  if (project.owner.toString() === userId) {
    return next(new ApiError(400, 'Cannot remove the project owner from members'));
  }

  const callerId = req.user._id.toString();
  const isOwner = project.owner.toString() === callerId;
  const isSelf = callerId === userId;

  if (!isOwner && !isSelf) {
    return next(new ApiError(403, 'Access denied: You can only remove yourself or be the owner'));
  }

  const memberIndex = project.members.findIndex(
    (m) => m.user && m.user.toString() === userId
  );

  if (memberIndex === -1) {
    return next(new ApiError(404, 'User is not a member of this project'));
  }

  project.members.splice(memberIndex, 1);
  await project.save();

  await logActivity({
    project: project._id,
    actor: req.user._id,
    action: 'MEMBER_REMOVED',
    details: { removedUserId: userId },
  });

  const updated = await Project.findById(project._id)
    .populate('owner', 'name email')
    .populate('members.user', 'name email');

  return sendSuccess(
    res,
    200,
    updated,
    isSelf ? 'You have successfully left the project' : 'Member removed successfully'
  );
});

export default {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
};
