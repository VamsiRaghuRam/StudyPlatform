import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { courseAPI, progressAPI } from '../services/api';
import ProgressBar from '../components/ProgressBar';
import { extractYouTubeId, formatTime, loadYouTubeIframeApi } from '../utils/youtube';
import {
  ArrowLeft,
  CheckCircle,
  Play,
  Pause,
  RotateCcw,
  Clock,
  BookOpen,
  Award,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  Info
} from 'lucide-react';

const CoursePlayer = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();

  // Course and enrollment records from MongoDB
  const [course, setCourse] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // Player UI states
  const [playerLoading, setPlayerLoading] = useState(true);
  const [playerError, setPlayerError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPlaybackTime, setCurrentPlaybackTime] = useState(0);
  const [totalVideoDuration, setTotalVideoDuration] = useState(0);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [saveStatus, setSaveStatus] = useState(''); // 'saving' | 'saved'

  // Refs for stable player access without re-rendering triggers
  const playerRef = useRef(null);
  const containerId = `yt-player-${courseId}`;
  const enrollmentRef = useRef(null);
  const isFirstStartRef = useRef(true);
  const accumulatedDeltaRef = useRef(0);
  const lastPositionRef = useRef(0);
  const syncTimerRef = useRef(null);
  const isSyncingRef = useRef(false);

  // Keep enrollment ref current
  useEffect(() => {
    enrollmentRef.current = enrollment;
  }, [enrollment]);

  // Synchronize progress to MongoDB
  const sendProgressUpdate = useCallback(async (eventType = 'progress') => {
    if (!enrollmentRef.current || isSyncingRef.current) return;

    const player = playerRef.current;
    if (!player || typeof player.getCurrentTime !== 'function') return;

    try {
      isSyncingRef.current = true;
      const currentPos = player.getCurrentTime ? player.getCurrentTime() : lastPositionRef.current;
      const duration = (player.getDuration && player.getDuration() > 0)
        ? player.getDuration()
        : (totalVideoDuration || enrollmentRef.current.durationSeconds || 0);

      const delta = accumulatedDeltaRef.current;
      accumulatedDeltaRef.current = 0; // Reset accumulated delta

      setSaveStatus('saving');

      const res = await progressAPI.updateProgress(enrollmentRef.current._id, {
        lastPosition: currentPos,
        durationSeconds: duration,
        deltaSeconds: delta,
        eventType
      });

      if (res.data?.success && res.data?.enrollment) {
        const updated = res.data.enrollment;
        setEnrollment(updated);
        setCurrentProgress(updated.progress || 0);
        if (updated.status === 'Completed' || updated.progress >= 90) {
          setIsCompleted(true);
        }
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus(''), 2500);
      }
    } catch (err) {
      console.warn('Progress update warning:', err.message);
      setSaveStatus('');
    } finally {
      isSyncingRef.current = false;
    }
  }, [totalVideoDuration]);

  // Fetch Course & Enrollment from MongoDB on mount
  useEffect(() => {
    let isMounted = true;

    const fetchCourseData = async () => {
      try {
        setPageLoading(true);
        setFetchError(null);
        const res = await courseAPI.getCourseById(courseId);

        if (!isMounted) return;

        if (res.data?.success) {
          setCourse(res.data.course);

          if (res.data.enrollment) {
            const enr = res.data.enrollment;
            setEnrollment(enr);
            setCurrentProgress(enr.progress || 0);
            setCurrentPlaybackTime(enr.lastPosition || 0);
            lastPositionRef.current = enr.lastPosition || 0;
            if (enr.durationSeconds > 0) {
              setTotalVideoDuration(enr.durationSeconds);
            }
            if (enr.status === 'Completed' || enr.progress >= 90) {
              setIsCompleted(true);
            }
          } else {
            // Auto-enroll if not enrolled
            try {
              const enrollRes = await courseAPI.enrollCourse(courseId);
              if (enrollRes.data?.success && isMounted) {
                setEnrollment(enrollRes.data.enrollment);
              }
            } catch (enrollErr) {
              console.warn('Auto-enroll skipped:', enrollErr.message);
              navigate('/courses');
            }
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error loading course player:', err);
          setFetchError(err.message || 'Course could not be loaded.');
        }
      } finally {
        if (isMounted) {
          setPageLoading(false);
        }
      }
    };

    fetchCourseData();

    return () => {
      isMounted = false;
    };
  }, [courseId, navigate]);

  // Initialize YouTube Player ONLY ONCE when course data is ready
  useEffect(() => {
    if (pageLoading || !course?.videoUrl) return;

    const videoId = extractYouTubeId(course.videoUrl);
    if (!videoId) {
      setPlayerError('Invalid YouTube video link configured for this course. Please contact the administrator.');
      setPlayerLoading(false);
      return;
    }

    let isComponentMounted = true;
    let localPlayer = null;

    const setupPlayer = async () => {
      try {
        setPlayerLoading(true);
        setPlayerError(null);

        // Load YouTube IFrame API safely
        const YT = await loadYouTubeIframeApi();

        if (!isComponentMounted) return;

        // Clean up previous instance if exists
        if (playerRef.current && typeof playerRef.current.destroy === 'function') {
          try {
            playerRef.current.destroy();
          } catch {
            // Ignore
          }
        }

        localPlayer = new YT.Player(containerId, {
          videoId: videoId,
          playerVars: {
            autoplay: 0,
            controls: 1,
            rel: 0,
            modestbranding: 1,
            fs: 1,
            playsinline: 1
          },
          events: {
            onReady: (event) => {
              if (!isComponentMounted) return;
              setPlayerLoading(false);
              setPlayerError(null);

              // Retrieve duration
              const duration = event.target.getDuration ? event.target.getDuration() : 0;
              if (duration > 0) {
                setTotalVideoDuration(duration);
              }

              // Resume playback from saved position
              const savedPosition = enrollmentRef.current?.lastPosition || 0;
              if (savedPosition > 0 && (duration <= 0 || savedPosition < duration)) {
                event.target.seekTo(savedPosition, true);
                setCurrentPlaybackTime(savedPosition);
                lastPositionRef.current = savedPosition;
              }
            },
            onStateChange: (event) => {
              if (!isComponentMounted) return;

              // YT.PlayerState.PLAYING = 1
              if (event.data === window.YT.PlayerState.PLAYING) {
                setIsPlaying(true);
                setPlayerError(null);

                // Update duration if previously 0
                const dur = localPlayer.getDuration ? localPlayer.getDuration() : 0;
                if (dur > 0) {
                  setTotalVideoDuration(dur);
                }

                lastPositionRef.current = localPlayer.getCurrentTime ? localPlayer.getCurrentTime() : 0;

                // First time video started
                if (isFirstStartRef.current && (enrollmentRef.current?.lastPosition || 0) === 0) {
                  isFirstStartRef.current = false;
                  sendProgressUpdate('start');
                }
              }
              // YT.PlayerState.PAUSED = 2
              else if (event.data === window.YT.PlayerState.PAUSED) {
                setIsPlaying(false);
                sendProgressUpdate('pause');
              }
              // YT.PlayerState.ENDED = 0
              else if (event.data === window.YT.PlayerState.ENDED) {
                setIsPlaying(false);
                sendProgressUpdate('progress');
              } else {
                setIsPlaying(false);
              }
            },
            onError: (event) => {
              if (!isComponentMounted) return;
              setPlayerLoading(false);
              setIsPlaying(false);

              let message = 'This video cannot be played.';
              if (event.data === 2) {
                message = 'The YouTube video link or parameter is invalid.';
              } else if (event.data === 5) {
                message = 'The video cannot be played in the HTML5 player.';
              } else if (event.data === 100) {
                message = 'This video was not found (it may be private, restricted, or deleted).';
              } else if (event.data === 101 || event.data === 150) {
                message = 'The owner of this YouTube video does not allow embedded playback on other websites.';
              }
              setPlayerError(message);
            }
          }
        });

        playerRef.current = localPlayer;
      } catch (err) {
        if (isComponentMounted) {
          console.error('Failed to initialize YouTube Player:', err);
          setPlayerLoading(false);
          setPlayerError('Could not connect to YouTube IFrame services. Please check your internet connection.');
        }
      }
    };

    setupPlayer();

    // Cleanup on unmount or when courseId changes
    return () => {
      isComponentMounted = false;
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        try {
          playerRef.current.destroy();
          playerRef.current = null;
        } catch {
          // Ignore
        }
      }
    };
  }, [pageLoading, courseId, containerId]);

  // Active Playback Clock & Elapsed Continuous Watch Tracking (Every 1s while playing)
  useEffect(() => {
    let timer = null;

    if (isPlaying) {
      timer = setInterval(() => {
        const player = playerRef.current;
        if (!player || typeof player.getCurrentTime !== 'function') return;

        const currentPos = player.getCurrentTime();
        const prevPos = lastPositionRef.current;
        const delta = currentPos - prevPos;

        // Normal continuous playback: delta between 0 and 1.5 seconds
        if (delta > 0 && delta <= 1.5) {
          accumulatedDeltaRef.current += delta;
        }
        // If delta > 1.5 or < 0, the student seeked; do not add seek jumps to watched seconds!

        lastPositionRef.current = currentPos;
        setCurrentPlaybackTime(currentPos);

        // Check if duration can be updated
        if (player.getDuration && totalVideoDuration === 0) {
          const d = player.getDuration();
          if (d > 0) setTotalVideoDuration(d);
        }
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, totalVideoDuration]);

  // Periodic Progress Sync (~every 10 seconds while playing)
  useEffect(() => {
    let periodicTimer = null;

    if (isPlaying) {
      periodicTimer = setInterval(() => {
        sendProgressUpdate('progress');
      }, 10000);
    }

    return () => {
      if (periodicTimer) clearInterval(periodicTimer);
    };
  }, [isPlaying, sendProgressUpdate]);

  // Sync on window beforeunload or component unmount
  useEffect(() => {
    const handleBeforeUnload = () => {
      sendProgressUpdate('pause');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      sendProgressUpdate('pause');
    };
  }, [sendProgressUpdate]);

  if (pageLoading) {
    return (
      <div className="page-container loading-wrapper">
        <div className="spinner"></div>
        <p>Loading course details and video player...</p>
      </div>
    );
  }

  if (fetchError || !course) {
    return (
      <div className="page-container">
        <div className="alert-box alert-error">
          <AlertTriangle size={18} />
          <span>{fetchError || 'Course could not be loaded.'}</span>
        </div>
        <Link to="/my-courses" className="btn-secondary" style={{ marginTop: '1rem', display: 'inline-flex' }}>
          <ArrowLeft size={16} />
          <span>Back to My Courses</span>
        </Link>
      </div>
    );
  }

  const effectiveDuration = totalVideoDuration || enrollment?.durationSeconds || 0;

  return (
    <div className="page-container player-page-container" id="course-player-page">
      {/* Top Navigation Bar */}
      <div className="player-topbar">
        <Link to="/my-courses" className="btn-back" id="btn-back-to-courses">
          <ArrowLeft size={18} />
          <span>Back to My Courses</span>
        </Link>

        <div className="player-meta-badges">
          <span className="course-cat-tag">{course.category}</span>
          {isCompleted ? (
            <div className="badge-completed-status" id="badge-course-completed">
              <Award size={16} />
              <span>Course Completed (100%)</span>
            </div>
          ) : (
            <div className="badge-in-progress" id="badge-in-progress">
              <Sparkles size={14} />
              <span>In Progress ({currentProgress}%)</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Video Player Container */}
      <div className="player-grid-layout">
        <div className="player-main-column">
          <div className="video-viewport-wrapper">
            {/* YouTube Embed Mount Container */}
            <div id={containerId} className="yt-iframe-embed"></div>

            {/* Loading Overlay */}
            {playerLoading && !playerError && (
              <div className="player-overlay loading-overlay" id="player-loading-overlay">
                <div className="spinner"></div>
                <span>Initializing YouTube Player...</span>
              </div>
            )}

            {/* Error Overlay */}
            {playerError && (
              <div className="player-overlay error-overlay" id="player-error-overlay">
                <AlertTriangle size={36} className="text-danger" />
                <h4>Video Playback Notice</h4>
                <p>{playerError}</p>
                <div className="player-error-actions">
                  <button
                    onClick={() => {
                      setPlayerLoading(true);
                      setPlayerError(null);
                      setPageLoading(true);
                      setTimeout(() => setPageLoading(false), 200);
                    }}
                    className="btn-secondary btn-sm"
                  >
                    <RefreshCw size={14} />
                    <span>Try Reloading Player</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Interactive Progress Bar & Playback Status */}
          <div className="player-progress-card" id="player-progress-bar-card">
            <div className="progress-details-header">
              <div className="progress-status-left">
                <span className="progress-title">Your Learning Progress</span>
                {saveStatus && (
                  <span className={`save-indicator ${saveStatus}`} id="save-status-indicator">
                    {saveStatus === 'saving' ? 'Syncing progress...' : 'Progress saved to database ✓'}
                  </span>
                )}
              </div>
              <div className="progress-status-right">
                <span className="progress-percentage-display" id="progress-percentage-display">
                  {currentProgress}%
                </span>
              </div>
            </div>

            {/* Visual Progress Bar */}
            <ProgressBar
              progress={currentProgress}
              showLabel={false}
              height={10}
              color={isCompleted ? 'emerald' : 'primary'}
            />

            {/* Time Indicators */}
            <div className="playback-timer-row">
              <div className="playback-time-badge" id="playback-current-time">
                <Clock size={14} />
                <span>Current Position: <strong>{formatTime(currentPlaybackTime)}</strong></span>
              </div>
              <div className="playback-duration-badge" id="playback-total-duration">
                <span>
                  Total Duration:{' '}
                  <strong>
                    {effectiveDuration > 0 ? formatTime(effectiveDuration) : (playerLoading ? 'Loading duration...' : 'Unknown')}
                  </strong>
                </span>
              </div>
            </div>

            {/* Celebration alert on completion */}
            {currentProgress >= 90 && (
              <div className="completion-celebration-banner" id="completion-banner">
                <CheckCircle size={22} className="text-emerald" />
                <div>
                  <strong>Congratulations! You have completed this course!</strong>
                  <p>You have viewed over 90% of the video material. Your course completion is saved in MongoDB.</p>
                </div>
              </div>
            )}
          </div>

          {/* Course Details Section */}
          <div className="course-info-card">
            <h1 className="course-view-title">{course.title}</h1>
            <div className="course-view-meta">
              <span>Category: <strong>{course.category}</strong></span>
              <span>•</span>
              <span>Enrolled: <strong>{new Date(enrollment?.enrolledAt || Date.now()).toLocaleDateString()}</strong></span>
              <span>•</span>
              <span>Last Accessed: <strong>{new Date(enrollment?.lastAccessedAt || Date.now()).toLocaleTimeString()}</strong></span>
            </div>
            <div className="course-view-description">
              <h3>About this course</h3>
              <p>{course.description}</p>
            </div>
          </div>
        </div>

        {/* Sidebar Information */}
        <aside className="player-sidebar">
          <div className="sidebar-card">
            <div className="sidebar-card-header">
              <BookOpen size={18} />
              <h3>Course Lesson</h3>
            </div>
            <div className="sidebar-lesson-item active">
              <div className="lesson-icon-state">
                {isCompleted ? <CheckCircle size={18} className="text-emerald" /> : <Play size={16} />}
              </div>
              <div className="lesson-info">
                <span className="lesson-number">Lesson 1</span>
                <span className="lesson-title">{course.title}</span>
                <span className="lesson-duration">
                  {effectiveDuration > 0 ? formatTime(effectiveDuration) : 'Video Lesson'}
                </span>
              </div>
            </div>

            <div className="resume-info-note">
              <Info size={16} />
              <p>
                Playback progress and watched time automatically synchronize to MongoDB approximately every 10 seconds and on pause. When you return, playback resumes from your saved position.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default CoursePlayer;
