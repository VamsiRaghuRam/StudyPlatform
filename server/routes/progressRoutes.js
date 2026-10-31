const express = require('express');
const router = express.Router();
const { updateProgress, getProgress } = require('../controllers/progressController');
const requireAuth = require('../middleware/authMiddleware');

// All progress routes require authentication
router.use(requireAuth);

router.patch('/:enrollmentId', updateProgress);
router.get('/:enrollmentId', getProgress);

module.exports = router;
