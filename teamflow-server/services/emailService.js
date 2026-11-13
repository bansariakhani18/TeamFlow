import Notification from '../models/Notification.js';
import User from '../models/User.js';
import Project from '../models/Project.js';
import ApiError from '../utils/ApiError.js';

/**
 * Helper to dispatch email via Resend Web API
 */
const sendViaResend = async ({ to, subject, html }) => {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || 'onboarding@resend.dev';

  if (!apiKey || apiKey === 're_123456789') {
    // If invalid placeholder or missing, attempt request or fail gracefully
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.message || `Resend API returned status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data; // { id: '...' }
};

/**
 * Send task assignment notification email
 * SRS FR-DSH-06: Task assigned email
 */
export const sendTaskAssignedEmail = async (task, assignee, triggeredBy) => {
  try {
    // Resolve assignee
    let recipientUser = assignee;
    if (!recipientUser || !recipientUser.email) {
      recipientUser = await User.findById(assignee._id || assignee).lean();
    }
    if (!recipientUser || !recipientUser.email) {
      return { status: 'failed', error: 'Assignee user or email not found' };
    }

    // Resolve project
    let project = task.project;
    if (!project || typeof project === 'string' || project._id) {
      const projId = project?._id || project;
      project = await Project.findById(projId).lean();
    }
    const projectName = project?.name || 'TeamFlow Project';
    const projectId = project?._id?.toString() || task.project?.toString();
    const taskId = task._id?.toString();

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const serverPublicUrl = process.env.SERVER_PUBLIC_URL || 'http://localhost:5000';
    const taskLink = `${clientUrl}/projects/${projectId}/board`;
    const logoUrl = `${serverPublicUrl}/public/logo.png`;

    const formattedDueDate = task.dueDate
      ? new Date(task.dueDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
      : 'No due date set';

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F4F3EF; padding: 32px 16px;">
        <div style="max-width: 560px; margin: 0 auto; background-color: #FFFFFF; border-radius: 16px; border: 1px solid #E5E7EB; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <div style="background-color: #4E8765; padding: 24px; text-align: center;">
            <img src="${logoUrl}" alt="TeamFlow Logo" style="height: 36px; width: auto; margin-bottom: 8px;" onerror="this.style.display='none'" />
            <h1 style="color: #FFFFFF; font-size: 20px; margin: 0; font-weight: 700;">New Task Assigned</h1>
          </div>
          <div style="padding: 32px 24px; color: #1F2937;">
            <p style="font-size: 15px; margin-top: 0;">Hello <strong>${recipientUser.name || 'Teammate'}</strong>,</p>
            <p style="font-size: 14px; color: #4B5563; line-height: 1.5;">You have been assigned a new task in workspace <strong>${projectName}</strong>.</p>
            
            <div style="background-color: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 12px; padding: 18px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #111827; font-size: 16px;">${task.title}</h3>
              <p style="margin: 0 0 8px 0; font-size: 13px; color: #6B7280;"><strong>Priority:</strong> <span style="text-transform: capitalize;">${task.priority || 'Medium'}</span></p>
              <p style="margin: 0; font-size: 13px; color: #6B7280;"><strong>Due Date:</strong> ${formattedDueDate}</p>
            </div>

            <div style="text-align: center; margin-top: 28px;">
              <a href="${taskLink}" style="background-color: #4E8765; color: #FFFFFF; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-weight: 600; font-size: 14px; display: inline-block;">View Task in Workspace</a>
            </div>
          </div>
          <div style="background-color: #F9FAFB; padding: 16px; text-align: center; border-top: 1px solid #E5E7EB; font-size: 12px; color: #9CA3AF;">
            TeamFlow &bull; Collaborative Task Management
          </div>
        </div>
      </div>
    `;

    const subject = `[TeamFlow] Task Assigned: ${task.title}`;

    let status = 'sent';
    let providerMessageId = '';
    let errorMessage = '';

    try {
      const resendRes = await sendViaResend({
        to: recipientUser.email,
        subject,
        html,
      });
      providerMessageId = resendRes.id || 'simulated_id';
    } catch (err) {
      status = 'failed';
      errorMessage = err.message || 'Failed to dispatch email';
    }

    // Always record Notification per SRS §6.6
    await Notification.create({
      project: projectId,
      task: taskId,
      recipient: recipientUser._id,
      triggeredBy: triggeredBy?._id || triggeredBy,
      type: 'TASK_ASSIGNED',
      status,
      providerMessageId,
      error: errorMessage,
    });

    return { status, providerMessageId, error: errorMessage };
  } catch (outerErr) {
    // Never abort the primary task operation on email failure
    console.error('sendTaskAssignedEmail error:', outerErr);
    return { status: 'failed', error: outerErr.message };
  }
};

