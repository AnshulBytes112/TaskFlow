const Task = require('../models/Task');
const Project = require('../models/Project');
const ActivityLog = require('../models/ActivityLog');

// Create task
const createTask = async (req, res) => {
  try {
    const { title, description, project, assignedTo, priority } = req.body;

    // Check if project exists and user has access
    const projectDoc = await Project.findById(project);
    if (!projectDoc) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const isProjectManager = projectDoc.members.some(member => 
      member.user.toString() === req.user._id.toString() && 
      member.role === 'project_manager'
    );

    if (!isProjectManager && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const task = new Task({
      title,
      description,
      project,
      assignedTo,
      createdBy: req.user._id,
      priority: priority || 'medium'
    });

    await task.save();
    await task.populate('project', 'title');
    await task.populate('assignedTo', 'name email');
    await task.populate('createdBy', 'name email');

    // Log activity
    await ActivityLog.create({
      user: req.user._id,
      project: project,
      action: `created task "${title}"`
    });

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: task
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating task'
    });
  }
};

// Get tasks for a project
const getTasksByProject = async (req, res) => {
  try {
    const { projectId } = req.query;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: 'Project ID is required'
      });
    }

    // Check if user has access to project
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const isMember = project.members.some(member => 
      member.user.toString() === req.user._id.toString()
    );

    if (!isMember && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const tasks = await Task.find({ project: projectId })
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: tasks
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching tasks'
    });
  }
};

// Update task status
const updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const task = await Task.findById(id).populate('project', 'title');
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check permissions
    const canUpdate = 
      req.user.role === 'admin' || 
      req.user.role === 'project_manager' ||
      (task.assignedTo && task.assignedTo.toString() === req.user._id.toString());

    if (!canUpdate) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const oldStatus = task.status;
    task.status = status;
    await task.save();

    // Recalculate project completion percentage (handled by middleware)
    
    // Log activity
    await ActivityLog.create({
      user: req.user._id,
      project: task.project._id,
      action: `moved task "${task.title}" from ${oldStatus} to ${status}`
    });

    await task.populate('assignedTo', 'name email');
    await task.populate('createdBy', 'name email');

    res.json({
      success: true,
      message: 'Task status updated successfully',
      data: task
    });
  } catch (error) {
    console.error('Update task status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating task status'
    });
  }
};

// Update task details
const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, assignedTo, priority } = req.body;

    const task = await Task.findById(id).populate('project', 'title');
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check if user is project manager or admin
    const project = await Project.findById(task.project._id);
    const isProjectManager = project.members.some(member => 
      member.user.toString() === req.user._id.toString() && 
      member.role === 'project_manager'
    );

    if (!isProjectManager && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const oldTitle = task.title;
    task.title = title || task.title;
    task.description = description || task.description;
    task.assignedTo = assignedTo || task.assignedTo;
    task.priority = priority || task.priority;

    await task.save();
    await task.populate('assignedTo', 'name email');
    await task.populate('createdBy', 'name email');

    // Log activity
    await ActivityLog.create({
      user: req.user._id,
      project: task.project._id,
      action: `updated task "${oldTitle}"`
    });

    res.json({
      success: true,
      message: 'Task updated successfully',
      data: task
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating task'
    });
  }
};

// Delete task
const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const taskTitle = task.title;

    // Only admin can delete tasks
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await Task.findByIdAndDelete(id);

    // Log activity
    await ActivityLog.create({
      user: req.user._id,
      project: task.project,
      action: `deleted task "${taskTitle}"`
    });

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting task'
    });
  }
};

module.exports = {
  createTask,
  getTasksByProject,
  updateTaskStatus,
  updateTask,
  deleteTask
};
