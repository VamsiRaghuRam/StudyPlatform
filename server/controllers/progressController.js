const Enrollment = require('../models/Enrollment');
const Activity = require('../models/Activity');

// @desc Update video playback progress
// @route PATCH /api/progress/:enrollmentId
const updateProgress = async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    let { lastPosition, durationSeconds, deltaSeconds, eventType } = req.body;

    const enrollment = await Enrollment.findById(enrollmentId);
    if (!enrollment) {
      return res.status(404).json({ success: false, message: 'Enrollment record not found.' });
    }

    // Verify ownership (student can only update their own progress, admin can update any)
    if (req.user.role !== 'admin' && enrollment.studentId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied to this enrollment record.' });
    }

    const previousStatus = enrollment.status;
    const previousPosition = enrollment.lastPosition;
    const previousProgress = enrollment.progress || 0;

    // Validate and update total duration if provided
    if (typeof durationSeconds === 'number' && durationSeconds > 0) {
      enrollment.durationSeconds = Math.round(durationSeconds);
    }

    const effectiveDuration = enrollment.durationSeconds > 0 ? enrollment.durationSeconds : 999999;

    // Validate and update last playback position (must be non-negative and not exceed duration)
    if (typeof lastPosition === 'number' && !isNaN(lastPosition)) {
      if (lastPosition < 0) {
        lastPosition = 0;
      }
      if (enrollment.durationSeconds > 0 && lastPosition > enrollment.durationSeconds) {
        lastPosition = enrollment.durationSeconds;
      }
      enrollment.lastPosition = Math.round(lastPosition);
    }

    // Accumulate watched seconds safely
    if (typeof deltaSeconds === 'number' && !isNaN(deltaSeconds) && deltaSeconds > 0) {
      enrollment.watchedSeconds = Math.min(effectiveDuration, (enrollment.watchedSeconds || 0) + deltaSeconds);
    }
    // Ensure watched seconds reflects the furthest playback position reached
    if (enrollment.lastPosition > (enrollment.watchedSeconds || 0)) {
      enrollment.watchedSeconds = Math.min(effectiveDuration, enrollment.lastPosition);
    }

    // Calculate progress percentage: based on playback position and watched seconds
    if (enrollment.durationSeconds > 0) {
      const positionProgress = (enrollment.lastPosition / enrollment.durationSeconds) * 100;
      const watchedProgress = ((enrollment.watchedSeconds || 0) / enrollment.durationSeconds) * 100;
      const calculatedProgress = Math.max(positionProgress, watchedProgress);
      enrollment.progress = Math.min(100, Math.max(enrollment.progress || 0, Math.round(calculatedProgress)));
    }

    // Check completion threshold: 90% or explicit complete trigger
    const isNowCompleted = enrollment.progress >= 90 || eventType === 'complete';
    if (isNowCompleted) {
      if (eventType === 'complete') {
        enrollment.progress = 100;
        if (enrollment.durationSeconds > 0) {
          enrollment.lastPosition = enrollment.durationSeconds;
          enrollment.watchedSeconds = enrollment.durationSeconds;
        }
      }
      if (enrollment.status !== 'Completed') {
        enrollment.status = 'Completed';
        enrollment.completedAt = new Date();

        await Activity.create({
          studentId: enrollment.studentId,
          courseId: enrollment.courseId,
          activityType: 'Course completed'
        }).catch(err => console.error('Error logging course completed activity:', err));
      }
    }

    enrollment.lastAccessedAt = new Date();
    await enrollment.save();

    // Log Activity Events at sensible intervals:
    // 1. Initial Course Started
    if (eventType === 'start' || (previousPosition === 0 && enrollment.lastPosition > 0 && previousProgress === 0)) {
      const existingStart = await Activity.findOne({
        studentId: enrollment.studentId,
        courseId: enrollment.courseId,
        activityType: 'Course started'
      });

      if (!existingStart) {
        await Activity.create({
          studentId: enrollment.studentId,
          courseId: enrollment.courseId,
          activityType: 'Course started'
        }).catch(err => console.error('Error logging course started activity:', err));
      }
    }

    // 2. Video Progress Saved: only record on notable milestones (e.g., crossing 25%, 50%, 75%)
    // or when at least 3 minutes have passed since the last progress activity for this student and course
    if (eventType === 'progress' || eventType === 'pause' || eventType === 'milestone') {
      const crossedMilestone = [25, 50, 75].some(m => previousProgress < m && enrollment.progress >= m);

      // Check time elapsed since last progress activity
      const lastProgressActivity = await Activity.findOne({
        studentId: enrollment.studentId,
        courseId: enrollment.courseId,
        activityType: 'Video progress saved'
      }).sort({ timestamp: -1 });

      const timeSinceLast = lastProgressActivity ? (Date.now() - new Date(lastProgressActivity.timestamp).getTime()) : Infinity;
      const threeMinutes = 3 * 60 * 1000;

      if (crossedMilestone || timeSinceLast >= threeMinutes) {
        await Activity.create({
          studentId: enrollment.studentId,
          courseId: enrollment.courseId,
          activityType: 'Video progress saved'
        }).catch(err => console.error('Error logging progress saved activity:', err));
      }
    }

    res.status(200).json({
      success: true,
      message: 'Progress updated successfully.',
      enrollment
    });
  } catch (error) {
    console.error('updateProgress error:', error);
    res.status(500).json({ success: false, message: 'Failed to update progress.' });
  }
};

// @desc Get progress for a specific enrollment
// @route GET /api/progress/:enrollmentId
const getProgress = async (req, res) => {
  try {
    const { enrollmentId } = req.params;

    const enrollment = await Enrollment.findById(enrollmentId).populate('courseId');
    if (!enrollment) {
      return res.status(404).json({ success: false, message: 'Enrollment record not found.' });
    }

    // Verify ownership
    if (req.user.role !== 'admin' && enrollment.studentId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.status(200).json({
      success: true,
      enrollment
    });
  } catch (error) {
    console.error('getProgress error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch progress.' });
  }
};

module.exports = {
  updateProgress,
  getProgress
};
