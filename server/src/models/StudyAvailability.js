const mongoose = require('mongoose');

const studyAvailabilitySchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student reference is required']
    },
    dayOfWeek: {
      type: String,
      required: [true, 'Day of week is required'],
      enum: {
        values: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        message: '{VALUE} is not a valid day of the week'
      },
      lowercase: true
    },
    availableHours: {
      type: Number,
      required: [true, 'Available hours is required'],
      min: [0, 'Available hours cannot be negative'],
      max: [24, 'Available hours cannot exceed 24']
    }
  },
  {
    timestamps: true
  }
);

studyAvailabilitySchema.index({ student: 1, dayOfWeek: 1 }, { unique: true });

const StudyAvailability = mongoose.model('StudyAvailability', studyAvailabilitySchema);

module.exports = StudyAvailability;
