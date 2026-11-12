import mongoose from 'mongoose';
import Comment from '../models/Comment.js';
import Task from '../models/Task.js';
import Project from '../models/Project.js';
import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import { logActivity } from '../services/activityService.js';

/**
 * Add a comment to a task
 * POST /api/tasks/:taskId/comments
 * Access: Project Member
 */
export const createComment = asyncHandler(async (req, res, next) => {
  const task = req.task;
  const project = req.project;
  const { text, mentions } = req.body;

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return next(new ApiError(400, 'Comment text cannot be empty or whitespace only'));
  }

  const trimmedText = text.trim();
  if (trimmedText.length > 1000) {
    return next(new ApiError(400, 'Comment text cannot exceed 1000 characters'));
  }

  // Filter valid mention IDs
  let validMentions = [];
  if (Array.isArray(mentions)) {
    validMentions = mentions.filter((id) => mongoose.Types.ObjectId.isValid(id));
  }

  const comment = await Comment.create({
    task: task._id,
    project: project._id,
    author: req.user._id,
    text: trimmedText,
    mentions: validMentions,
  });

  // Log activity
  await logActivity({
    project: project._id,
    task: task._id,
    taskTitle: task.title,
    actor: req.user._id,
    action: 'COMMENT_ADDED',
    details: {
      commentId: comment._id,
      textSnippet: trimmedText.length > 50 ? `${trimmedText.substring(0, 50)}...` : trimmedText,
    },
    target: task.title,
  });

  // Populate author and mentions for return
  const populatedComment = await Comment.findById(comment._id)
    .populate('author', 'name email')
    .populate('mentions', 'name email')
    .lean();

  return sendSuccess(res, 201, populatedComment, 'Comment added successfully');
});

/**
 * Fetch task conversation comments thread
 * GET /api/tasks/:taskId/comments?order=asc|desc&page=1&limit=50
 * Access: Project Member
 */
export const getTaskComments = asyncHandler(async (req, res, next) => {
  const task = req.task;

  const order = req.query.order === 'desc' ? -1 : 1;
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
  const skip = (page - 1) * limit;

  const total = await Comment.countDocuments({ task: task._id });
  const comments = await Comment.find({ task: task._id })
    .sort({ createdAt: order })
    .skip(skip)
    .limit(limit)
    .populate('author', 'name email')
    .populate('mentions', 'name email')
    .lean();

  const pagination = {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit) || 1,
  };

  return sendSuccess(res, 200, comments, 'Comments retrieved successfully', pagination);
});

/**
 * Edit a comment
 * PUT /api/comments/:commentId
 * Access: Comment Author only
 */
export const updateComment = asyncHandler(async (req, res, next) => {
  const { commentId } = req.params;
  const { text, mentions } = req.body;

  if (!commentId || !mongoose.Types.ObjectId.isValid(commentId)) {
    return next(new ApiError(400, 'Invalid comment ID format'));
  }

  const comment = await Comment.findById(commentId);
  if (!comment) {
    return next(new ApiError(404, 'Comment not found'));
  }

  const userId = req.user._id.toString();
  if (comment.author.toString() !== userId) {
    return next(new ApiError(403, 'Access denied: You can only edit your own comments'));
  }

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return next(new ApiError(400, 'Comment text cannot be empty or whitespace only'));
  }

  const trimmedText = text.trim();
  if (trimmedText.length > 1000) {
    return next(new ApiError(400, 'Comment text cannot exceed 1000 characters'));
  }

  comment.text = trimmedText;
  comment.editedAt = new Date();

  if (Array.isArray(mentions)) {
    comment.mentions = mentions.filter((id) => mongoose.Types.ObjectId.isValid(id));
  }

  await comment.save();

  const updatedComment = await Comment.findById(comment._id)
    .populate('author', 'name email')
    .populate('mentions', 'name email')
    .lean();

  return sendSuccess(res, 200, updatedComment, 'Comment updated successfully');
});

/**
 * Delete a comment
 * DELETE /api/comments/:commentId
 * Access: Comment Author or Project Owner
 */
export const deleteComment = asyncHandler(async (req, res, next) => {
  const { commentId } = req.params;

  if (!commentId || !mongoose.Types.ObjectId.isValid(commentId)) {
    return next(new ApiError(400, 'Invalid comment ID format'));
  }

  const comment = await Comment.findById(commentId);
  if (!comment) {
    return next(new ApiError(404, 'Comment not found'));
  }

  const project = await Project.findById(comment.project);
  if (!project) {
    return next(new ApiError(404, 'Project associated with this comment not found'));
  }

  const userId = req.user._id.toString();
  const isAuthor = comment.author.toString() === userId;
  const isOwner = project.owner && project.owner.toString() === userId;

  if (!isAuthor && !isOwner) {
    return next(new ApiError(403, 'Access denied: Only comment author or project owner can delete this comment'));
  }

  const task = await Task.findById(comment.task);

  // Log activity
  await logActivity({
    project: comment.project,
    task: comment.task,
    taskTitle: task ? task.title : 'Task',
    actor: req.user._id,
    action: 'COMMENT_DELETED',
    details: {
      commentId: comment._id,
      deletedBy: isAuthor ? 'author' : 'owner',
    },
    target: task ? task.title : 'Task',
  });

  await Comment.findByIdAndDelete(commentId);

  return sendSuccess(res, 200, { deletedId: commentId }, 'Comment deleted successfully');
});

export default {
  createComment,
  getTaskComments,
  updateComment,
  deleteComment,
};
