const User = require('../models/User');
const Activity = require('../models/Activity');

// @desc Register a new student
// @route POST /api/auth/register
const register = async (req, res) => {
  try {
    const { email, password, confirmPassword } = req.body;

    // Validate inputs
    if (!email || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all fields (Email, Password, Confirm Password).'
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match.'
      });
    }

    if (password.length < 4) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 4 characters long.'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email address already exists.'
      });
    }

    // Always enforce 'student' role for public registrations
    const newUser = await User.create({
      email: normalizedEmail,
      password,
      role: 'student'
    });

    // Regenerate session and set session data
    req.session.regenerate((err) => {
      if (err) {
        console.error('Session regeneration error on register:', err);
        return res.status(500).json({ success: false, message: 'Session initialization error.' });
      }

      req.session.userId = newUser._id;
      req.session.role = newUser.role;

      // Log registration activity
      Activity.create({
        studentId: newUser._id,
        activityType: 'Student registration'
      }).catch(err => console.error('Error logging activity:', err));

      return res.status(201).json({
        success: true,
        message: 'Registration successful!',
        user: newUser.toSafeObject()
      });
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error during registration.'
    });
  }
};

// @desc Login user (student or admin)
// @route POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }

    // Validate password
    const isMatch = user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Regenerate session for session fixation protection
    req.session.regenerate((err) => {
      if (err) {
        console.error('Session regeneration error on login:', err);
        return res.status(500).json({ success: false, message: 'Failed to create session.' });
      }

      req.session.userId = user._id;
      req.session.role = user.role;

      // Record student login activity
      if (user.role === 'student') {
        Activity.create({
          studentId: user._id,
          activityType: 'Student login'
        }).catch(err => console.error('Error logging activity:', err));
      }

      return res.status(200).json({
        success: true,
        message: 'Logged in successfully',
        user: user.toSafeObject()
      });
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during login.'
    });
  }
};

// @desc Logout user
// @route POST /api/auth/logout
const logout = async (req, res) => {
  try {
    const userId = req.session ? req.session.userId : null;
    const role = req.session ? req.session.role : null;

    if (userId && role === 'student') {
      await Activity.create({
        studentId: userId,
        activityType: 'Student logout'
      }).catch(err => console.error('Error logging activity:', err));
    }

    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          console.error('Session destroy error:', err);
          return res.status(500).json({ success: false, message: 'Could not log out.' });
        }
        res.clearCookie('connect.sid');
        return res.status(200).json({
          success: true,
          message: 'Logged out successfully.'
        });
      });
    } else {
      res.clearCookie('connect.sid');
      return res.status(200).json({
        success: true,
        message: 'Logged out.'
      });
    }
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during logout.'
    });
  }
};

// @desc Get currently authenticated user
// @route GET /api/auth/me
const getMe = async (req, res) => {
  try {
    // req.user is set by requireAuth middleware
    res.status(200).json({
      success: true,
      user: req.user.toSafeObject()
    });
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching authenticated user.'
    });
  }
};

module.exports = {
  register,
  login,
  logout,
  getMe
};
