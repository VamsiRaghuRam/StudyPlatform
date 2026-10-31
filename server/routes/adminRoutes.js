const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getAllCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  getStudents,
  getStudentProgress,
  getCourseProgress,
  getActivities
} = require('../controllers/adminController');
const requireAuth = require('../middleware/authMiddleware');
const requireAdmin = require('../middleware/adminMiddleware');

// Protect all admin routes with authentication and admin authorization
router.use(requireAuth, requireAdmin);

router.get('/dashboard', getDashboardStats);
router.get('/courses', getAllCourses);
router.post('/courses', createCourse);
router.put('/courses/:id', updateCourse);
router.delete('/courses/:id', deleteCourse);
router.get('/students', getStudents);
router.get('/students/:id/progress', getStudentProgress);
router.get('/courses/:id/progress', getCourseProgress);
router.get('/activities', getActivities);

module.exports = router;
