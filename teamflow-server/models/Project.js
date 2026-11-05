import mongoose from 'mongoose';

const memberSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      minlength: [3, 'Project name must be at least 3 characters long'],
      maxlength: [80, 'Project name cannot exceed 80 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Project description cannot exceed 500 characters'],
      default: '',
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Project owner is required'],
    },
    members: [memberSchema],
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
      validate: {
        validator: function (value) {
          if (!value || !this.startDate) return true;
          return new Date(value) >= new Date(this.startDate);
        },
        message: 'End date must be on or after start date',
      },
    },
  },
  {
    timestamps: true,
  }
);

projectSchema.index({ 'members.user': 1 });
projectSchema.index({ owner: 1 });

const Project = mongoose.model('Project', projectSchema);

export default Project;

