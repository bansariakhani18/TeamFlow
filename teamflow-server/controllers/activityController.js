import mongoose from 'mongoose';
import Activity from '../models/Activity.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';

const ALLOWED_ACTIONS = [
  'TASK_CREATED',
  'TASK_UPDATED',
  'TASK_ASSIGNED',
  'STATUS_CHANGED',
  'TASK_DELETED',
  'COMMENT_ADDED',
  'COMMENT_DELETED',
  'MEMBER_ADDED',
  'MEMBER_REMOVED',
];

/**
 * Fetch project activity timeline
 * GET /api/projects/:projectId/activity?action=&page=1&limit=20
 * Access: Project Member
 */
export const getProjectActivity = asyncHandler(async (req, res, next) => {
  const project = req.project;

  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const query = { project: project._id };

  if (req.query.action) {
    const actionQuery = req.query.action.trim().toUpperCase();
    if (ALLOWED_ACTIONS.includes(actionQuery)) {
      query.action = actionQuery;
    }
  }

  const total = await Activity.countDocuments(query);
  const activities = await Activity.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('actor', 'name email')
    .populate('task', 'title status priority')
    .lean();

  const pagination = {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit) || 1,
  };

  return sendSuccess(res, 200, activities, 'Project activity timeline retrieved successfully', pagination);
});

/**
 * Fetch task activity history
 * GET /api/tasks/:taskId/activity?action=&page=1&limit=20
 * Access: Project Member
 */
export const getTaskActivity = asyncHandler(async (req, res, next) => {
  const task = req.task;

  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const query = { task: task._id };

  if (req.query.action) {
    const actionQuery = req.query.action.trim().toUpperCase();
    if (ALLOWED_ACTIONS.includes(actionQuery)) {
      query.action = actionQuery;
    }
  }

  const total = await Activity.countDocuments(query);
  const activities = await Activity.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('actor', 'name email')
    .lean();

  const pagination = {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit) || 1,
  };

  return sendSuccess(res, 200, activities, 'Task activity history retrieved successfully', pagination);
});

export default {
  getProjectActivity,
  getTaskActivity,
};
