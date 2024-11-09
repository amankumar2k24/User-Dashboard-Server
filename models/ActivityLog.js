const mongoose = require('mongoose');

const ActivityLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    activity: {
      type: String,
      required: true
    },
    ipAddress: {
      type: String,
      default: null 
    },
    device: {
      type: String,
      default: null 
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('ActivityLog', ActivityLogSchema);
