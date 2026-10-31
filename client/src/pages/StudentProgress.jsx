import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { adminAPI } from '../services/api';
import ProgressBar from '../components/ProgressBar';
import {
  BarChart3,
  Users,
  BookOpen,
  CheckCircle,
  Clock,
  PlayCircle,
  ArrowLeft,
  Calendar,
  Award
} from 'lucide-react';

const formatSeconds = (seconds) => {
  if (!seconds || isNaN(seconds)) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const StudentProgress = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStudentId = searchParams.get('studentId') || '';
  const initialCourseId = searchParams.get('courseId') || '';

  const [activeTab, setActiveTab] = useState(initialCourseId ? 'by-course' : 'by-student');

  // Lists for dropdown selectors
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);

  // Selected entities
  const [selectedStudentId, setSelectedStudentId] = useState(initialStudentId);
  const [selectedCourseId, setSelectedCourseId] = useState(initialCourseId);

  // Loaded report data
  const [studentReport, setStudentReport] = useState(null);
  const [courseReport, setCourseReport] = useState(null);

  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initial load of students & courses for dropdowns
  useEffect(() => {
    const loadSelectors = async () => {
      try {
        setLoading(true);
        const [studRes, courseRes] = await Promise.all([
          adminAPI.getStudents(),
          adminAPI.getAllCourses()
        ]);

        const studentList = studRes.data?.students || [];
        const courseList = courseRes.data?.courses || [];

        setStudents(studentList);
        setCourses(courseList);

        // Set default selection if none selected yet
        if (!selectedStudentId && studentList.length > 0) {
          setSelectedStudentId(studentList[0]._id);
        }
        if (!selectedCourseId && courseList.length > 0) {
          setSelectedCourseId(courseList[0]._id);
        }
      } catch (err) {
        console.error('Error loading selector options:', err);
        setError('Failed to load students and courses metadata.');
      } finally {
        setLoading(false);
      }
    };

    loadSelectors();
  }, []);

  // Fetch student report when selectedStudentId changes
  useEffect(() => {
    if (!selectedStudentId || activeTab !== 'by-student') return;

    const fetchStudentReport = async () => {
      try {
        setReportLoading(true);
        const res = await adminAPI.getStudentProgress(selectedStudentId);
        if (res.data?.success) {
          setStudentReport(res.data);
        }
      } catch (err) {
        console.error('Error fetching student progress:', err);
      } finally {
        setReportLoading(false);
      }
    };

    fetchStudentReport();
  }, [selectedStudentId, activeTab]);

  // Fetch course report when selectedCourseId changes
  useEffect(() => {
    if (!selectedCourseId || activeTab !== 'by-course') return;

    const fetchCourseReport = async () => {
      try {
        setReportLoading(true);
        const res = await adminAPI.getCourseProgress(selectedCourseId);
        if (res.data?.success) {
          setCourseReport(res.data);
        }
      } catch (err) {
        console.error('Error fetching course progress:', err);
      } finally {
        setReportLoading(false);
      }
    };

    fetchCourseReport();
  }, [selectedCourseId, activeTab]);

  return (
    <div className="page-container" id="student-progress-page">
      {/* Header */}
      <section className="page-header" id="progress-header">
        <div className="page-header-content">
          <div className="header-badge badge-admin">
            <span>Granular Analytics</span>
          </div>
          <h1 className="page-title">Learning Progress Reports</h1>
          <p className="page-subtitle">
            Inspect individual student progress across enrolled courses, or analyze overall student completion per course.
          </p>
        </div>
      </section>

      {error && (
        <div className="alert-box alert-error">
          <span>{error}</span>
        </div>
      )}

      {/* Tabs Switcher */}
      <div className="tabs-header-bar" id="report-view-tabs">
        <button
          className={`tab-btn ${activeTab === 'by-student' ? 'active' : ''}`}
          onClick={() => setActiveTab('by-student')}
          id="tab-btn-by-student"
        >
          <Users size={18} />
          <span>Student-wise Progress</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'by-course' ? 'active' : ''}`}
          onClick={() => setActiveTab('by-course')}
          id="tab-btn-by-course"
        >
          <BookOpen size={18} />
          <span>Course-wise Student Progress</span>
        </button>
      </div>

      {/* Tab 1: Student-wise Progress */}
      {activeTab === 'by-student' && (
        <div className="tab-pane active" id="pane-by-student">
          {/* Selector Card */}
          <div className="report-filter-card">
            <div className="form-group mb-0">
              <label htmlFor="select-student">Select Student to Inspect:</label>
              <select
                id="select-student"
                value={selectedStudentId}
                onChange={(e) => {
                  setSelectedStudentId(e.target.value);
                  setSearchParams({ studentId: e.target.value });
                }}
                disabled={students.length === 0}
              >
                {students.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.email} ({s.enrolledCount} enrolled)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {reportLoading ? (
            <div className="loading-wrapper">
              <div className="spinner"></div>
              <p>Loading student learning report...</p>
            </div>
          ) : !studentReport?.student ? (
            <div className="empty-state-box">
              <Users size={40} className="empty-icon" />
              <p>Select a student from the dropdown above to view their course progress.</p>
            </div>
          ) : (
            <div className="student-report-wrapper">
              {/* Student Overview Header */}
              <div className="report-overview-card">
                <div className="overview-meta">
                  <h3>{studentReport.student.email}</h3>
                  <span className="text-muted">
                    Joined on {new Date(studentReport.student.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="overview-stats">
                  <div className="stat-pill">
                    <span className="stat-num">{studentReport.enrollments.length}</span>
                    <span className="stat-name">Enrolled Courses</span>
                  </div>
                  <div className="stat-pill">
                    <span className="stat-num text-emerald">
                      {studentReport.enrollments.filter(e => e.status === 'Completed' || e.progress >= 90).length}
                    </span>
                    <span className="stat-name">Completed</span>
                  </div>
                </div>
              </div>

              {/* Enrollments Progress Table */}
              <div className="section-block">
                <h3 className="section-title mb-4">Course Enrollments & Progress</h3>
                {studentReport.enrollments.length === 0 ? (
                  <div className="empty-state-box">
                    <p>This student is not currently enrolled in any courses.</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="data-table" id="student-enrollments-table">
                      <thead>
                        <tr>
                          <th>Course Name & Category</th>
                          <th>Progress Percentage</th>
                          <th>Video Playback Position</th>
                          <th>Last Accessed</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {studentReport.enrollments.map((enrollment) => (
                          <tr key={enrollment._id}>
                            <td>
                              <div className="course-table-meta">
                                <span className="font-semibold text-dark">
                                  {enrollment.courseId?.title || 'Unknown Course'}
                                </span>
                                <span className="course-cat-tag table-cat">
                                  {enrollment.courseId?.category || 'General'}
                                </span>
                              </div>
                            </td>

                            <td style={{ minWidth: '160px' }}>
                              <div className="table-progress-cell">
                                <ProgressBar progress={enrollment.progress} height={8} />
                              </div>
                            </td>

                            <td>
                              <div className="playback-position-cell">
                                <Clock size={14} className="text-muted" />
                                <span>{formatSeconds(enrollment.lastPosition)}</span>
                                {enrollment.durationSeconds > 0 && (
                                  <span className="text-muted text-xs">
                                    / {formatSeconds(enrollment.durationSeconds)}
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="text-muted">
                              {new Date(enrollment.lastAccessedAt).toLocaleString()}
                            </td>

                            <td>
                              <span
                                className={`activity-badge badge-${
                                  enrollment.status === 'Completed' ? 'completed' : 'in-progress'
                                }`}
                              >
                                {enrollment.status === 'Completed' ? 'Completed' : 'In Progress'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Course-wise Student Progress */}
      {activeTab === 'by-course' && (
        <div className="tab-pane active" id="pane-by-course">
          {/* Selector Card */}
          <div className="report-filter-card">
            <div className="form-group mb-0">
              <label htmlFor="select-course">Select Course to Inspect:</label>
              <select
                id="select-course"
                value={selectedCourseId}
                onChange={(e) => {
                  setSelectedCourseId(e.target.value);
                  setSearchParams({ courseId: e.target.value });
                }}
                disabled={courses.length === 0}
              >
                {courses.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.title} ({c.category}) - {c.status}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {reportLoading ? (
            <div className="loading-wrapper">
              <div className="spinner"></div>
              <p>Loading course enrollment reports...</p>
            </div>
          ) : !courseReport?.course ? (
            <div className="empty-state-box">
              <BookOpen size={40} className="empty-icon" />
              <p>Select a course from the dropdown above to view student progress.</p>
            </div>
          ) : (
            <div className="course-report-wrapper">
              {/* Course Overview Card */}
              <div className="report-overview-card">
                <div className="overview-meta">
                  <h3>{courseReport.course.title}</h3>
                  <span className="course-cat-tag">{courseReport.course.category}</span>
                  <p className="text-muted text-sm mt-1">{courseReport.course.description}</p>
                </div>
                <div className="overview-stats">
                  <div className="stat-pill">
                    <span className="stat-num">{courseReport.count}</span>
                    <span className="stat-name">Total Enrolled Students</span>
                  </div>
                  <div className="stat-pill">
                    <span className="stat-num text-emerald">
                      {courseReport.enrollments.filter(e => e.status === 'Completed' || e.progress >= 90).length}
                    </span>
                    <span className="stat-name">Completed Students</span>
                  </div>
                </div>
              </div>

              {/* Table of students enrolled in this course */}
              <div className="section-block">
                <h3 className="section-title mb-4">Enrolled Students Progress</h3>
                {courseReport.enrollments.length === 0 ? (
                  <div className="empty-state-box">
                    <p>No students have enrolled in this course yet.</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="data-table" id="course-students-table">
                      <thead>
                        <tr>
                          <th>Student Email</th>
                          <th>Progress Percentage</th>
                          <th>Last Playback Position</th>
                          <th>Last Accessed Date</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {courseReport.enrollments.map((enr) => (
                          <tr key={enr._id}>
                            <td className="font-semibold text-dark">
                              {enr.studentId?.email || 'Unknown Student'}
                            </td>

                            <td style={{ minWidth: '160px' }}>
                              <div className="table-progress-cell">
                                <ProgressBar progress={enr.progress} height={8} />
                              </div>
                            </td>

                            <td>
                              <div className="playback-position-cell">
                                <Clock size={14} className="text-muted" />
                                <span>{formatSeconds(enr.lastPosition)}</span>
                              </div>
                            </td>

                            <td className="text-muted">
                              {new Date(enr.lastAccessedAt).toLocaleString()}
                            </td>

                            <td>
                              <span
                                className={`activity-badge badge-${
                                  enr.status === 'Completed' ? 'completed' : 'in-progress'
                                }`}
                              >
                                {enr.status === 'Completed' ? 'Completed' : 'In Progress'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentProgress;
