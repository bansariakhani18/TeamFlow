import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
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
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true,
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
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

activitySchema.index({ project: 1, createdAt: -1 });
activitySchema.index({ task: 1, createdAt: -1 });

const Activity = mongoose.model('Activity', activitySchema);

export default Activity;
