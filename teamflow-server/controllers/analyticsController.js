import mongoose from 'mongoose';
import Task from '../models/Task.js';
import Project from '../models/Project.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import { sendTaskReminderEmail } from '../services/emailService.js';

/**
 * Helper to normalize and match statuses
 */
const isDoneStatus = (status) => {
  if (!status) return false;
  const s = status.toString().trim().toLowerCase();
  return s === 'done';
};

const normalizeStatusKey = (status) => {
  if (!status) return 'todo';
  const s = status.toString().trim().toLowerCase();
  if (s === 'todo' || s === 'to do') return 'todo';
  if (s === 'in_progress' || s === 'in progress') return 'in_progress';
  if (s === 'review' || s === 'in review' || s === 'in_review') return 'review';
  if (s === 'done') return 'done';
  return 'todo';
};

const normalizePriorityKey = (priority) => {
  if (!priority) return 'medium';
  const p = priority.toString().trim().toLowerCase();
  if (p === 'low') return 'low';
  if (p === 'medium') return 'medium';
  if (p === 'high') return 'high';
  if (p === 'urgent') return 'urgent';
  return 'medium';
};

/**
 * Validate dateFrom and dateTo query parameters per SRS FR-DSH-04
 */
const validateDateFilter = (dateFrom, dateTo) => {
  let fromDate = null;
  let toDate = null;

  if (dateFrom) {
    fromDate = new Date(dateFrom);
    if (isNaN(fromDate.getTime())) {
      throw new ApiError(400, 'Invalid dateFrom format. Use a valid ISO date string.');
    }
  }

  if (dateTo) {
    toDate = new Date(dateTo);
    if (isNaN(toDate.getTime())) {
      throw new ApiError(400, 'Invalid dateTo format. Use a valid ISO date string.');
    }
  }

  if (fromDate && toDate && fromDate > toDate) {
    throw new ApiError(400, 'dateFrom cannot be later than dateTo.');
  }

  return { fromDate, toDate };
};

/**
 * @desc Get comprehensive project analytics (completion %, workload distribution, overdue count, velocity)
 * @route GET /api/projects/:projectId/analytics
 * @access Member
 */
