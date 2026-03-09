const Project = require('../models/Project');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');

// Create project
const createProject = async (req, res) => {
  try {
    const { title, description, members } = req.body;

    const project = new Project({
      title,
      description,
      createdBy: req.user._id,
      members: members || [{ user: req.user._id, role: 'project_manager' }]
    });

    await project.save();
    await project.populate('createdBy', 'name email');
    await project.populate('members.user', 'name email');

    // Log activity
    await ActivityLog.create({
      user: req.user._id,
      project: project._id,
      action: `created project "${title}"`
    });

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: project
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating project'
    });
  }
};

// Get all projects
const getAllProjects = async (req, res) => {
  try {
    let projects;

    if (req.user.role === 'admin') {
      // Admin sees all projects
      projects = await Project.find()
        .populate('createdBy', 'name email')
        .populate('members.user', 'name email')
        .sort({ createdAt: -1 });
    } else {
      // Others see only projects they're members of
      projects = await Project.find({ 
        'members.user': req.user._id 
      })
        .populate('createdBy', 'name email')
        .populate('members.user', 'name email')
        .sort({ createdAt: -1 });
    }

    res.json({
      success: true,
      data: projects
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching projects'
    });
  }
};

// Get single project
const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await Project.findById(id)
      .populate('createdBy', 'name email')
      .populate('members.user', 'name email');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if user is member or admin
    const isMember = project.members.some(member => 
      member.user._id.toString() === req.user._id.toString()
    );

    if (!isMember && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching project'
    });
  }
};

// Update project
const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status } = req.body;

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if user is project manager or admin
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

    const oldTitle = project.title;
    project.title = title || project.title;
    project.description = description || project.description;
    project.status = status || project.status;

    await project.save();
    await project.populate('createdBy', 'name email');
    await project.populate('members.user', 'name email');

    // Log activity
    await ActivityLog.create({
      user: req.user._id,
      project: project._id,
      action: `updated project "${oldTitle}"`
    });

    res.json({
      success: true,
      message: 'Project updated successfully',
      data: project
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating project'
    });
  }
};

// Delete project
const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const projectTitle = project.title;
    await Project.findByIdAndDelete(id);

    // Log activity
    await ActivityLog.create({
      user: req.user._id,
      project: id,
      action: `deleted project "${projectTitle}"`
    });

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting project'
    });
  }
};

// Invite user to project
const inviteToProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { userEmail, role } = req.body;

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if user is project manager or admin
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

    // Find user to invite
    const userToInvite = await User.findOne({ email: userEmail });
    if (!userToInvite) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is already a member
    const isAlreadyMember = project.members.some(member => 
      member.user.toString() === userToInvite._id.toString()
    );

    if (isAlreadyMember) {
      return res.status(400).json({
        success: false,
        message: 'User is already a member of this project'
      });
    }

    // Add user to project
    project.members.push({
      user: userToInvite._id,
      role: role || 'team_member'
    });

    await project.save();
    await project.populate('members.user', 'name email');

    // Log activity
    await ActivityLog.create({
      user: req.user._id,
      project: project._id,
      action: `invited ${userToInvite.name} to project`
    });

    res.json({
      success: true,
      message: 'User invited successfully',
      data: project
    });
  } catch (error) {
    console.error('Invite to project error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while inviting user'
    });
  }
};

module.exports = {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
  inviteToProject
};
