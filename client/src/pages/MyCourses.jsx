import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { courseAPI } from '../services/api';
import CourseCard from '../components/CourseCard';
import { FolderKanban, Compass, CheckCircle2, Clock } from 'lucide-react';

const MyCourses = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMyCourses = async () => {
      try {
        setLoading(true);
        const res = await courseAPI.getMyCourses();
        if (res.data?.success) {
          setEnrollments(res.data.enrollments || []);
        }
      } catch (err) {
        console.error('Error fetching my courses:', err);
        setError(err.message || 'Failed to fetch enrolled courses.');
      } finally {
        setLoading(false);
      }
    };

    fetchMyCourses();
  }, []);

  const completedCount = enrollments.filter(e => e.status === 'Completed' || e.progress >= 90).length;
  const inProgressCount = enrollments.length - completedCount;

  return (
    <div className="page-container" id="my-courses-page">
      {/* Header */}
      <section className="page-header" id="my-courses-header">
        <div className="page-header-content">
          <div className="header-badge">
            <FolderKanban size={14} />
            <span>Learning Dashboard</span>
          </div>
          <h1 className="page-title">My Enrolled Courses</h1>
          <p className="page-subtitle">
            Manage your registered courses, resume video lessons from where you paused, and track completion status.
          </p>
        </div>

        {/* Quick summary counters */}
        <div className="my-courses-counters">
          <div className="counter-item">
            <span className="counter-num">{enrollments.length}</span>
            <span className="counter-text">Total Enrolled</span>
          </div>
          <div className="counter-divider"></div>
          <div className="counter-item">
            <span className="counter-num text-indigo">{inProgressCount}</span>
            <span className="counter-text">In Progress</span>
          </div>
          <div className="counter-divider"></div>
          <div className="counter-item">
            <span className="counter-num text-emerald">{completedCount}</span>
            <span className="counter-text">Completed</span>
          </div>
        </div>
      </section>

      {error && (
        <div className="alert-box alert-error">
          <span>{error}</span>
        </div>
      )}

      {/* Courses List */}
      <section className="my-courses-content">
        {loading ? (
          <div className="loading-wrapper">
            <div className="spinner"></div>
            <p>Retrieving your enrolled courses...</p>
          </div>
        ) : enrollments.length === 0 ? (
          <div className="empty-state-box" id="empty-my-courses">
            <FolderKanban size={52} className="empty-icon" />
            <h3>No courses enrolled yet</h3>
            <p>You have not registered for any courses yet. Browse our curated catalog to begin learning!</p>
            <Link to="/courses" className="btn-primary" id="btn-browse-catalog-cta">
              <Compass size={18} />
              <span>Browse Course Catalogue</span>
            </Link>
          </div>
        ) : (
          <div className="courses-grid" id="my-courses-grid">
            {enrollments.map((enrollment) => (
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

export default MyCourses;
