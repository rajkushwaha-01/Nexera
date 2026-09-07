const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/, 'Please provide a valid email address']
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false
    },
    role: {
      type: String,
      enum: {
        values: ['admin', 'member', 'student'],
        message: '{VALUE} is not a supported role'
      },
      default: 'student'
    },
    avatar: {
      type: String,
      default: ''
    },
    title: {
      type: String,
      default: 'Member'
    },
    department: {
      type: String,
      default: 'General'
    },
    weeklyStudyHours: {
      monday: { type: Number, default: 2, min: 0, max: 24 },
      tuesday: { type: Number, default: 2, min: 0, max: 24 },
      wednesday: { type: Number, default: 2, min: 0, max: 24 },
      thursday: { type: Number, default: 2, min: 0, max: 24 },
      friday: { type: Number, default: 2, min: 0, max: 24 },
      saturday: { type: Number, default: 4, min: 0, max: 24 },
      sunday: { type: Number, default: 4, min: 0, max: 24 }
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret.password;
        return ret;
      }
    },
    toObject: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret.password;
        return ret;
      }
    }
  }
);

/**
 * Pre-save middleware to hash password
 */
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

/**
 * Compare password method
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
