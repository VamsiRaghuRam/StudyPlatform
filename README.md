# 🎓 Study Platform — MERN Stack Mini Project

A complete, functional, beginner-friendly online learning platform inspired by GeeksforGeeks and Infosys Springboard. Built using MongoDB, Express.js, React (Vite), and Node.js.

Students can register, browse and search courses, enroll, watch YouTube video lectures, and have their video playback position and progress tracked automatically in MongoDB. The administrator can upload courses, toggle publish status, and monitor student progress and platform activity in real-time.

---

## 🌟 Features Overview

### 👨‍🎓 Student Portal
- **Registration & Authentication**: Safe input validation with auto-assigned `student` role and persistent session management.
- **Course Catalogue**: Dynamic browsing of published courses with real-time keyword search and category filtering.
- **One-Click Enrollment**: Immediate course registration with duplicate enrollment prevention.
- **Student Dashboard**: Welcome banner, available vs. enrolled course counters, overall completion percentage, and recently accessed courses.
- **My Courses**: Centralized view of enrolled courses with live visual progress bars and "Continue Learning" triggers.
- **Interactive Video Player**:
  - Embedded YouTube player powered by the YouTube IFrame API.
  - Automatic playback position tracking and resume support when returning to a course.
  - Periodic background progress synchronization to MongoDB (~every 10 seconds).
  - 90% threshold for automatic course completion with celebratory badge.

### 🛡️ Admin Portal
- **Predefined Administrator**: Configured via backend environment variables; seeded automatically into MongoDB.
- **Admin Dashboard**: System statistics (Registered Students, Total Courses, Total Enrollments, Completed Courses) and real-time student activity feed.
- **Course Management**:
  - Add new courses with YouTube video URLs, categories, and descriptions.
  - Edit existing course metadata.
  - Delete courses with cascading cleanup of enrollment records.
  - One-click toggle between `Draft` and `Published` visibility.
- **Student Directory**: Tabular overview of all students, enrolled course counts, completed courses, and last platform activity.
- **Granular Progress Reports**:
  - **Student-wise View**: Inspect individual student progress across all courses, exact video playback timestamps, and completion statuses.
  - **Course-wise View**: View all students enrolled in a specific course and their respective progress.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19 + Vite |
| **Backend** | Node.js + Express.js |
| **Database** | MongoDB (v8+) + Mongoose ODM |
| **Authentication** | `express-session` with `connect-mongo` session persistence |
| **Cookies** | Secure HTTP-only cookies (`connect.sid`) |
| **Icons** | Lucide React |
| **Styling** | Vanilla CSS with modern Indigo & Purple design system |
| **Video Engine** | YouTube IFrame Player API |

---

## 📁 Project Directory Structure

```
FSDProject/
├── server/
│   ├── config/
│   │   ├── database.js        # MongoDB Mongoose connection
│   │   └── session.js         # express-session + connect-mongo configuration
│   ├── models/
│   │   ├── User.js            # User schema (student & admin roles)
│   │   ├── Course.js          # Course schema (Draft/Published, YouTube URL)
│   │   ├── Enrollment.js      # Student course progress & playback timestamps
│   │   └── Activity.js        # Student activity log schema
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── courseController.js
│   │   ├── progressController.js
│   │   └── adminController.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── courseRoutes.js
│   │   ├── progressRoutes.js
│   │   └── adminRoutes.js
│   ├── middleware/
│   │   ├── authMiddleware.js  # Session validation
│   │   └── adminMiddleware.js # Role-based admin authorization
│   ├── scripts/
│   │   └── createAdmin.js     # Seeds admin account & sample courses
│   ├── app.js                 # Express application & CORS configuration
│   ├── server.js              # Server entry point
│   ├── .env                   # Environment variables
│   └── package.json
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx         # Responsive navigation with role-based links
│   │   │   ├── CourseCard.jsx     # Course card with media & enrollment action
│   │   │   ├── ProgressBar.jsx    # Visual animated progress bar
│   │   │   └── ProtectedRoute.jsx # Role-based route guard
│   │   ├── pages/
│   │   │   ├── Login.jsx          # Login with quick demo credentials
│   │   │   ├── Register.jsx       # Student registration
│   │   │   ├── StudentDashboard.jsx
│   │   │   ├── CourseCatalogue.jsx
│   │   │   ├── MyCourses.jsx
│   │   │   ├── CoursePlayer.jsx   # YouTube Iframe API player & progress tracker
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── ManageCourses.jsx  # Course CRUD & Draft/Publish toggle
│   │   │   ├── StudentList.jsx    # Student directory table
│   │   │   └── StudentProgress.jsx# Student-wise & Course-wise reports
│   │   ├── context/
│   │   │   └── AuthContext.jsx    # Persistent auth state & session recovery
│   │   ├── services/
│   │   │   └── api.js             # Axios client with credentials
│   │   ├── App.jsx                # Router configuration
│   │   ├── main.jsx
│   │   └── index.css              # Design system stylesheet
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── README.md
```

---

## 🔑 Default Credentials

### 🛡️ Administrator Account
- **Email**: `admin@studyplatform.com`
- **Password**: `admin123`
*(A convenient "Admin Demo" button is provided on the Login page to fill these credentials with one click)*

### 👨‍🎓 Sample Student Account
- **Email**: `student@studyplatform.com`
- **Password**: `student123`
*(A "Student Demo" button is also provided on the Login page, or you can register any new student directly)*

---

## 🚀 Running the Project Locally

### Prerequisites
1. **Node.js** (v18+)
2. **MongoDB** running locally or a MongoDB Atlas URI

### 1. Backend Setup
```bash
cd server
npm install
npm run seed:admin   # Seeds admin account and initial sample courses
npm start            # Starts server on http://localhost:5000
```

### 2. Frontend Setup
```bash
cd client
npm install
npm run dev          # Starts Vite dev server on http://localhost:5173
```

Open `http://localhost:5173` in your browser.