export const getProjectAnalytics = asyncHandler(async (req, res, next) => {
  const { projectId } = req.params;
  const { dateFrom, dateTo, dueSoonDays } = req.query;

  const { fromDate, toDate } = validateDateFilter(dateFrom, dateTo);
  const now = new Date();
  const soonDays = parseInt(dueSoonDays, 10) || 3;
  const soonLimit = new Date(now.getTime() + soonDays * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Build task query
  const query = { project: new mongoose.Types.ObjectId(projectId) };
  if (fromDate || toDate) {
    query.dueDate = {};
    if (fromDate) query.dueDate.$gte = fromDate;
    if (toDate) query.dueDate.$lte = toDate;
  }

  // Fetch all tasks for this project
  const tasks = await Task.find(query)
    .populate('assignee', 'name email')
    .populate('assignedTo', 'name email')
    .lean();

  const totalTasks = tasks.length;
  let completedCount = 0;
  let overdueCount = 0;
  let dueSoonCount = 0;
  let velocityCount = 0;

  const byStatus = {
    todo: 0,
    in_progress: 0,
    review: 0,
    done: 0,
  };

  const byPriority = {
    low: 0,
    medium: 0,
    high: 0,
    urgent: 0,
  };

  const overdueTasks = [];
  const assignedMemberIds = new Set();

  tasks.forEach((task) => {
    const isDone = isDoneStatus(task.status);
    const statusKey = normalizeStatusKey(task.status);
    const priorityKey = normalizePriorityKey(task.priority);

    byStatus[statusKey] = (byStatus[statusKey] || 0) + 1;
    byPriority[priorityKey] = (byPriority[priorityKey] || 0) + 1;

    if (isDone) {
      completedCount += 1;
      // If completed in last 7 days, count towards velocity
      if (task.updatedAt && new Date(task.updatedAt) >= sevenDaysAgo) {
        velocityCount += 1;
      }
    } else {
      // Check overdue: dueDate < now && status !== 'Done'
      if (task.dueDate && new Date(task.dueDate) < now) {
        overdueCount += 1;
        const diffDays = Math.max(
          1,
          Math.floor((now.getTime() - new Date(task.dueDate).getTime()) / (1000 * 60 * 60 * 24))
        );
        overdueTasks.push({
          _id: task._id,
          title: task.title,
          priority: task.priority,
          status: task.status,
          dueDate: task.dueDate,
          daysOverdue: diffDays,
          assignee: task.assignee || task.assignedTo || null,
        });
      }

      // Check due soon: dueDate >= now && dueDate <= soonLimit
      if (task.dueDate && new Date(task.dueDate) >= now && new Date(task.dueDate) <= soonLimit) {
        dueSoonCount += 1;
      }
    }

    const assignee = task.assignee || task.assignedTo;
    if (assignee && assignee._id) {
      assignedMemberIds.add(assignee._id.toString());
    }
  });

  // Sort overdue tasks oldest due date first (SRS FR-DSH-03)
  overdueTasks.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  const completionRate =
    totalTasks > 0 ? parseFloat(((completedCount / totalTasks) * 100).toFixed(1)) : 0;

  // Workload Aggregation Pipeline per SRS FR-DSH-02 ($match, $group, $lookup)
  const workloadMatch = { project: new mongoose.Types.ObjectId(projectId) };
  if (fromDate || toDate) {
    workloadMatch.dueDate = {};
    if (fromDate) workloadMatch.dueDate.$gte = fromDate;
    if (toDate) workloadMatch.dueDate.$lte = toDate;
  }

  const rawWorkload = await Task.aggregate([
    { $match: workloadMatch },
    {
      $group: {
        _id: { $ifNull: ['$assignee', '$assignedTo'] },
        totalAssigned: { $sum: 1 },
        todo: {
          $sum: {
            $cond: [{ $in: ['$status', ['todo', 'To Do']] }, 1, 0],
          },
        },
        inProgress: {
          $sum: {
            $cond: [
              { $in: ['$status', ['in_progress', 'In Progress', 'review', 'In Review', 'reviewing']] },
              1,
              0,
            ],
          },
        },
        done: {
          $sum: {
            $cond: [{ $in: ['$status', ['done', 'Done']] }, 1, 0],
          },
        },
        overdue: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $ne: ['$dueDate', null] },
                  { $lt: ['$dueDate', now] },
                  { $not: { $in: ['$status', ['done', 'Done']] } },
                ],
              },
              1,
              0,
            ],
          },
        },
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user',
      },
    },
    {
      $unwind: {
        path: '$user',
        preserveNullAndEmptyArrays: true,
      },
    },
  ]);

  // Load full project with members to ensure all members appear in workload
  const project = await Project.findById(projectId).populate('members.user', 'name email').lean();
  const membersList = project?.members || [];

  const workloadMap = new Map();
  let unassignedBucket = {
    userId: null,
    name: 'Unassigned',
    email: null,
    totalAssigned: 0,
    todo: 0,
    inProgress: 0,
    done: 0,
    overdue: 0,
    percentage: 0,
  };

  rawWorkload.forEach((item) => {
    if (!item._id) {
      unassignedBucket.totalAssigned = item.totalAssigned || 0;
      unassignedBucket.todo = item.todo || 0;
      unassignedBucket.inProgress = item.inProgress || 0;
      unassignedBucket.done = item.done || 0;
      unassignedBucket.overdue = item.overdue || 0;
    } else {
      const uId = item._id.toString();
      workloadMap.set(uId, {
        userId: uId,
        name: item.user?.name || 'Member',
        email: item.user?.email || '',
        totalAssigned: item.totalAssigned || 0,
        todo: item.todo || 0,
        inProgress: item.inProgress || 0,
        done: item.done || 0,
        overdue: item.overdue || 0,
        percentage:
          totalTasks > 0 ? parseFloat(((item.totalAssigned / totalTasks) * 100).toFixed(1)) : 0,
      });
    }
  });

  const memberWorkloads = [];
  membersList.forEach((m) => {
    if (m.user && m.user._id) {
      const uId = m.user._id.toString();
      if (workloadMap.has(uId)) {
        memberWorkloads.push(workloadMap.get(uId));
        workloadMap.delete(uId);
      } else {
        memberWorkloads.push({
          userId: uId,
          name: m.user.name,
          email: m.user.email,
          totalAssigned: 0,
          todo: 0,
          inProgress: 0,
          done: 0,
          overdue: 0,
          percentage: 0,
        });
      }
    }
  });

  // Any remaining assigned users not in project.members list
  workloadMap.forEach((val) => {
    memberWorkloads.push(val);
  });

  // Calculate percentage for unassigned
  unassignedBucket.percentage =
    totalTasks > 0
      ? parseFloat(((unassignedBucket.totalAssigned / totalTasks) * 100).toFixed(1))
      : 0;

  // Add unassigned bucket if there are unassigned tasks
  if (unassignedBucket.totalAssigned > 0) {
    memberWorkloads.push(unassignedBucket);
  }

  // Active contributors count
  const activeContributors = assignedMemberIds.size;

  const resultData = {
    summary: {
      totalTasks,
      completedTasks: completedCount,
      completionRate,
      overdueTasksCount: overdueCount,
      dueSoonTasksCount: dueSoonCount,
      activeContributors,
      velocity: velocityCount,
      byStatus,
      byPriority,
    },
    workload: memberWorkloads,
    overdueTasks,
    statusDistribution: [
      { name: 'To Do', count: byStatus.todo, color: '#9CA3AF' },
      { name: 'In Progress', count: byStatus.in_progress, color: '#60A5FA' },
      { name: 'In Review', count: byStatus.review, color: '#FBBF24' },
      { name: 'Done', count: byStatus.done, color: '#34D399' },
    ],
    priorityDistribution: [
      { name: 'Low', count: byPriority.low, color: '#94A3B8' },
      { name: 'Medium', count: byPriority.medium, color: '#FCD34D' },
      { name: 'High', count: byPriority.high, color: '#F87171' },
      { name: 'Urgent', count: byPriority.urgent, color: '#EF4444' },
    ],
    project: {
      _id: project?._id,
      name: project?.name,
      description: project?.description,
      owner: project?.owner,
    },
  };

  return sendSuccess(res, 200, resultData, 'Project analytics retrieved successfully');
});

