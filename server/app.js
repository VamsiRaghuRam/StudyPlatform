const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const sessionMiddleware = require('./config/session');

const authRoutes = require('./routes/authRoutes');
const courseRoutes = require('./routes/courseRoutes');
const progressRoutes = require('./routes/progressRoutes');
const adminRoutes = require('./routes/adminRoutes');
const { getMyCourses } = require('./controllers/courseController');
const requireAuth = require('./middleware/authMiddleware');

const app = express();

// Trust reverse proxy if in production
app.set('trust proxy', 1);

// CORS configuration
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(null, true); // Permissive for local dev
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Express Session
app.use(sessionMiddleware);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.get('/api/my-courses', requireAuth, getMyCourses);
app.use('/api/progress', progressRoutes);
app.use('/api/admin', adminRoutes);

// Catch 404 for unknown api routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: 'API route not found.' });
});

// Global error handler
app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ success: false, message: 'Invalid JSON payload received.' });
  }
  console.error('Unhandled Application Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error.'
  });
});

module.exports = app;
