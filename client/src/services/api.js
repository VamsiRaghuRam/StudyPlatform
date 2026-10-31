import axios from 'axios';

// Create configured Axios instance
const API = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Response interceptor to handle errors gracefully
API.interceptors.response.use(
  (response) => response,
  (error) => {
    // Extract server message or fallback
    const message = error.response?.data?.message || error.message || 'Something went wrong';
    return Promise.reject(new Error(message));
  }
);

// Authentication API
export const authAPI = {
  register: (data) => API.post('/auth/register', data),
  login: (data) => API.post('/auth/login', data),
  logout: () => API.post('/auth/logout'),
  getMe: () => API.get('/auth/me')
};

// Course & Enrollment API
export const courseAPI = {
  getCourses: (search = '', category = '') => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (category) params.append('category', category);
    return API.get(`/courses?${params.toString()}`);
  },
  getCourseById: (id) => API.get(`/courses/${id}`),
  enrollCourse: (id) => API.post(`/courses/${id}/enroll`),
  getMyCourses: () => API.get('/my-courses')
};

// Video Progress API
export const progressAPI = {
  updateProgress: (enrollmentId, data) => API.patch(`/progress/${enrollmentId}`, data),
  getProgress: (enrollmentId) => API.get(`/progress/${enrollmentId}`)
};

// Admin Management & Reports API
export const adminAPI = {
  getDashboardStats: () => API.get('/admin/dashboard'),
  getAllCourses: () => API.get('/admin/courses'),
  createCourse: (data) => API.post('/admin/courses', data),
  updateCourse: (id, data) => API.put(`/admin/courses/${id}`, data),
  deleteCourse: (id) => API.delete(`/admin/courses/${id}`),
  getStudents: () => API.get('/admin/students'),
  getStudentProgress: (studentId) => API.get(`/admin/students/${studentId}/progress`),
  getCourseProgress: (courseId) => API.get(`/admin/courses/${courseId}/progress`),
  getActivities: () => API.get('/admin/activities')
};

export default API;