/**
 * @desc Get project workload distribution
 * @route GET /api/projects/:projectId/dashboard/workload
 * @access Member
 */
export const getProjectWorkload = asyncHandler(async (req, res, next) => {
  const { projectId } = req.params;
  const { dateFrom, dateTo } = req.query;

  const { fromDate, toDate } = validateDateFilter(dateFrom, dateTo);
  const now = new Date();

  const workloadMatch = { project: new mongoose.Types.ObjectId(projectId) };
  if (fromDate || toDate) {
    workloadMatch.dueDate = {};
    if (fromDate) workloadMatch.dueDate.$gte = fromDate;
    if (toDate) workloadMatch.dueDate.$lte = toDate;
  }

  const rawWorkload = await Task.aggregate([
    { $match: workloadMatch },
    {
      $group: {
        _id: { $ifNull: ['$assignee', '$assignedTo'] },
        totalAssigned: { $sum: 1 },
        todo: {
          $sum: { $cond: [{ $in: ['$status', ['todo', 'To Do']] }, 1, 0] },
        },
        inProgress: {
          $sum: {
            $cond: [
              { $in: ['$status', ['in_progress', 'In Progress', 'review', 'In Review']] },
              1,
              0,
            ],
          },
        },
        done: {
          $sum: { $cond: [{ $in: ['$status', ['done', 'Done']] }, 1, 0] },
        },
        overdue: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $ne: ['$dueDate', null] },
                  { $lt: ['$dueDate', now] },
                  { $not: { $in: ['$status', ['done', 'Done']] } },
                ],
              },
              1,
              0,
            ],
          },
        },
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user',
      },
    },
    {
      $unwind: {
        path: '$user',
        preserveNullAndEmptyArrays: true,
      },
    },
  ]);

  const project = await Project.findById(projectId).populate('members.user', 'name email').lean();
  const membersList = project?.members || [];

  const workloadMap = new Map();
  let unassignedBucket = {
    userId: null,
    name: 'Unassigned',
    email: null,
    assigned: 0,
    toDo: 0,
    inProgress: 0,
    done: 0,
    overdue: 0,
  };

  rawWorkload.forEach((item) => {
    if (!item._id) {
      unassignedBucket.assigned = item.totalAssigned || 0;
      unassignedBucket.toDo = item.todo || 0;
      unassignedBucket.inProgress = item.inProgress || 0;
      unassignedBucket.done = item.done || 0;
      unassignedBucket.overdue = item.overdue || 0;
    } else {
      const uId = item._id.toString();
      workloadMap.set(uId, {
        userId: uId,
        name: item.user?.name || 'Member',
        email: item.user?.email || '',
        assigned: item.totalAssigned || 0,
        toDo: item.todo || 0,
        inProgress: item.inProgress || 0,
        done: item.done || 0,
        overdue: item.overdue || 0,
      });
    }
  });

  const memberWorkloads = [];
  membersList.forEach((m) => {
    if (m.user && m.user._id) {
      const uId = m.user._id.toString();
      if (workloadMap.has(uId)) {
        memberWorkloads.push(workloadMap.get(uId));
        workloadMap.delete(uId);
      } else {
        memberWorkloads.push({
          userId: uId,
          name: m.user.name,
          email: m.user.email,
          assigned: 0,
          toDo: 0,
          inProgress: 0,
          done: 0,
          overdue: 0,
        });
      }
    }
  });

  workloadMap.forEach((val) => memberWorkloads.push(val));
  memberWorkloads.push(unassignedBucket);

  return sendSuccess(res, 200, memberWorkloads, 'Workload data retrieved successfully');
});

