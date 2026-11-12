import mongoose from 'mongoose';
import Task, { TASK_STATUSES, TASK_PRIORITIES } from '../models/Task.js';
import Project from '../models/Project.js';
import User from '../models/User.js';
import Comment from '../models/Comment.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import { logActivity } from '../services/activityService.js';

// Status transition matrix
const ALLOWED_TRANSITIONS = {
  todo: ['in_progress', 'In Progress'],
  'To Do': ['in_progress', 'In Progress'],
  in_progress: ['review', 'In Review', 'done', 'Done', 'todo', 'To Do'],
  'In Progress': ['review', 'In Review', 'done', 'Done', 'todo', 'To Do'],
  review: ['done', 'Done', 'in_progress', 'In Progress'],
  'In Review': ['done', 'Done', 'in_progress', 'In Progress'],
  done: ['review', 'In Review', 'in_progress', 'In Progress'],
  'Done': ['review', 'In Review', 'in_progress', 'In Progress'],
};

// Normalization helpers
const normalizeStatus = (status) => {
  if (!status) return status;
  const s = status.trim().toLowerCase();
  if (s === 'todo' || s === 'to do') return 'todo';
  if (s === 'in_progress' || s === 'in progress') return 'in_progress';
  if (s === 'review' || s === 'in review' || s === 'in_review') return 'review';
  if (s === 'done') return 'done';
  return status;
};

const normalizePriority = (priority) => {
  if (!priority) return priority;
  const p = priority.trim().toLowerCase();
  if (['low', 'medium', 'high', 'urgent'].includes(p)) return p;
  return priority;
};

/**
 * Check if a user is a member of a project
 */
const isUserProjectMember = (project, userId) => {
  if (!project || !userId) return false;
  const uid = userId.toString();
  const isOwner = project.owner && project.owner.toString() === uid;
  const isMember = project.members && project.members.some(
    (m) => (m.user ? m.user.toString() : m.toString()) === uid
  );
  return isOwner || isMember;
};

/**
 * @desc Create a new task in a project
 * @route POST /api/projects/:projectId/tasks
 * @access Member
 */
export const createTask = asyncHandler(async (req, res, next) => {
  const projectId = req.params.projectId || req.params.id;
  const { title, description, status, priority, dueDate, assignedTo, assignee, order } = req.body;

  if (!title || typeof title !== 'string' || title.trim().length < 3 || title.trim().length > 100) {
    return next(new ApiError(400, 'Title must be between 3 and 100 characters'));
  }

  if (description && description.length > 1000) {
    return next(new ApiError(400, 'Description cannot exceed 1000 characters'));
  }

  // Load project to verify membership
  const project = req.project || await Project.findById(projectId);
  if (!project) {
    return next(new ApiError(404, 'Project not found'));
  }

  const callerId = req.user._id ? req.user._id.toString() : req.user.id?.toString();
  if (!isUserProjectMember(project, callerId)) {
    return next(new ApiError(403, 'Access denied: You are not a member of this project'));
  }

  const targetAssignee = assignedTo || assignee || null;
  if (targetAssignee) {
    if (!mongoose.Types.ObjectId.isValid(targetAssignee)) {
      return next(new ApiError(400, 'Invalid assignee ID format'));
    }
    if (!isUserProjectMember(project, targetAssignee)) {
      return next(new ApiError(400, 'Assignee must be a member of this project'));
    }
  }

  const task = await Task.create({
    project: project._id,
    title: title.trim(),
    description: description ? description.trim() : '',
    status: status || 'todo',
    priority: priority || 'medium',
    dueDate: dueDate ? new Date(dueDate) : null,
    assignedTo: targetAssignee,
    assignee: targetAssignee,
    createdBy: req.user._id || req.user.id,
    order: typeof order === 'number' ? order : 0,
  });

  // Log activity
  await logActivity({
    project: project._id,
    task: task._id,
    taskTitle: task.title,
    actor: req.user._id || req.user.id,
    action: 'TASK_CREATED',
    details: { title: task.title, status: task.status, priority: task.priority },
  });

  if (targetAssignee) {
    await logActivity({
      project: project._id,
      task: task._id,
      taskTitle: task.title,
      actor: req.user._id || req.user.id,
      action: 'TASK_ASSIGNED',
      details: { assignedTo: targetAssignee },
    });
    // TODO(M4): sendTaskAssignedEmail(task, targetAssignee, req.user)
  }

  const populatedTask = await Task.findById(task._id)
    .populate('assignedTo', 'name email')
    .populate('assignee', 'name email')
    .populate('createdBy', 'name email');

  return sendSuccess(res, 201, populatedTask, 'Task created successfully');
});