/**
 * Send manual reminder email for a task
 * SRS FR-DSH-07: Owner manual reminder
 */
export const sendTaskReminderEmail = async (task, assignee, triggeredBy) => {
  // Resolve assignee
  let recipientUser = assignee;
  if (!recipientUser || !recipientUser.email) {
    recipientUser = await User.findById(assignee._id || assignee).lean();
  }
  if (!recipientUser || !recipientUser.email) {
    throw new ApiError(400, 'Assigned user does not have a valid email');
  }

  // Resolve project
  let project = task.project;
  if (!project || typeof project === 'string' || project._id) {
    const projId = project?._id || project;
    project = await Project.findById(projId).lean();
  }
  const projectName = project?.name || 'TeamFlow Project';
  const projectId = project?._id?.toString() || task.project?.toString();
  const taskId = task._id?.toString();

  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const serverPublicUrl = process.env.SERVER_PUBLIC_URL || 'http://localhost:5000';
  const taskLink = `${clientUrl}/projects/${projectId}/board`;
  const logoUrl = `${serverPublicUrl}/public/logo.png`;

  const formattedDueDate = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'No due date set';

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F4F3EF; padding: 32px 16px;">
      <div style="max-width: 560px; margin: 0 auto; background-color: #FFFFFF; border-radius: 16px; border: 1px solid #E5E7EB; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
        <div style="background-color: #D97767; padding: 24px; text-align: center;">
          <img src="${logoUrl}" alt="TeamFlow Logo" style="height: 36px; width: auto; margin-bottom: 8px;" onerror="this.style.display='none'" />
          <h1 style="color: #FFFFFF; font-size: 20px; margin: 0; font-weight: 700;">Task Reminder</h1>
        </div>
        <div style="padding: 32px 24px; color: #1F2937;">
          <p style="font-size: 15px; margin-top: 0;">Hi <strong>${recipientUser.name || 'Teammate'}</strong>,</p>
          <p style="font-size: 14px; color: #4B5563; line-height: 1.5;">This is a friendly reminder from your workspace owner regarding an open task in <strong>${projectName}</strong>.</p>
          
          <div style="background-color: #FFF5F2; border: 1px solid #FCDAD4; border-radius: 12px; padding: 18px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #991B1B; font-size: 16px;">${task.title}</h3>
            <p style="margin: 0 0 8px 0; font-size: 13px; color: #4B5563;"><strong>Status:</strong> <span style="text-transform: capitalize;">${task.status}</span></p>
            <p style="margin: 0 0 8px 0; font-size: 13px; color: #4B5563;"><strong>Priority:</strong> <span style="text-transform: capitalize;">${task.priority || 'Medium'}</span></p>
            <p style="margin: 0; font-size: 13px; color: #4B5563;"><strong>Due Date:</strong> ${formattedDueDate}</p>
          </div>

          <div style="text-align: center; margin-top: 28px;">
            <a href="${taskLink}" style="background-color: #4E8765; color: #FFFFFF; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-weight: 600; font-size: 14px; display: inline-block;">Open Task & Update Status</a>
          </div>
        </div>
        <div style="background-color: #F9FAFB; padding: 16px; text-align: center; border-top: 1px solid #E5E7EB; font-size: 12px; color: #9CA3AF;">
          TeamFlow &bull; Collaborative Task Management
        </div>
      </div>
    </div>
  `;

  const subject = `[TeamFlow Reminder] Pending Task: ${task.title}`;

  let status = 'sent';
  let providerMessageId = '';
  let errorMessage = '';

  try {
    const resendRes = await sendViaResend({
      to: recipientUser.email,
      subject,
      html,
    });
    providerMessageId = resendRes.id || 'simulated_id';
  } catch (err) {
    status = 'failed';
    errorMessage = err.message || 'Resend email failed';
    // Record failure in Notification log before throwing 502
    await Notification.create({
      project: projectId,
      task: taskId,
      recipient: recipientUser._id,
      triggeredBy: triggeredBy?._id || triggeredBy,
      type: 'TASK_REMINDER',
      status: 'failed',
      error: errorMessage,
    });
    throw new ApiError(502, `Email service failed: ${errorMessage}`);
  }

  const notification = await Notification.create({
    project: projectId,
    task: taskId,
    recipient: recipientUser._id,
    triggeredBy: triggeredBy?._id || triggeredBy,
    type: 'TASK_REMINDER',
    status: 'sent',
    providerMessageId,
  });

  return notification;
};

export default {
  sendTaskAssignedEmail,
  sendTaskReminderEmail,
};