/**
 * @desc Get overdue tasks for a project
 * @route GET /api/projects/:projectId/dashboard/overdue
 * @access Member
 */
export const getProjectOverdueTasks = asyncHandler(async (req, res, next) => {
  const { projectId } = req.params;
  const now = new Date();

  const overdueTasks = await Task.find({
    project: projectId,
    dueDate: { $lt: now, $ne: null },
    status: { $nin: ['done', 'Done'] },
  })
    .populate('assignee', 'name email')
    .populate('assignedTo', 'name email')
    .sort({ dueDate: 1 })
    .lean();

  const formatted = overdueTasks.map((t) => {
    const diffDays = Math.max(
      1,
      Math.floor((now.getTime() - new Date(t.dueDate).getTime()) / (1000 * 60 * 60 * 24))
    );
    return {
      _id: t._id,
      title: t.title,
      priority: t.priority,
      status: t.status,
      dueDate: t.dueDate,
      daysOverdue: diffDays,
      assignee: t.assignee || t.assignedTo || null,
    };
  });

  return sendSuccess(res, 200, formatted, 'Overdue tasks retrieved successfully');
});

/**
 * @desc Export project tasks as CSV report
 * @route GET /api/projects/:projectId/export/csv
 * @access Member
 */
export const exportProjectTasksCSV = asyncHandler(async (req, res, next) => {
  const { projectId } = req.params;

  const project = await Project.findById(projectId).lean();
  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  const tasks = await Task.find({ project: projectId })
    .populate('assignee', 'name email')
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 })
    .lean();

  // Escape helper for CSV cells
  const escapeCsv = (str) => {
    if (str === null || str === undefined) return '""';
    const cleanStr = String(str).replace(/"/g, '""');
    return `"${cleanStr}"`;
  };

  const headers = [
    'Task ID',
    'Title',
    'Description',
    'Status',
    'Priority',
    'Due Date',
    'Assignee Name',
    'Assignee Email',
    'Created By',
    'Created At',
    'Updated At',
  ];

  const rows = tasks.map((task) => {
    const assignee = task.assignee || task.assignedTo || {};
    const createdBy = task.createdBy || {};
    const dueDateStr = task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '';
    const createdAtStr = task.createdAt ? new Date(task.createdAt).toISOString() : '';
    const updatedAtStr = task.updatedAt ? new Date(task.updatedAt).toISOString() : '';

    return [
      escapeCsv(task._id),
      escapeCsv(task.title),
      escapeCsv(task.description || ''),
      escapeCsv(task.status),
      escapeCsv(task.priority),
      escapeCsv(dueDateStr),
      escapeCsv(assignee.name || 'Unassigned'),
      escapeCsv(assignee.email || ''),
      escapeCsv(createdBy.name || ''),
      escapeCsv(createdAtStr),
      escapeCsv(updatedAtStr),
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\r\n');

  const safeProjectName = (project.name || 'project')
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_');
  const filename = `${safeProjectName}_tasks_report_${new Date().toISOString().slice(0, 10)}.csv`;

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  return res.status(200).send(csvContent);
});

/**
 * @desc Send task reminder email (Owner only)
 * @route POST /api/tasks/:taskId/remind
 * @access Owner
 */
export const sendTaskReminder = asyncHandler(async (req, res, next) => {
  const taskId = req.params.taskId || req.params.id;

  const task = await Task.findById(taskId)
    .populate('assignee', 'name email')
    .populate('assignedTo', 'name email');

  if (!task) {
    throw new ApiError(404, 'Task not found');
  }

  // Check project ownership
  const project = await Project.findById(task.project);
  if (!project) {
    throw new ApiError(404, 'Workspace not found');
  }

  const callerId = req.user._id ? req.user._id.toString() : req.user.id.toString();
  const ownerId = project.owner._id ? project.owner._id.toString() : project.owner.toString();

  if (callerId !== ownerId) {
    throw new ApiError(403, 'Only the project owner can send task reminders');
  }

  const targetAssignee = task.assignee || task.assignedTo;
  if (!targetAssignee) {
    throw new ApiError(400, 'Cannot send reminder for an unassigned task');
  }

  if (isDoneStatus(task.status)) {
    throw new ApiError(400, 'Cannot send reminder for a completed task');
  }

  // Send reminder email (throws 502 if Resend fails)
  const notification = await sendTaskReminderEmail(task, targetAssignee, req.user);

  return sendSuccess(res, 200, notification, 'Reminder email sent successfully');
});

/**
 * @desc Get email notification history log for a project (Owner only)
 * @route GET /api/projects/:projectId/notifications
 * @access Owner
 */
export const getProjectNotifications = asyncHandler(async (req, res, next) => {
  const { projectId } = req.params;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
  const skip = (page - 1) * limit;

  const total = await Notification.countDocuments({ project: projectId });

  const notifications = await Notification.find({ project: projectId })
    .populate('recipient', 'name email')
    .populate('triggeredBy', 'name email')
    .populate('task', 'title priority status')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const pagination = {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit) || 1,
  };

  return sendSuccess(res, 200, notifications, 'Notifications retrieved successfully', pagination);
});

/**
 * @desc Get personal dashboard summary across all projects for current user
 * @route GET /api/dashboard/me
 * @access Auth
 */
export const getMyDashboard = asyncHandler(async (req, res, next) => {
  const userId = req.user._id || req.user.id;
  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Find all projects where user is a member or owner
  const userProjects = await Project.find({
    $or: [{ 'members.user': userId }, { owner: userId }],
  }).select('_id name');

  const projectIds = userProjects.map((p) => p._id);

  // Find all tasks assigned to the current user in these projects
  const assignedTasks = await Task.find({
    project: { $in: projectIds },
    $or: [{ assignee: userId }, { assignedTo: userId }],
  })
    .populate('project', 'name')
    .sort({ dueDate: 1 })
    .lean();

  let completedCount = 0;
  let overdueCount = 0;
  let dueSoonCount = 0;

  const overdueList = [];
  const dueSoonList = [];

  assignedTasks.forEach((t) => {
    const isDone = isDoneStatus(t.status);
    if (isDone) {
      completedCount += 1;
    } else {
      if (t.dueDate && new Date(t.dueDate) < now) {
        overdueCount += 1;
        overdueList.push(t);
      } else if (t.dueDate && new Date(t.dueDate) >= now && new Date(t.dueDate) <= sevenDaysFromNow) {
        dueSoonCount += 1;
        dueSoonList.push(t);
      }
    }
  });

  const data = {
    totalAssigned: assignedTasks.length,
    completedTasks: completedCount,
    overdueTasks: overdueCount,
    dueSoonTasks: dueSoonCount,
    completionRate:
      assignedTasks.length > 0
        ? parseFloat(((completedCount / assignedTasks.length) * 100).toFixed(1))
        : 0,
    overdueList: overdueList.slice(0, 5),
    dueSoonList: dueSoonList.slice(0, 5),
    recentTasks: assignedTasks.slice(0, 5),
  };

  return sendSuccess(res, 200, data, 'Personal dashboard data retrieved successfully');
});

export default {
  getProjectAnalytics,
  getProjectWorkload,
  getProjectOverdueTasks,
  exportProjectTasksCSV,
  sendTaskReminder,
  getProjectNotifications,
  getMyDashboard,
};