/**
 * @desc Get all tasks for a project with filtering & pagination
 * @route GET /api/projects/:projectId/tasks
 * @access Member
 */
export const getProjectTasks = asyncHandler(async (req, res, next) => {
  const projectId = req.params.projectId || req.params.id;

  const project = req.project || await Project.findById(projectId);
  if (!project) {
    return next(new ApiError(404, 'Project not found'));
  }

  const callerId = req.user._id ? req.user._id.toString() : req.user.id?.toString();
  if (!isUserProjectMember(project, callerId)) {
    return next(new ApiError(403, 'Access denied: You are not a member of this project'));
  }

  const query = { project: project._id };

  // Status filter
  if (req.query.status) {
    const s = req.query.status;
    query.status = { $in: [s, s.toLowerCase(), s.replace('_', ' ')] };
  }

  // Priority filter
  if (req.query.priority) {
    const p = req.query.priority;
    query.priority = { $in: [p, p.toLowerCase(), p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()] };
  }

  // Assignee filter ('me' shortcut supported)
  const assigneeParam = req.query.assignee || req.query.assignedTo;
  if (assigneeParam) {
    if (assigneeParam === 'me') {
      query.$or = [{ assignedTo: callerId }, { assignee: callerId }];
    } else if (assigneeParam === 'unassigned') {
      query.$or = [{ assignedTo: null }, { assignee: null }];
    } else if (mongoose.Types.ObjectId.isValid(assigneeParam)) {
      query.$or = [{ assignedTo: assigneeParam }, { assignee: assigneeParam }];
    }
  }

  // Date range filter
  if (req.query.dueFrom || req.query.dueTo) {
    query.dueDate = {};
    if (req.query.dueFrom) {
      const from = new Date(req.query.dueFrom);
      if (!isNaN(from)) query.dueDate.$gte = from;
    }
    if (req.query.dueTo) {
      const to = new Date(req.query.dueTo);
      if (!isNaN(to)) query.dueDate.$lte = to;
    }
  }

  // Overdue filter
  if (req.query.overdue === 'true') {
    query.dueDate = { $lt: new Date() };
    query.status = { $nin: ['done', 'Done'] };
  }

  // Search filter
  if (req.query.search) {
    query.title = { $regex: req.query.search.trim(), $options: 'i' };
  }

  // Sorting
  const sortParam = req.query.sort || 'order createdAt';
  let sortOption = {};
  if (sortParam === 'priority' || sortParam === '-priority') {
    // Priority order fallback
    sortOption = { priority: sortParam.startsWith('-') ? -1 : 1, createdAt: -1 };
  } else if (sortParam.includes('dueDate')) {
    sortOption = { dueDate: sortParam.startsWith('-') ? -1 : 1 };
  } else if (sortParam.includes('createdAt')) {
    sortOption = { createdAt: sortParam.startsWith('-') ? -1 : 1 };
  } else {
    sortOption = { order: 1, createdAt: -1 };
  }

  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 100, 100);
  const skip = (page - 1) * limit;

  const total = await Task.countDocuments(query);
  const tasks = await Task.find(query)
    .populate('assignedTo', 'name email')
    .populate('assignee', 'name email')
    .populate('createdBy', 'name email')
    .sort(sortOption)
    .skip(skip)
    .limit(limit);

  return sendSuccess(res, 200, tasks, 'Tasks retrieved successfully', {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit) || 1,
  });
});

/**
 * @desc Get a single task by ID
 * @route GET /api/tasks/:id
 * @access Member
 */
export const getTaskById = asyncHandler(async (req, res, next) => {
  const taskId = req.params.id || req.params.taskId;

  if (!taskId || !mongoose.Types.ObjectId.isValid(taskId)) {
    return next(new ApiError(400, 'Invalid task ID format'));
  }

  const task = await Task.findById(taskId)
    .populate('assignedTo', 'name email')
    .populate('assignee', 'name email')
    .populate('createdBy', 'name email')
    .populate('project', 'name owner members');

  if (!task) {
    return next(new ApiError(404, 'Task not found'));
  }

  const callerId = req.user._id ? req.user._id.toString() : req.user.id?.toString();
  if (task.project && !isUserProjectMember(task.project, callerId)) {
    return next(new ApiError(403, 'Access denied: You are not a member of this project'));
  }

  return sendSuccess(res, 200, task, 'Task details retrieved successfully');
});

