import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  CheckCircle,
  XCircle,
  AlertCircle,
  X,
  Sparkles,
  Video
} from 'lucide-react';

import { isValidYouTubeUrl } from '../utils/youtube';

const ManageCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Web Development',
    thumbnailUrl: '',
    videoUrl: '',
    status: 'Draft'
  });
  const [submitting, setSubmitting] = useState(false);

  const categories = ['Web Development', 'Programming Languages', 'Frontend Frameworks', 'Data Science', 'Cloud & DevOps'];

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getAllCourses();
      if (res.data?.success) {
        setCourses(res.data.courses || []);
      }
    } catch (err) {
      console.error('Error fetching admin courses:', err);
      setError(err.message || 'Failed to fetch courses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const openAddModal = () => {
    setEditingCourse(null);
    setFormData({
      title: '',
      description: '',
      category: 'Web Development',
      thumbnailUrl: '',
      videoUrl: '',
      status: 'Published'
    });
    setIsModalOpen(true);
    setError(null);
  };

  const openEditModal = (course) => {
    setEditingCourse(course);
    setFormData({
      title: course.title,
      description: course.description,
      category: course.category,
      thumbnailUrl: course.thumbnailUrl || '',
      videoUrl: course.videoUrl,
      status: course.status
    });
    setIsModalOpen(true);
    setError(null);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCourse(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.title.trim() || !formData.description.trim() || !formData.videoUrl.trim()) {
      setError('Title, Description, and YouTube Video URL are required.');
      return;
    }

    if (!isValidYouTubeUrl(formData.videoUrl)) {
      setError('Invalid YouTube URL. Please provide a valid YouTube watch link, shortened youtu.be link, or video ID.');
      return;
    }

    try {
      setSubmitting(true);
      if (editingCourse) {
        const res = await adminAPI.updateCourse(editingCourse._id, formData);
        if (res.data?.success) {
          setSuccessMsg('Course updated successfully!');
          closeModal();
          fetchCourses();
        }
      } else {
        const res = await adminAPI.createCourse(formData);
        if (res.data?.success) {
          setSuccessMsg('Course added successfully!');
          closeModal();
          fetchCourses();
        }
      }
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to save course.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (course) => {
    const newStatus = course.status === 'Published' ? 'Draft' : 'Published';
    try {
      const res = await adminAPI.updateCourse(course._id, { status: newStatus });
      if (res.data?.success) {
        setSuccessMsg(`Course status changed to ${newStatus}`);
        fetchCourses();
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      setError(err.message || 'Failed to update course status.');
    }
  };

  const handleDelete = async (courseId, courseTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${courseTitle}"? All student enrollment records for this course will also be removed.`)) {
      return;
    }

    try {
      const res = await adminAPI.deleteCourse(courseId);
      if (res.data?.success) {
        setSuccessMsg('Course deleted successfully.');
        fetchCourses();
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      setError(err.message || 'Failed to delete course.');
    }
  };

  return (
    <div className="page-container" id="manage-courses-page">
      {/* Page Header */}
      <section className="page-header" id="courses-header">
        <div className="page-header-content">
          <div className="header-badge badge-admin">
            <span>Course Administration</span>
          </div>
          <h1 className="page-title">Manage Courses</h1>
          <p className="page-subtitle">
            Upload new video lessons with YouTube links, update curriculums, and toggle course visibility.
          </p>
        </div>

        <button onClick={openAddModal} className="btn-primary" id="btn-open-add-course-modal">
          <Plus size={18} />
          <span>Add New Course</span>
        </button>
      </section>

      {/* Messages */}
      {successMsg && (
        <div className="alert-box alert-success" id="course-success-alert">
          <CheckCircle size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="alert-box alert-error" id="course-error-alert">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Courses Table */}
      <section className="section-block">
        {loading ? (
          <div className="loading-wrapper">
            <div className="spinner"></div>
            <p>Loading course records...</p>
          </div>
        ) : courses.length === 0 ? (
          <div className="empty-state-box">
            <BookOpen size={48} className="empty-icon" />
            <h3>No courses uploaded yet</h3>
            <p>Click "Add New Course" above to create your first course with a YouTube video.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table" id="admin-courses-table">
              <thead>
                <tr>
                  <th>Course Title & Category</th>
                  <th>YouTube URL</th>
                  <th>Status</th>
                  <th>Created Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course) => (
                  <tr key={course._id}>
                    <td>
                      <div className="course-table-meta">
                        <span className="font-semibold text-dark">{course.title}</span>
                        <span className="course-cat-tag table-cat">{course.category}</span>
                      </div>
                    </td>
                    <td>
                      <a
                        href={course.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="yt-link-preview"
                        title="Open video in new tab"
                      >
                        <Video size={14} />
                        <span>Watch on YouTube</span>
                        <ExternalLink size={12} />
                      </a>
                    </td>
                    <td>
                      <button
                        onClick={() => handleToggleStatus(course)}
                        className={`status-toggle-pill ${course.status.toLowerCase()}`}
                        title="Click to toggle Draft / Published status"
                      >
                        {course.status === 'Published' ? (
                          <>
                            <CheckCircle size={12} />
                            <span>Published</span>
                          </>
                        ) : (
                          <>
                            <XCircle size={12} />
                            <span>Draft</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="text-muted">
                      {new Date(course.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="action-buttons-group">
                        <button
                          onClick={() => openEditModal(course)}
                          className="btn-icon"
                          id={`btn-edit-course-${course._id}`}
                          title="Edit Course"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(course._id, course.title)}
                          className="btn-icon text-danger"
                          id={`btn-delete-course-${course._id}`}
                          title="Delete Course"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Modal Dialog for Add / Edit Course */}
      {isModalOpen && (
        <div className="modal-overlay" id="course-modal-backdrop">
          <div className="modal-container" id="course-modal">
            <div className="modal-header">
              <div className="modal-title-group">
                <BookOpen size={20} className="text-primary" />
                <h3>{editingCourse ? 'Edit Course Details' : 'Add New Course'}</h3>
              </div>
              <button onClick={closeModal} className="btn-close-modal" id="btn-close-course-modal">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-body" id="course-edit-form">
              <div className="form-group">
                <label htmlFor="course-title">Course Title *</label>
                <input
                  id="course-title"
                  type="text"
                  placeholder="e.g. Modern Full Stack Node.js"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="course-category">Category *</label>
                <select
                  id="course-category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="course-video-url">YouTube Video URL *</label>
                <input
                  id="course-video-url"
                  type="url"
                  placeholder="e.g. https://www.youtube.com/watch?v=W6NZfCO5SIk"
                  value={formData.videoUrl}
                  onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                  required
                />
                <span className="field-hint">Accepts standard YouTube watch URLs, short URLs, or embed links.</span>
              </div>

              <div className="form-group">
                <label htmlFor="course-thumbnail-url">Thumbnail Image URL (Optional)</label>
                <input
                  id="course-thumbnail-url"
                  type="url"
                  placeholder="e.g. https://images.unsplash.com/photo-..."
                  value={formData.thumbnailUrl}
                  onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label htmlFor="course-status">Publish Status</label>
                <select
                  id="course-status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="Published">Published (Visible to all students)</option>
                  <option value="Draft">Draft (Admin only)</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="course-description">Course Description *</label>
                <textarea
                  id="course-description"
                  rows={4}
                  placeholder="Provide an overview of the curriculum and learning objectives..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                ></textarea>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={closeModal} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submitting} id="btn-save-course">
                  {submitting ? 'Saving...' : editingCourse ? 'Save Changes' : 'Create Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageCourses;
