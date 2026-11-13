import express from 'express';
import {
  getProjectAnalytics,
  exportProjectTasksCSV,
  getProjectWorkload,
  getProjectOverdueTasks,
  getProjectNotifications,
} from '../controllers/analyticsController.js';
import { protect } from '../middleware/protect.js';
import { checkProjectMember, checkProjectOwner } from '../middleware/projectAccess.js';

const router = express.Router();

// Apply authentication middleware
router.use(protect);

/**
 * @route GET /api/projects/:projectId/analytics
 * @desc Calculate task completion %, workload distribution per member, overdue count per SRS FR-4.1
 * @access Member
 */
router.get('/:projectId/analytics', checkProjectMember, getProjectAnalytics);

/**
 * @route GET /api/projects/:projectId/export/csv
 * @desc Generate & download project tasks summary CSV report per SRS FR-4.2
 * @access Member
 */
router.get('/:projectId/export/csv', checkProjectMember, exportProjectTasksCSV);

/**
 * @route GET /api/projects/:projectId/dashboard/summary
 * @desc Alias for project analytics summary
 * @access Member
 */
router.get('/:projectId/dashboard/summary', checkProjectMember, getProjectAnalytics);

/**
 * @route GET /api/projects/:projectId/dashboard/workload
 * @desc Workload breakdown per member
 * @access Member
 */
router.get('/:projectId/dashboard/workload', checkProjectMember, getProjectWorkload);

/**
 * @route GET /api/projects/:projectId/dashboard/overdue
 * @desc Overdue tasks for the project
 * @access Member
 */
router.get('/:projectId/dashboard/overdue', checkProjectMember, getProjectOverdueTasks);

/**
 * @route GET /api/projects/:projectId/notifications
 * @desc Project notification history log
 * @access Owner
 */
router.get('/:projectId/notifications', checkProjectOwner, getProjectNotifications);

export default router;