/**
 * @desc Update task editable fields
 * @route PUT /api/tasks/:id
 * @access Member
 */
export const updateTask = asyncHandler(async (req, res, next) => {
  const taskId = req.params.id || req.params.taskId;
  const { title, description, priority, dueDate, assignedTo, assignee, order, status } = req.body;

  if (!taskId || !mongoose.Types.ObjectId.isValid(taskId)) {
    return next(new ApiError(400, 'Invalid task ID format'));
  }

  const task = await Task.findById(taskId);
  if (!task) {
    return next(new ApiError(404, 'Task not found'));
  }

  const project = await Project.findById(task.project);
  if (!project) {
    return next(new ApiError(404, 'Project not found'));
  }

  const callerId = req.user._id ? req.user._id.toString() : req.user.id?.toString();
  if (!isUserProjectMember(project, callerId)) {
    return next(new ApiError(403, 'Access denied: You are not a member of this project'));
  }

  if (title !== undefined) {
    if (typeof title !== 'string' || title.trim().length < 3 || title.trim().length > 100) {
      return next(new ApiError(400, 'Title must be between 3 and 100 characters'));
    }
    task.title = title.trim();
  }

  if (description !== undefined) {
    if (description && description.length > 1000) {
      return next(new ApiError(400, 'Description cannot exceed 1000 characters'));
    }
    task.description = description ? description.trim() : '';
  }

  if (priority !== undefined) {
    task.priority = priority;
  }

  if (dueDate !== undefined) {
    task.dueDate = dueDate ? new Date(dueDate) : null;
  }

  if (order !== undefined && typeof order === 'number') {
    task.order = order;
  }

  if (status !== undefined) {
    task.status = status;
  }

  // Handle assignee change
  const newAssignee = assignedTo !== undefined ? assignedTo : assignee;
  if (newAssignee !== undefined) {
    if (newAssignee && newAssignee !== null) {
      if (!mongoose.Types.ObjectId.isValid(newAssignee)) {
        return next(new ApiError(400, 'Invalid assignee ID format'));
      }
      if (!isUserProjectMember(project, newAssignee)) {
        return next(new ApiError(400, 'Assignee must be a member of this project'));
      }
    }
    const prevAssignee = task.assignedTo ? task.assignedTo.toString() : null;
    task.assignedTo = newAssignee;
    task.assignee = newAssignee;

    if (newAssignee && newAssignee.toString() !== prevAssignee) {
      await logActivity({
        project: project._id,
        task: task._id,
        taskTitle: task.title,
        actor: callerId,
        action: 'TASK_ASSIGNED',
        details: { from: prevAssignee, to: newAssignee },
      });
      // TODO(M4): sendTaskAssignedEmail(task, newAssignee, req.user)
    }
  }

  await task.save();

  await logActivity({
    project: project._id,
    task: task._id,
    taskTitle: task.title,
    actor: callerId,
    action: 'TASK_UPDATED',
    details: { title: task.title, priority: task.priority },
  });

  const updatedTask = await Task.findById(task._id)
    .populate('assignedTo', 'name email')
    .populate('assignee', 'name email')
    .populate('createdBy', 'name email');

  return sendSuccess(res, 200, updatedTask, 'Task updated successfully');
});

/**
 * @desc Move task / update status column
 * @route PATCH /api/tasks/:id/status
 * @access Member
 */
