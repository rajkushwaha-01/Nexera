const mongoose = require('mongoose');

const projectUpdateSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project reference is required']
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author reference is required']
    },
    text: {
      type: String,
      required: [true, 'Update text is required'],
      trim: true,
      minlength: [3, 'Update text must be at least 3 characters long'],
      maxlength: [1000, 'Update text cannot exceed 1000 characters']
    },
    progress: {
      type: Number,
      min: [0, 'Progress cannot be below 0%'],
      max: [100, 'Progress cannot exceed 100%'],
      default: null
    },
    status: {
      type: String,
      enum: {
        values: ['Planning', 'Active', 'At Risk', 'Completed', 'On Hold'],
        message: '{VALUE} is not a valid project status'
      },
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for activity feed sorting
projectUpdateSchema.index({ project: 1, createdAt: -1 });

const ProjectUpdate = mongoose.model('ProjectUpdate', projectUpdateSchema);

module.exports = ProjectUpdate;
