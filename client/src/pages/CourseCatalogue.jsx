import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { courseAPI } from '../services/api';
import CourseCard from '../components/CourseCard';
import { Search, BookOpen, Filter, CheckCircle2, AlertCircle } from 'lucide-react';

const CourseCatalogue = () => {
  const { user, isStudent, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [enrollingId, setEnrollingId] = useState(null);
  const [notification, setNotification] = useState(null);

  // Categories list
  const categories = ['All', 'Web Development', 'Programming Languages', 'Frontend Frameworks'];

  const fetchCourses = async (search = '', category = 'All') => {
    try {
      setLoading(true);
      const res = await courseAPI.getCourses(search, category === 'All' ? '' : category);
      if (res.data?.success) {
        setCourses(res.data.courses || []);
      }
    } catch (err) {
      console.error('Error fetching courses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses(searchQuery, selectedCategory);
  }, [selectedCategory]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCourses(searchQuery, selectedCategory);
  };

  const handleEnroll = async (courseId) => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: '/courses' } } });
      return;
    }

    if (isAdmin) {
      setNotification({ type: 'error', message: 'Administrators cannot enroll as students. Please use student account.' });
      return;
    }

    try {
      setEnrollingId(courseId);
      setNotification(null);
      const res = await courseAPI.enrollCourse(courseId);
      if (res.data?.success) {
        setNotification({
          type: 'success',
          message: 'Enrolled successfully! You can now start learning.'
        });
        // Update local courses state to mark as enrolled
        setCourses((prevCourses) =>
          prevCourses.map((c) =>
            c._id === courseId ? { ...c, isEnrolled: true } : c
          )
        );
      }
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.message || 'Enrollment failed.'
      });
    } finally {
      setEnrollingId(null);
    }
  };

  return (
    <div className="page-container" id="course-catalogue-page">
      {/* Header section */}
      <section className="page-header" id="catalogue-header">
        <div className="page-header-content">
          <div className="header-badge">
            <BookOpen size={14} />
            <span>Curated Curriculum</span>
          </div>
          <h1 className="page-title">Explore Course Catalogue</h1>
          <p className="page-subtitle">
            Browse our comprehensive collection of video courses, master new technologies, and accelerate your engineering journey.
          </p>
        </div>
      </section>

      {/* Notification banner */}
      {notification && (
        <div
          className={`alert-box ${notification.type === 'success' ? 'alert-success' : 'alert-error'}`}
          id="catalogue-notification-alert"
        >
          {notification.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Search and Filters Bar */}
      <section className="search-filter-section" id="catalogue-filter-bar">
        <form onSubmit={handleSearchSubmit} className="search-form" id="course-search-form">
          <div className="search-input-wrapper">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              id="input-course-search"
              placeholder="Search courses by title or topic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-secondary" id="btn-submit-search">
            Search
          </button>
        </form>

        <div className="category-filter-pills" id="category-pills">
          <div className="filter-label">
            <Filter size={14} />
            <span>Category:</span>
          </div>
          {categories.map((cat) => (
            <button
              key={cat}
              className={`pill-btn ${selectedCategory === cat ? 'active' : ''}`}
              id={`pill-category-${cat.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Courses Grid */}
      <section className="courses-catalogue-grid" id="catalogue-courses-list">
        {loading ? (
          <div className="loading-wrapper">
            <div className="spinner"></div>
            <p>Loading courses from database...</p>
          </div>
        ) : courses.length === 0 ? (
          <div className="empty-state-box" id="empty-catalogue-results">
            <BookOpen size={48} className="empty-icon" />
            <h3>No courses found</h3>
            <p>
              {searchQuery
                ? `No courses match "${searchQuery}". Try a different search term or category.`
                : 'No published courses are currently available in this category.'}
            </p>
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                  fetchCourses('', 'All');
                }}
                className="btn-secondary"
                id="btn-clear-search"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div className="courses-grid" id="all-courses-grid">
            {courses.map((course) => (
              <CourseCard
                key={course._id}
                course={course}
                isEnrolled={course.isEnrolled}
                onEnroll={user && isStudent ? handleEnroll : null}
                enrolling={enrollingId === course._id}
                isAdmin={isAdmin}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default CourseCatalogue;
