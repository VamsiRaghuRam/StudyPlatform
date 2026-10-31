import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../services/api';
import { Users, BarChart2, Mail, Calendar, ArrowRight, Award, GraduationCap } from 'lucide-react';

const StudentList = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        const res = await adminAPI.getStudents();
        if (res.data?.success) {
          setStudents(res.data.students || []);
        }
      } catch (err) {
        console.error('Error fetching students:', err);
        setError(err.message || 'Failed to fetch student directory.');
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  return (
    <div className="page-container" id="student-list-page">
      {/* Page Header */}
      <section className="page-header" id="students-header">
        <div className="page-header-content">
          <div className="header-badge badge-admin">
            <span>Student Management</span>
          </div>
          <h1 className="page-title">Registered Students Directory</h1>
          <p className="page-subtitle">
            View student accounts, total enrolled modules, completions, and recent platform interactions.
          </p>
        </div>

        <div className="header-stat-bubble">
          <span className="bubble-number">{students.length}</span>
          <span className="bubble-label">Total Registered Students</span>
        </div>
      </section>

      {error && (
        <div className="alert-box alert-error">
          <span>{error}</span>
        </div>
      )}

      {/* Student Management Table */}
      <section className="section-block">
        {loading ? (
          <div className="loading-wrapper">
            <div className="spinner"></div>
            <p>Loading registered student accounts from MongoDB...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="empty-state-box">
            <Users size={48} className="empty-icon" />
            <h3>No registered students found</h3>
            <p>When students register on the platform, their records and learning activity will appear in this directory.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table" id="students-table">
              <thead>
                <tr>
                  <th>Student Email</th>
                  <th style={{ textAlign: 'center' }}>Enrolled Courses</th>
                  <th style={{ textAlign: 'center' }}>Completed Courses</th>
                  <th>Last Activity</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student._id} id={`student-row-${student._id}`}>
                    <td>
                      <div className="student-profile-cell">
                        <div className="student-avatar-letter">
                          {student.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-semibold text-dark">{student.email}</span>
                          <span className="text-muted text-xs block">
                            Joined {new Date(student.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      <span className="count-pill bg-indigo-subtle text-indigo font-semibold">
                        {student.enrolledCount}
                      </span>
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      <span className="count-pill bg-emerald-subtle text-emerald font-semibold">
                        {student.completedCount}
                      </span>
                    </td>

                    <td>
                      {student.lastActivity ? (
                        <div className="last-activity-cell">
                          <span className="font-medium text-dark">{student.lastActivity.activityType}</span>
                          <span className="text-muted text-xs block">
                            {new Date(student.lastActivity.timestamp).toLocaleString()}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted">No activity yet</span>
                      )}
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <Link
                        to={`/admin/progress?studentId=${student._id}`}
                        className="btn-view-progress"
                        id={`btn-view-progress-${student._id}`}
                      >
                        <BarChart2 size={16} />
                        <span>View Progress</span>
                        <ArrowRight size={14} />
                      </Link>
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

export default StudentList;
