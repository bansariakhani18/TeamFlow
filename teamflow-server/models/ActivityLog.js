import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project reference is required'],
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Actor reference is required'],
    },
    action: {
      type: String,
      required: [true, 'Action is required'],
      enum: [
        'TASK_CREATED',
        'TASK_UPDATED',
        'TASK_ASSIGNED',
        'STATUS_CHANGED',
        'TASK_DELETED',
        'COMMENT_ADDED',
        'COMMENT_DELETED',
        'MEMBER_ADDED',
        'MEMBER_REMOVED',
      ],
    },
    target: {
      type: String,
      default: '',
    },
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      default: null,
    },
    taskTitle: {
      type: String,
      default: '',
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

activityLogSchema.index({ project: 1, createdAt: -1 });
activityLogSchema.index({ task: 1, createdAt: -1 });

// Share the 'activities' collection with Activity model for unified access
const ActivityLog = mongoose.models.ActivityLog || mongoose.model('ActivityLog', activityLogSchema, 'activities');

export default ActivityLog;
