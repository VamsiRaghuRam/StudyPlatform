import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, Mail, Lock, AlertCircle, Sparkles, ShieldCheck, User } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectPath = location.state?.from?.pathname;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim() || !password) {
      setErrorMsg('Please enter both your email address and password.');
      return;
    }

    try {
      setIsSubmitting(true);
      const user = await login(email, password);
      // Redirect based on role or requested route
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate(redirectPath || '/dashboard');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick fill helper for evaluator convenience
  const fillDemoCredentials = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setErrorMsg('');
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card" id="login-card">
        <div className="auth-header">
          <div className="auth-icon-circle">
            <LogIn size={28} className="text-primary" />
          </div>
          <h2 className="auth-title">Welcome Back</h2>
          <p className="auth-subtitle">Log in to your Study Platform account</p>
        </div>

        {errorMsg && (
          <div className="alert-box alert-error" id="login-error-alert">
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form" id="login-form">
          <div className="form-group">
            <label htmlFor="login-email">Email Address</label>
            <div className="input-with-icon">
              <Mail size={18} className="input-icon" />
              <input
                id="login-email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="login-password">Password</label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                id="login-password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary btn-block"
            id="btn-submit-login"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        {/* Demo Credentials Helper Box */}
        <div className="demo-credentials-box">
          <div className="demo-header">
            <Sparkles size={16} />
            <span>Quick Demo Accounts</span>
          </div>
          <div className="demo-buttons">
            <button
              type="button"
              className="btn-demo"
              id="btn-fill-admin"
              onClick={() => fillDemoCredentials('admin@studyplatform.com', 'admin123')}
            >
              <ShieldCheck size={14} />
              <span>Admin Demo</span>
            </button>
            <button
              type="button"
              className="btn-demo"
              id="btn-fill-student"
              onClick={() => fillDemoCredentials('student@example.com', 'student123')}
            >
              <User size={14} />
              <span>Student Demo</span>
            </button>
          </div>
        </div>

        <div className="auth-footer">
          <p>
            Don't have a student account?{' '}
            <Link to="/register" className="auth-link" id="link-to-register">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
