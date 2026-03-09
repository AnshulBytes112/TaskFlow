const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const {
  createTask,
  getTasksByProject,
  updateTaskStatus,
  updateTask,
  deleteTask
} = require('../controllers/taskController');

router.post('/', verifyToken, authorizeRoles('admin', 'project_manager'), createTask);

router.get('/', verifyToken, getTasksByProject);

router.patch('/:id/status', verifyToken, updateTaskStatus);

router.patch('/:id', verifyToken, authorizeRoles('admin', 'project_manager'), updateTask);

// DELETE /api/tasks/:id — delete task [admin only]
router.delete('/:id', verifyToken, authorizeRoles('admin'), deleteTask);

module.exports = router;
