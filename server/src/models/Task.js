const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project reference is required']
    },
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      minlength: [2, 'Task title must be at least 2 characters long'],
      maxlength: [140, 'Task title cannot exceed 140 characters']
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    priority: {
      type: String,
      enum: {
        values: ['Low', 'Medium', 'High', 'Critical'],
        message: '{VALUE} is not a valid task priority'
      },
      default: 'Medium'
    },
    status: {
      type: String,
      enum: {
        values: ['Todo', 'In Progress', 'Review', 'Completed', 'Blocked'],
        message: '{VALUE} is not a valid task status'
      },
      default: 'Todo'
    },
    dueDate: {
      type: Date,
      default: null
    },
    estimatedEffort: {
      type: Number,
      min: [0, 'Estimated effort cannot be negative'],
      default: 0
    },
    actualEffort: {
      type: Number,
      min: [0, 'Actual effort cannot be negative'],
      default: 0
    },
    progress: {
      type: Number,
      min: [0, 'Progress cannot be below 0%'],
      max: [100, 'Progress cannot exceed 100%'],
      default: 0
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator is required']
    },
    deadlineReminder24Sent: {
      type: Boolean,
      default: false
    },
    deadlineReminder1hSent: {
      type: Boolean,
      default: false
    },
    lastNotifiedDeadline: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for fast lookup and filtering
taskSchema.index({ project: 1, status: 1 });
taskSchema.index({ assignedTo: 1 });
taskSchema.index({ dueDate: 1 });

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;
