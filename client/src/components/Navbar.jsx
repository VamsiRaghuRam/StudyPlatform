import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  BookOpen,
  LayoutDashboard,
  GraduationCap,
  FolderKanban,
  Users,
  BarChart3,
  LogOut,
  LogIn,
  UserPlus
} from 'lucide-react';

const Navbar = () => {
  const { user, logout, isAdmin, isStudent } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="navbar-header" id="main-navbar">
      <div className="navbar-container">
        {/* Brand Logo */}
        <Link to="/" className="navbar-brand" id="nav-brand-logo">
          <div className="brand-icon-box">
            <GraduationCap className="brand-icon" size={24} />
          </div>
          <div className="brand-text">
            <span className="brand-title">Study<span className="brand-accent">Platform</span></span>
            <span className="brand-tagline">Learn. Build. Excel.</span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="navbar-nav" id="nav-menu">
          {/* Public / Student Links */}
          <NavLink
            to="/courses"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            id="nav-link-courses"
          >
            <BookOpen size={18} />
            <span>Courses</span>
          </NavLink>

          {isStudent && (
            <>
              <NavLink
                to="/dashboard"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                id="nav-link-student-dashboard"
              >
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
              </NavLink>

              <NavLink
                to="/my-courses"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                id="nav-link-my-courses"
              >
                <FolderKanban size={18} />
                <span>My Courses</span>
              </NavLink>
            </>
          )}

          {/* Admin Navigation Links */}
          {isAdmin && (
            <>
              <NavLink
                to="/admin"
                end
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                id="nav-link-admin-dash"
              >
                <LayoutDashboard size={18} />
                <span>Admin Hub</span>
              </NavLink>

              <NavLink
                to="/admin/courses"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                id="nav-link-manage-courses"
              >
                <BookOpen size={18} />
                <span>Manage Courses</span>
              </NavLink>

              <NavLink
                to="/admin/students"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                id="nav-link-student-list"
              >
                <Users size={18} />
                <span>Students</span>
              </NavLink>

              <NavLink
                to="/admin/progress"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                id="nav-link-admin-progress"
              >
                <BarChart3 size={18} />
                <span>Progress Reports</span>
              </NavLink>
            </>
          )}
        </nav>

        {/* User Account / Auth Actions */}
        <div className="navbar-actions" id="nav-user-actions">
          {user ? (
            <div className="user-profile-menu">
              <div className="user-badge" id="user-info-badge">
                <span className="user-email" title={user.email}>{user.email}</span>
                <span className={`role-pill ${user.role}`}>
                  {user.role === 'admin' ? 'Admin' : 'Student'}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="btn-logout"
                id="btn-logout"
                title="Log out of account"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <div className="auth-buttons-group">
              <Link to="/login" className="btn-secondary" id="nav-btn-login">
                <LogIn size={16} />
                <span>Login</span>
              </Link>
              <Link to="/register" className="btn-primary" id="nav-btn-register">
                <UserPlus size={16} />
                <span>Register</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
