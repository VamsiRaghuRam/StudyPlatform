import React from 'react';
import { Link } from 'react-router-dom';
import ProgressBar from './ProgressBar';
import { PlayCircle, CheckCircle, BookOpen, ArrowRight } from 'lucide-react';

const CourseCard = ({
  course,
  isEnrolled = false,
  enrollment = null,
  onEnroll = null,
  enrolling = false,
  isAdmin = false
}) => {
  // Safe default thumbnail if none provided
  const thumbnail = course.thumbnailUrl && course.thumbnailUrl.trim() !== ''
    ? course.thumbnailUrl
    : 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80';

  const progress = enrollment?.progress || (course.isEnrolled && course.progress) || 0;
  const isCompleted = enrollment?.status === 'Completed' || progress >= 90;

  return (
    <div className="course-card" id={`course-card-${course._id}`}>
      {/* Thumbnail Container */}
      <div className="course-card-media">
        <img
          src={thumbnail}
          alt={course.title}
          className="course-card-img"
          loading="lazy"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80';
          }}
        />
        <div className="course-category-badge">{course.category}</div>
        {isCompleted && (
          <div className="course-completed-badge">
            <CheckCircle size={14} />
            <span>Completed</span>
          </div>
        )}
      </div>

      {/* Course Content */}
      <div className="course-card-body">
        <h3 className="course-card-title" title={course.title}>{course.title}</h3>
        <p className="course-card-desc">{course.description}</p>

        {/* Progress Section if Enrolled */}
        {isEnrolled && (
          <div className="course-card-progress">
            <div className="progress-meta">
              <span className="progress-label">Your Progress</span>
              <span className="progress-percent">{progress}%</span>
            </div>
            <ProgressBar progress={progress} showLabel={false} height={6} />
          </div>
        )}

        {/* Action Button */}
        <div className="course-card-footer">
          {isEnrolled ? (
            <Link
              to={`/learn/${course._id}`}
              className="btn-continue-learning"
              id={`btn-continue-${course._id}`}
            >
              <PlayCircle size={18} />
              <span>{progress > 0 ? 'Continue Learning' : 'Start Course'}</span>
            </Link>
          ) : isAdmin ? (
            <Link
              to={`/admin/courses`}
              className="btn-admin-manage"
              id={`btn-admin-view-${course._id}`}
            >
              <span>Manage Course</span>
              <ArrowRight size={16} />
            </Link>
          ) : onEnroll ? (
            <button
              onClick={() => onEnroll(course._id)}
              disabled={enrolling}
              className="btn-enroll"
              id={`btn-enroll-${course._id}`}
            >
              <BookOpen size={18} />
              <span>{enrolling ? 'Enrolling...' : 'Enroll Now'}</span>
            </button>
          ) : (
            <Link
              to={`/login?redirect=/courses`}
              className="btn-enroll"
              id={`btn-login-enroll-${course._id}`}
            >
              <BookOpen size={18} />
              <span>Login to Enroll</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseCard;