export const updateTaskStatus = asyncHandler(async (req, res, next) => {
  const taskId = req.params.id || req.params.taskId;
  const { status } = req.body;

  if (!status) {
    return next(new ApiError(400, 'Status is required'));
  }

  if (!taskId || !mongoose.Types.ObjectId.isValid(taskId)) {
    return next(new ApiError(400, 'Invalid task ID format'));
  }

  const task = await Task.findById(taskId);
  if (!task) {
    return next(new ApiError(404, 'Task not found'));
  }

  const project = await Project.findById(task.project);
  if (!project) {
    return next(new ApiError(404, 'Project not found'));
  }

  const callerId = req.user._id ? req.user._id.toString() : req.user.id?.toString();
  if (!isUserProjectMember(project, callerId)) {
    return next(new ApiError(403, 'Access denied: You are not a member of this project'));
  }

  const currentStatusNorm = normalizeStatus(task.status);
  const targetStatusNorm = normalizeStatus(status);

  // Check if trying to transition to the exact same status
  if (currentStatusNorm === targetStatusNorm) {
    return next(new ApiError(400, `Task is already in "${task.status}" status`));
  }

  // Check allowed transitions
  const allowed = ALLOWED_TRANSITIONS[task.status] || ALLOWED_TRANSITIONS[currentStatusNorm];
  const isTransitionAllowed = allowed && (allowed.includes(status) || allowed.includes(targetStatusNorm));

  if (!isTransitionAllowed) {
    return next(
      new ApiError(
        400,
        `Invalid status transition from "${task.status}" to "${status}". Allowed transitions: ${
          allowed ? allowed.join(', ') : 'None'
        }`
      )
    );
  }

  const previousStatus = task.status;
  task.status = status;
  await task.save();

  // Log status change activity
  await logActivity({
    project: project._id,
    task: task._id,
    taskTitle: task.title,
    actor: callerId,
    action: 'STATUS_CHANGED',
    details: { from: previousStatus, to: status },
  });

  const updatedTask = await Task.findById(task._id)
    .populate('assignedTo', 'name email')
    .populate('assignee', 'name email')
    .populate('createdBy', 'name email');

  return sendSuccess(res, 200, updatedTask, 'Task status updated successfully');
});

/**
 * @desc Update task assignee
 * @route PATCH /api/tasks/:id/assignee
 * @access Member
 */
export const updateTaskAssignee = asyncHandler(async (req, res, next) => {
  const taskId = req.params.id || req.params.taskId;
  const { assignee, assignedTo } = req.body;

  if (!taskId || !mongoose.Types.ObjectId.isValid(taskId)) {
    return next(new ApiError(400, 'Invalid task ID format'));
  }

  const task = await Task.findById(taskId);
  if (!task) {
    return next(new ApiError(404, 'Task not found'));
  }

  const project = await Project.findById(task.project);
  if (!project) {
    return next(new ApiError(404, 'Project not found'));
  }

  const callerId = req.user._id ? req.user._id.toString() : req.user.id?.toString();
  if (!isUserProjectMember(project, callerId)) {
    return next(new ApiError(403, 'Access denied: You are not a member of this project'));
  }

  const newAssigneeId = assignee !== undefined ? assignee : assignedTo;

  if (newAssigneeId && newAssigneeId !== null) {
    if (!mongoose.Types.ObjectId.isValid(newAssigneeId)) {
      return next(new ApiError(400, 'Invalid assignee ID format'));
    }
    if (!isUserProjectMember(project, newAssigneeId)) {
      return next(new ApiError(400, 'Assignee must be a member of this project'));
    }
  }

  const prevAssignee = task.assignedTo ? task.assignedTo.toString() : null;
  task.assignedTo = newAssigneeId || null;
  task.assignee = newAssigneeId || null;
  await task.save();

  await logActivity({
    project: project._id,
    task: task._id,
    taskTitle: task.title,
    actor: callerId,
    action: 'TASK_ASSIGNED',
    details: { from: prevAssignee, to: newAssigneeId },
  });

  // TODO(M4): sendTaskAssignedEmail(task, newAssigneeId, req.user)

  const updatedTask = await Task.findById(task._id)
    .populate('assignedTo', 'name email')
    .populate('assignee', 'name email')
    .populate('createdBy', 'name email');

  return sendSuccess(res, 200, updatedTask, 'Task assignee updated successfully');
});

/**
 * @desc Delete a task
 * @route DELETE /api/tasks/:id
 * @access Owner or Creator
 */
export const deleteTask = asyncHandler(async (req, res, next) => {
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
    return next(new ApiError(404, 'Project not found'));
  }

  const callerId = req.user._id ? req.user._id.toString() : req.user.id?.toString();
  const isOwner = project.owner && project.owner.toString() === callerId;
  const isCreator = task.createdBy && task.createdBy.toString() === callerId;

  if (!isOwner && !isCreator) {
    return next(new ApiError(403, 'Access denied: Only project owner or task creator can delete this task'));
  }

  const taskTitle = task.title;
  await Task.findByIdAndDelete(taskId);
  await Comment.deleteMany({ task: taskId });

  await logActivity({
    project: project._id,
    task: null,
    taskTitle,
    actor: callerId,
    action: 'TASK_DELETED',
    details: { taskId },
  });

  return sendSuccess(res, 200, { deletedId: taskId }, 'Task deleted successfully');
});

export default {
  createTask,
  getProjectTasks,
  getTaskById,
  updateTask,
  updateTaskStatus,
  updateTaskAssignee,
  deleteTask,
};

