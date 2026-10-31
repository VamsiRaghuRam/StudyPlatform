const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Activity = require('../models/Activity');

// @desc Get all published courses (with optional title search)
// @route GET /api/courses
const getCourses = async (req, res) => {
  try {
    const { search, category } = req.query;
    const query = { status: 'Published' };

    if (search && search.trim() !== '') {
      query.title = { $regex: search.trim(), $options: 'i' };
    }

    if (category && category !== 'All') {
      query.category = category;
    }

    const courses = await Course.find(query).sort({ createdAt: -1 });

    // If user is logged in, attach enrollment status for convenient UI display
    let enrolledCourseIds = [];
    if (req.session && req.session.userId) {
      const enrollments = await Enrollment.find({ studentId: req.session.userId }).select('courseId');
      enrolledCourseIds = enrollments.map(e => e.courseId.toString());
    }

    const coursesWithEnrollment = courses.map(course => {
      const plain = course.toObject();
      plain.isEnrolled = enrolledCourseIds.includes(course._id.toString());
      return plain;
    });

    res.status(200).json({
      success: true,
      count: coursesWithEnrollment.length,
      courses: coursesWithEnrollment
    });
  } catch (error) {
    console.error('getCourses error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch courses.' });
  }
};

// @desc Get single course by ID
const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }

    // Only administrators can view Draft / Unpublished courses
    const isAdmin = req.session && req.session.role === 'admin';
    if (course.status !== 'Published' && !isAdmin) {
      return res.status(404).json({ success: false, message: 'Course not found or is currently unavailable.' });
    }

    let enrollment = null;
    if (req.session && req.session.userId) {
      enrollment = await Enrollment.findOne({
        studentId: req.session.userId,
        courseId: course._id
      });
    }

    res.status(200).json({
      success: true,
      course,
      enrollment
    });
  } catch (error) {
    console.error('getCourseById error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch course details.' });
  }
};

// @desc Enroll logged-in student in a course
// @route POST /api/courses/:id/enroll
const enrollCourse = async (req, res) => {
  try {
    const courseId = req.params.id;
    const studentId = req.user._id;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }

    if (course.status !== 'Published' && req.user.role !== 'admin') {
      return res.status(400).json({ success: false, message: 'Cannot enroll in an unpublished course.' });
    }

    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({ studentId, courseId });
    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        message: 'You are already enrolled in this course.',
        enrollment: existingEnrollment
      });
    }

    // Create new enrollment
    const newEnrollment = await Enrollment.create({
      studentId,
      courseId,
      progress: 0,
      lastPosition: 0,
      watchedSeconds: 0,
      durationSeconds: 0,
      status: 'In Progress',
      enrolledAt: new Date(),
      lastAccessedAt: new Date()
    });

    // Record activity
    await Activity.create({
      studentId,
      courseId,
      activityType: 'Course enrollment'
    });

    res.status(201).json({
      success: true,
      message: 'Successfully enrolled in course!',
      enrollment: newEnrollment
    });
  } catch (error) {
    console.error('enrollCourse error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'You are already enrolled in this course.' });
    }
    res.status(500).json({ success: false, message: 'Failed to enroll in course.' });
  }
};

// @desc Get all courses enrolled by the logged in student
// @route GET /api/my-courses
const getMyCourses = async (req, res) => {
  try {
    const studentId = req.user._id;

    const enrollments = await Enrollment.find({ studentId })
      .populate('courseId')
      .sort({ lastAccessedAt: -1 });

    // Filter out if any course was deleted
    const validEnrollments = enrollments.filter(e => e.courseId !== null);

    res.status(200).json({
      success: true,
      count: validEnrollments.length,
      enrollments: validEnrollments
    });
  } catch (error) {
    console.error('getMyCourses error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch enrolled courses.' });
  }
};

module.exports = {
  getCourses,
  getCourseById,
  enrollCourse,
  getMyCourses
};
