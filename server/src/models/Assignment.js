const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student reference is required']
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true
    },
    title: {
      type: String,
      required: [true, 'Assignment title is required'],
      trim: true,
      minlength: [2, 'Title must be at least 2 characters long']
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    deadline: {
      type: Date,
      required: [true, 'Deadline date and time is required']
    },
    estimatedEffort: {
      type: Number,
      required: [true, 'Estimated effort (in hours) is required'],
      min: [0.1, 'Estimated effort must be at least 0.1 hours']
    },
    importance: {
      type: Number,
      required: true,
      min: [1, 'Importance must be between 1 and 5'],
      max: [5, 'Importance must be between 1 and 5'],
      default: 3
    },
    difficulty: {
      type: Number,
      required: true,
      min: [1, 'Difficulty must be between 1 and 5'],
      max: [5, 'Difficulty must be between 1 and 5'],
      default: 3
    },
    status: {
      type: String,
      enum: {
        values: ['Pending', 'In Progress', 'Completed'],
        message: '{VALUE} is not a valid assignment status'
      },
      default: 'Pending'
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for fast student queries
assignmentSchema.index({ student: 1, status: 1 });
assignmentSchema.index({ student: 1, deadline: 1 });

const Assignment = mongoose.model('Assignment', assignmentSchema);

module.exports = Assignment;
