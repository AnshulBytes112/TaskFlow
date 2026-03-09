const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const ActivityLog = require('../models/ActivityLog');

// GET /api/activity — get activity logs for user's projects
router.get('/', verifyToken, async (req, res) => {
  try {
    const { projectId, limit = 50 } = req.query;

    let query = {};
    
    if (projectId) {
      // Get activity for specific project
      query.project = projectId;
      
      // Check if user has access to this project
      const Project = require('../models/Project');
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
    } else {
      // Get activity for all user's projects
      const Project = require('../models/Project');
      const userProjects = await Project.find({ 
        'members.user': req.user._id 
      }).select('_id');
      
      query.project = { $in: userProjects.map(p => p._id) };
    }

    const activities = await ActivityLog.find(query)
      .populate('user', 'name email')
      .populate('project', 'title')
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: activities
    });
  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching activity logs'
    });
  }
});

module.exports = router;
