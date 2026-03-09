const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Project title is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['project_manager', 'team_member', 'viewer'],
      default: 'team_member'
    }
  }],
  status: {
    type: String,
    enum: ['active', 'on_hold', 'completed'],
    default: 'active'
  },
  completionPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  }
}, {
  timestamps: true
});

// Method to calculate completion percentage
projectSchema.methods.calculateCompletionPercentage = async function() {
  const Task = mongoose.model('Task');
  
  try {
    const totalTasks = await Task.countDocuments({ project: this._id });
    if (totalTasks === 0) {
      this.completionPercentage = 0;
    } else {
      const doneTasks = await Task.countDocuments({ 
        project: this._id, 
        status: 'done' 
      });
      this.completionPercentage = Math.round((doneTasks / totalTasks) * 100);
    }
    
    await this.save();
    return this.completionPercentage;
  } catch (error) {
    console.error('Error calculating completion percentage:', error);
    throw error;
  }
};

module.exports = mongoose.model('Project', projectSchema);
