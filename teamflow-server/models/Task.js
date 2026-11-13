import mongoose from 'mongoose';

export const TASK_STATUSES = [
  'todo',
  'in_progress',
  'review',
  'done',
  'To Do',
  'In Progress',
  'In Review',
  'Done',
];

export const TASK_PRIORITIES = [
  'low',
  'medium',
  'high',
  'urgent',
  'Low',
  'Medium',
  'High',
  'Urgent',
];

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      minlength: [3, 'Title must be between 3 and 100 characters'],
      maxlength: [100, 'Title must be between 3 and 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: '',
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: TASK_STATUSES,
        message: 'Invalid status value',
      },
      default: 'todo',
    },
    priority: {
      type: String,
      required: true,
      enum: {
        values: TASK_PRIORITIES,
        message: 'Invalid priority value',
      },
      default: 'medium',
    },
    dueDate: {
      type: Date,
      default: null,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project reference is required'],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Sync assignedTo and assignee bidirectionally before saving
taskSchema.pre('save', function () {
  if (this.assignedTo && !this.assignee) {
    this.assignee = this.assignedTo;
  } else if (this.assignee && !this.assignedTo) {
    this.assignedTo = this.assignee;
  }
});

// Indexes for high performance querying
taskSchema.index({ project: 1, status: 1 });
taskSchema.index({ project: 1, assignedTo: 1 });
taskSchema.index({ project: 1, assignee: 1 });
taskSchema.index({ project: 1, dueDate: 1 });
taskSchema.index({ project: 1, order: 1 });

const Task = mongoose.model('Task', taskSchema);

export default Task;

