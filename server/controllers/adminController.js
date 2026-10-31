const User = require('../models/User');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Activity = require('../models/Activity');
const { extractYouTubeId } = require('../utils/youtube');

// @desc Get admin dashboard summary statistics and recent activity
// @route GET /api/admin/dashboard
const getDashboardStats = async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalCourses = await Course.countDocuments();
    const totalEnrollments = await Enrollment.countDocuments();
    const totalCompleted = await Enrollment.countDocuments({ status: 'Completed' });

    const recentActivities = await Activity.find()
      .sort({ timestamp: -1 })
      .limit(15)
      .populate('studentId', 'email')
      .populate('courseId', 'title');

    res.status(200).json({
      success: true,
      stats: {
        totalStudents,
        totalCourses,
        totalEnrollments,
        totalCompleted
      },
      recentActivities
    });
  } catch (error) {
    console.error('getDashboardStats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard statistics.' });
  }
};

// @desc Get all courses (Draft and Published)
// @route GET /api/admin/courses
const getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: courses.length,
      courses
    });
  } catch (error) {
    console.error('getAllCourses error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch courses.' });
  }
};

// @desc Create a new course
// @route POST /api/admin/courses
const createCourse = async (req, res) => {
  try {
    const { title, description, category, thumbnailUrl, videoUrl, status } = req.body;

    if (!title || !description || !category || !videoUrl) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, description, category, and a YouTube video URL.'
      });
    }

    const videoId = extractYouTubeId(videoUrl);
    if (!videoId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid YouTube URL. Please provide a valid YouTube watch link, shortened youtu.be link, or video ID.'
      });
    }

    const newCourse = await Course.create({
      title: title.trim(),
      description: description.trim(),
      category: category.trim(),
      thumbnailUrl: thumbnailUrl ? thumbnailUrl.trim() : '',
      videoUrl: videoUrl.trim(),
      status: status || 'Draft',
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      message: 'Course created successfully.',
      course: newCourse
    });
  } catch (error) {
    console.error('createCourse error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to create course.' });
  }
};

// @desc Edit an existing course
// @route PUT /api/admin/courses/:id
const updateCourse = async (req, res) => {
  try {
    const { title, description, category, thumbnailUrl, videoUrl, status } = req.body;

    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }

    if (videoUrl !== undefined) {
      const videoId = extractYouTubeId(videoUrl);
      if (!videoId) {
        return res.status(400).json({
          success: false,
          message: 'Invalid YouTube URL. Please provide a valid YouTube watch link, shortened youtu.be link, or video ID.'
        });
      }
      course.videoUrl = videoUrl.trim();
    }

    if (title !== undefined && title.trim()) course.title = title.trim();
    if (description !== undefined && description.trim()) course.description = description.trim();
    if (category !== undefined && category.trim()) course.category = category.trim();
    if (thumbnailUrl !== undefined) course.thumbnailUrl = thumbnailUrl.trim();
    if (status !== undefined) course.status = status;

    await course.save();

    res.status(200).json({
      success: true,
      message: 'Course updated successfully.',
      course
    });
  } catch (error) {
    console.error('updateCourse error:', error);
    res.status(500).json({ success: false, message: 'Failed to update course.' });
  }
};

// @desc Delete a course
// @route DELETE /api/admin/courses/:id
const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }

    // Safely clean up associated enrollments and preserve activities
    await Enrollment.deleteMany({ courseId: course._id });
    await Activity.updateMany({ courseId: course._id }, { $set: { courseId: null } });
    await Course.findByIdAndDelete(course._id);

    res.status(200).json({
      success: true,
      message: 'Course and related enrollment records deleted successfully.'
    });
  } catch (error) {
    console.error('deleteCourse error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete course.' });
  }
};

// @desc View all registered students with enrolled/completed count & last activity
// @route GET /api/admin/students
const getStudents = async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }).select('-password').sort({ createdAt: -1 });

    const studentList = await Promise.all(
      students.map(async (student) => {
        const enrolledCount = await Enrollment.countDocuments({ studentId: student._id });
        const completedCount = await Enrollment.countDocuments({ studentId: student._id, status: 'Completed' });
        const lastActivity = await Activity.findOne({ studentId: student._id }).sort({ timestamp: -1 });

        return {
          _id: student._id,
          email: student.email,
          createdAt: student.createdAt,
          isActive: student.isActive,
          enrolledCount,
          completedCount,
          lastActivity: lastActivity ? {
            activityType: lastActivity.activityType,
            timestamp: lastActivity.timestamp
          } : null
        };
      })
    );

    res.status(200).json({
      success: true,
      count: studentList.length,
      students: studentList
    });
  } catch (error) {
    console.error('getStudents error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch students list.' });
  }
};

// @desc View individual student progress across all their enrolled courses
// @route GET /api/admin/students/:id/progress
const getStudentProgress = async (req, res) => {
  try {
    const student = await User.findById(req.params.id).select('-password');
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    const enrollments = await Enrollment.find({ studentId: student._id })
      .populate('courseId')
      .sort({ lastAccessedAt: -1 });

    const validEnrollments = enrollments.filter(e => e.courseId !== null);

    res.status(200).json({
      success: true,
      student,
      enrollments: validEnrollments
    });
  } catch (error) {
    console.error('getStudentProgress error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch student progress details.' });
  }
};

// @desc View all students enrolled in a specific course and their progress
// @route GET /api/admin/courses/:id/progress
const getCourseProgress = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }

    const enrollments = await Enrollment.find({ courseId: course._id })
      .populate('studentId', 'email createdAt isActive')
      .sort({ lastAccessedAt: -1 });

    res.status(200).json({
      success: true,
      course,
      count: enrollments.length,
      enrollments
    });
  } catch (error) {
    console.error('getCourseProgress error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch course progress reports.' });
  }
};

// @desc Get recent activities log
// @route GET /api/admin/activities
const getActivities = async (req, res) => {
  try {
    const activities = await Activity.find()
      .sort({ timestamp: -1 })
      .limit(50)
      .populate('studentId', 'email')
      .populate('courseId', 'title');

    res.status(200).json({
      success: true,
      count: activities.length,
      activities
    });
  } catch (error) {
    console.error('getActivities error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch activity logs.' });
  }
};

module.exports = {
  getDashboardStats,
  getAllCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  getStudents,
  getStudentProgress,
  getCourseProgress,
  getActivities
};
