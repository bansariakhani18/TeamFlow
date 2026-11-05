import Activity from '../models/Activity.js';

/**
 * Log activity for projects and tasks
 * @param {Object} params - Activity parameters
 * @param {string} params.project - Project ID
 * @param {string} [params.task] - Optional Task ID
 * @param {string} [params.taskTitle] - Optional Task Title
 * @param {string} params.actor - User ID of actor
 * @param {string} params.action - Activity action enum
 * @param {Object} [params.details] - Details payload
 */
export const logActivity = async ({ project, task = null, taskTitle = '', actor, action, details = {} }) => {
  try {
    const activity = await Activity.create({
      project,
      task,
      taskTitle,
      actor,
      action,
      details,
    });
    return activity;
  } catch (error) {
    console.error('Failed to log activity:', error.message);
    return null;
  }
};

export default { logActivity };

