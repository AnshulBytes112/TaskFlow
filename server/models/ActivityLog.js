const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  action: {
    type: String,
    required: [true, 'Action description is required'],
    trim: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false 
});

//using index for better query as it runs in O(1) time
activityLogSchema.index({ project: 1, timestamp: -1 });
activityLogSchema.index({ user: 1, timestamp: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
