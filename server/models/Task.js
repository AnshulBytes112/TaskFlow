const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['todo', 'in_progress', 'done'],
    default: 'todo'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  }
}, {
  timestamps: true
});

taskSchema.post('save', async function() {
  try {
    const Project = mongoose.model('Project');
    const project = await Project.findById(this.project);
    if (project) {
      await project.calculateCompletionPercentage();
    }
  } catch (error) {
    console.error('Error updating project completion after task save:', error);
  }
});

// Post-update middleware to update project completion percentage
taskSchema.post('findOneAndUpdate', async function(doc) {
  try {
    if (doc) {
      const Project = mongoose.model('Project');
      const project = await Project.findById(doc.project);
      if (project) {
        await project.calculateCompletionPercentage();
      }
    }
  } catch (error) {
    console.error('Error updating project completion after task update:', error);
  }
});

// Post-remove middleware to update project completion percentage
taskSchema.post('remove', async function() {
  try {
    const Project = mongoose.model('Project');
    const project = await Project.findById(this.project);
    if (project) {
      await project.calculateCompletionPercentage();
    }
  } catch (error) {
    console.error('Error updating project completion after task removal:', error);
  }
});

module.exports = mongoose.model('Task', taskSchema);
