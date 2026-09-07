const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Project title is required'],
      trim: true,
      minlength: [2, 'Title must be at least 2 characters long'],
      maxlength: [120, 'Title cannot exceed 120 characters']
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Project owner is required']
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    startDate: {
      type: Date,
      default: Date.now
    },
    deadline: {
      type: Date,
      required: [true, 'Project deadline is required']
    },
    status: {
      type: String,
      enum: {
        values: ['Planning', 'Active', 'At Risk', 'Completed', 'On Hold'],
        message: '{VALUE} is not a valid project status'
      },
      default: 'Planning'
    },
    priority: {
      type: String,
      enum: {
        values: ['Low', 'Medium', 'High', 'Critical'],
        message: '{VALUE} is not a valid priority level'
      },
      default: 'Medium'
    },
    progress: {
      type: Number,
      min: [0, 'Progress cannot be below 0%'],
      max: [100, 'Progress cannot exceed 100%'],
      default: 0
    },
    isArchived: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for task count
projectSchema.virtual('tasks', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'project'
});

// Index for query optimization
projectSchema.index({ owner: 1, status: 1 });
projectSchema.index({ members: 1 });
projectSchema.index({ deadline: 1 });

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;
