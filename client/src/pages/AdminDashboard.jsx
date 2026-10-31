import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../services/api';
import {
  Users,
  BookOpen,
  GraduationCap,
  Award,
  Activity,
  PlusCircle,
  BarChart3,
  Calendar,
  Clock,
  ArrowRight
} from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        setLoading(true);
        const res = await adminAPI.getDashboardStats();
        if (res.data?.success) {
          setStats(res.data.stats);
          setRecentActivities(res.data.recentActivities || []);
        }
      } catch (err) {
        console.error('Error fetching admin dashboard:', err);
        setError(err.message || 'Failed to load administrator dashboard.');
      } finally {
        setLoading(false);
      }
    };

    fetchAdminStats();
  }, []);

  if (loading) {
    return (
      <div className="page-container loading-wrapper">
        <div className="spinner"></div>
        <p>Loading administrator statistics...</p>
      </div>
    );
  }

  return (
    <div className="page-container" id="admin-dashboard-page">
      {/* Admin Header */}
      <section className="page-header" id="admin-header">
        <div className="page-header-content">
          <div className="header-badge badge-admin">
            <span>Administrator Control Center</span>
          </div>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">
            Monitor real-time platform metrics, oversee student learning progress, and manage educational courses.
          </p>
        </div>

        <div className="admin-quick-actions">
          <Link to="/admin/courses" className="btn-primary" id="btn-admin-add-course">
            <PlusCircle size={18} />
            <span>Manage & Add Courses</span>
          </Link>
        </div>
      </section>

      {error && (
        <div className="alert-box alert-error">
          <span>{error}</span>
        </div>
      )}

      {/* 4 Metric Cards */}
      <section className="stats-grid" id="admin-stats-grid">
        <div className="stat-card" id="admin-stat-students">
          <div className="stat-icon-wrapper bg-blue-subtle text-blue">
            <Users size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Registered Students</span>
            <h3 className="stat-value">{stats?.totalStudents || 0}</h3>
          </div>
        </div>

        <div className="stat-card" id="admin-stat-courses">
          <div className="stat-icon-wrapper bg-indigo-subtle text-indigo">
            <BookOpen size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Courses</span>
            <h3 className="stat-value">{stats?.totalCourses || 0}</h3>
          </div>
        </div>

        <div className="stat-card" id="admin-stat-enrollments">
          <div className="stat-icon-wrapper bg-purple-subtle text-purple">
            <GraduationCap size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Enrollments</span>
            <h3 className="stat-value">{stats?.totalEnrollments || 0}</h3>
          </div>
        </div>

        <div className="stat-card" id="admin-stat-completed">
          <div className="stat-icon-wrapper bg-emerald-subtle text-emerald">
            <Award size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Completed Courses</span>
            <h3 className="stat-value">{stats?.totalCompleted || 0}</h3>
          </div>
        </div>
      </section>

      {/* Quick Navigation Cards */}
      <section className="admin-shortcuts-grid">
        <Link to="/admin/courses" className="shortcut-card" id="shortcut-courses">
          <div className="shortcut-icon bg-indigo-subtle text-indigo">
            <BookOpen size={20} />
          </div>
          <div className="shortcut-text">
            <h4>Course Management</h4>
            <p>Upload new YouTube video courses, edit descriptions, and publish drafts.</p>
          </div>
          <ArrowRight size={18} className="shortcut-arrow" />
        </Link>

        <Link to="/admin/students" className="shortcut-card" id="shortcut-students">
          <div className="shortcut-icon bg-blue-subtle text-blue">
            <Users size={20} />
          </div>
          <div className="shortcut-text">
            <h4>Student Directory</h4>
            <p>Inspect registered students, their enrolled courses, and last activity timestamps.</p>
          </div>
          <ArrowRight size={18} className="shortcut-arrow" />
        </Link>

        <Link to="/admin/progress" className="shortcut-card" id="shortcut-reports">
          <div className="shortcut-icon bg-purple-subtle text-purple">
            <BarChart3 size={20} />
          </div>
          <div className="shortcut-text">
            <h4>Progress Reports</h4>
            <p>Analyze granular playback position, watch duration, and completion rates.</p>
          </div>
          <ArrowRight size={18} className="shortcut-arrow" />
        </Link>
      </section>

      {/* Recent Student Activities Table */}
      <section className="section-block" id="admin-recent-activities-section">
        <div className="section-header">
          <div>
            <h2 className="section-title">
              <Activity size={20} className="section-icon" />
              Recent Student Activity Stream
            </h2>
            <p className="section-subtitle">Real-time log of events triggered by students across the platform</p>
          </div>
        </div>

        {recentActivities.length === 0 ? (
          <div className="empty-state-box">
            <Activity size={40} className="empty-icon" />
            <p>No student activity recorded yet. Student logins, enrollments, and video progress will appear here.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table" id="activities-table">
              <thead>
                <tr>
                  <th>Student Email</th>
                  <th>Activity Type</th>
                  <th>Associated Course</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {recentActivities.map((act) => (
                  <tr key={act._id}>
                    <td className="font-medium text-dark">{act.studentId?.email || 'N/A'}</td>
                    <td>
                      <span className={`activity-badge badge-${act.activityType.toLowerCase().replace(/\s+/g, '-')}`}>
                        {act.activityType}
                      </span>
                    </td>
                    <td>{act.courseId?.title || '—'}</td>
                    <td className="text-muted">
                      {new Date(act.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminDashboard;
