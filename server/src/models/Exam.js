const mongoose = require('mongoose');

const examSchema = new mongoose.Schema(
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
      required: [true, 'Exam title is required'],
      trim: true,
      minlength: [2, 'Title must be at least 2 characters long']
    },
    examDate: {
      type: Date,
      required: [true, 'Exam date is required']
    },
    importance: {
      type: Number,
      required: true,
      min: [1, 'Importance must be between 1 and 5'],
      max: [5, 'Importance must be between 1 and 5'],
      default: 4
    },
    difficulty: {
      type: Number,
      required: true,
      min: [1, 'Difficulty must be between 1 and 5'],
      max: [5, 'Difficulty must be between 1 and 5'],
      default: 3
    },
    preparationHours: {
      type: Number,
      required: true,
      min: [0.5, 'Preparation hours must be at least 0.5'],
      default: 10
    },
    status: {
      type: String,
      enum: {
        values: ['Upcoming', 'Completed'],
        message: '{VALUE} is not a valid exam status'
      },
      default: 'Upcoming'
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

// Indexes
examSchema.index({ student: 1, examDate: 1 });
examSchema.index({ student: 1, status: 1 });

const Exam = mongoose.model('Exam', examSchema);

module.exports = Exam;
