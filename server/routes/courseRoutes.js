const express = require('express');
const router = express.Router();
const { getCourses, getCourseById, enrollCourse } = require('../controllers/courseController');
const requireAuth = require('../middleware/authMiddleware');

// Public course browsing (optionally uses session if present to flag enrolled status)
router.get('/', getCourses);
router.get('/:id', getCourseById);

// Protected course enrollment
router.post('/:id/enroll', requireAuth, enrollCourse);

module.exports = router;
