import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { courseAPI } from '../services/api';
import CourseCard from '../components/CourseCard';
import ProgressBar from '../components/ProgressBar';
import {
  BookOpen,
  GraduationCap,
  Award,
  TrendingUp,
  Clock,
  Compass,
  ArrowRight,
  Sparkles
} from 'lucide-react';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [totalCoursesCount, setTotalCoursesCount] = useState(0);
  const [enrollments, setEnrollments] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Fetch all published courses to get available count
        const coursesRes = await courseAPI.getCourses();
        if (coursesRes.data?.success) {
          setTotalCoursesCount(coursesRes.data.count || coursesRes.data.courses.length);
        }

        // Fetch enrolled courses for this student
        const myCoursesRes = await courseAPI.getMyCourses();
        if (myCoursesRes.data?.success) {
          setEnrollments(myCoursesRes.data.enrollments || []);
        }
      } catch (err) {
        console.error('Error fetching student dashboard data:', err);
        setError(err.message || 'Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const enrolledCount = enrollments.length;
  const completedCount = enrollments.filter(e => e.status === 'Completed' || e.progress >= 90).length;

  // Calculate overall learning progress across all enrolled courses
  const overallProgress = enrolledCount > 0
    ? Math.round(enrollments.reduce((acc, curr) => acc + (curr.progress || 0), 0) / enrolledCount)
    : 0;

  // Recently accessed courses (top 3)
  const recentCourses = enrollments.slice(0, 3);

  if (loading) {
    return (
      <div className="page-container loading-wrapper">
        <div className="spinner"></div>
        <p>Loading your student dashboard...</p>
      </div>
    );
  }

  return (
    <div className="page-container" id="student-dashboard-page">
      {/* Welcome Banner */}
      <section className="welcome-banner" id="welcome-banner">
        <div className="welcome-content">
          <div className="welcome-pill">
            <Sparkles size={14} />
            <span>Student Learning Portal</span>
          </div>
          <h1 className="welcome-title">
            Welcome back, <span className="welcome-highlight">{user?.email}</span>
          </h1>
          <p className="welcome-desc">
            Track your progress, resume your enrolled video lectures, and master new skills.
          </p>
        </div>
        <div className="welcome-action">
          <Link to="/courses" className="btn-primary" id="btn-browse-catalogue">
            <Compass size={18} />
            <span>Browse Courses</span>
          </Link>
        </div>
      </section>

      {error && (
        <div className="alert-box alert-error">
          <span>{error}</span>
        </div>
      )}

      {/* Metrics Statistics Grid */}
      <section className="stats-grid" id="student-stats-grid">
        <div className="stat-card" id="stat-total-available">
          <div className="stat-icon-wrapper bg-blue-subtle text-blue">
            <BookOpen size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Available Courses</span>
            <h3 className="stat-value">{totalCoursesCount}</h3>
          </div>
        </div>

        <div className="stat-card" id="stat-enrolled-courses">
          <div className="stat-icon-wrapper bg-indigo-subtle text-indigo">
            <GraduationCap size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Enrolled Courses</span>
            <h3 className="stat-value">{enrolledCount}</h3>
          </div>
        </div>

        <div className="stat-card" id="stat-completed-courses">
          <div className="stat-icon-wrapper bg-emerald-subtle text-emerald">
            <Award size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Completed Courses</span>
            <h3 className="stat-value">{completedCount}</h3>
          </div>
        </div>

        <div className="stat-card" id="stat-overall-progress">
          <div className="stat-icon-wrapper bg-purple-subtle text-purple">
            <TrendingUp size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Overall Progress</span>
            <h3 className="stat-value">{overallProgress}%</h3>
            <ProgressBar progress={overallProgress} showLabel={false} height={6} />
          </div>
        </div>
      </section>

      {/* Recently Accessed Courses */}
      <section className="section-block" id="section-recent-courses">
        <div className="section-header">
          <div>
            <h2 className="section-title">
              <Clock size={20} className="section-icon" />
              Recently Accessed Courses
            </h2>
            <p className="section-subtitle">Pick up right where you left off</p>
          </div>
          {enrolledCount > 0 && (
            <Link to="/my-courses" className="section-link" id="link-view-all-my-courses">
              <span>View All Enrolled ({enrolledCount})</span>
              <ArrowRight size={16} />
            </Link>
          )}
        </div>

        {recentCourses.length === 0 ? (
          <div className="empty-state-box" id="empty-recent-courses">
            <GraduationCap size={48} className="empty-icon" />
            <h3>No courses enrolled yet</h3>
            <p>You haven't enrolled in any courses yet. Discover our published catalog to start learning!</p>
            <Link to="/courses" className="btn-primary" id="btn-explore-first-course">
              <Compass size={18} />
              <span>Explore Course Catalog</span>
            </Link>
          </div>
        ) : (
          <div className="courses-grid" id="recent-courses-grid">
            {recentCourses.map((enrollment) => (
              <CourseCard
                key={enrollment._id}
                course={enrollment.courseId}
                isEnrolled={true}
                enrollment={enrollment}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default StudentDashboard;
