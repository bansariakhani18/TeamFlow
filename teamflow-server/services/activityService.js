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
 * @param {string} [params.target] - Target entity label or description
 */
export const logActivity = async ({
  project,
  task = null,
  taskTitle = '',
  actor,
  action,
  details = {},
  target = '',
}) => {
  try {
    const finalTaskTitle = taskTitle || target || '';
    const finalTarget = target || taskTitle || '';

    const activity = await Activity.create({
      project,
      task,
      taskTitle: finalTaskTitle,
      actor,
      action,
      details,
      target: finalTarget,
      timestamp: new Date(),
    });
    return activity;
  } catch (error) {
    console.error('Failed to log activity:', error.message);
    return null;
  }
};

export default { logActivity };
