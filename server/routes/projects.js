const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
  inviteToProject
} = require('../controllers/projectController');

// POST /api/projects — create project [admin, project_manager only]
router.post('/', verifyToken, authorizeRoles('admin', 'project_manager'), createProject);

// GET /api/projects — get all projects
router.get('/', verifyToken, getAllProjects);

// GET /api/projects/:id — get single project
router.get('/:id', verifyToken, getProjectById);

// PATCH /api/projects/:id — update project [admin, project_manager only]
router.patch('/:id', verifyToken, authorizeRoles('admin', 'project_manager'), updateProject);

// DELETE /api/projects/:id — delete project [admin only]
router.delete('/:id', verifyToken, authorizeRoles('admin'), deleteProject);

// POST /api/projects/:id/invite — invite user to project [admin, project_manager only]
router.post('/:id/invite', verifyToken, authorizeRoles('admin', 'project_manager'), inviteToProject);

module.exports = router;
