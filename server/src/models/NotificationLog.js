const mongoose = require('mongoose');

const notificationLogSchema = new mongoose.Schema(
  {
    entityType: {
      type: String,
      required: true,
      enum: ['Task', 'Assignment', 'Exam', 'Project']
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    recipientEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    reminderType: {
      type: String,
      required: true,
      enum: ['24h', '1h']
    },
    deadline: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ['sent', 'failed'],
      default: 'sent'
    },
    error: {
      type: String,
      default: null
    },
    sentAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Compound index guaranteeing that a duplicate notification for the exact same entity, reminder type, and deadline can NEVER be created
notificationLogSchema.index(
  { entityType: 1, entityId: 1, reminderType: 1, deadline: 1 },
  { unique: true }
);

const NotificationLog = mongoose.model('NotificationLog', notificationLogSchema);

module.exports = NotificationLog;
