const API_BASE = '/api';

export const getAuthToken = () => localStorage.getItem('study_token');
export const setAuthToken = (token) => localStorage.setItem('study_token', token);
export const removeAuthToken = () => localStorage.removeItem('study_token');

export const getCurrentUser = () => {
  const user = localStorage.getItem('study_user');
  return user ? JSON.parse(user) : null;
};
export const setCurrentUser = (user) => localStorage.setItem('study_user', JSON.stringify(user));
export const removeCurrentUser = () => localStorage.removeItem('study_user');

async function request(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    ...(options.isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  delete config.isFormData;

  const response = await fetch(`${API_BASE}${endpoint}`, config);

  if (response.status === 401) {
    removeAuthToken();
    removeCurrentUser();
  }

  const contentType = response.headers.get('content-type');
  let data = null;
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errorMsg = data?.detail || (typeof data === 'string' ? data : 'Something went wrong');
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  // Auth
  login: async (email, password) => {
    const res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setAuthToken(res.access_token);
    setCurrentUser(res.user);
    return res;
  },
  register: async (userData) => {
    const res = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    setAuthToken(res.access_token);
    setCurrentUser(res.user);
    return res;
  },
  getMe: () => request('/auth/me'),
  updateProfile: (profileData) =>
    request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    }),
  seedDemo: () => request('/auth/demo-seed', { method: 'POST' }),

  // Dashboard
  getDashboardOverview: () => request('/dashboard/overview'),

  // Subjects & Topics
  getSubjects: () => request('/subjects'),
  createSubject: (subData) =>
    request('/subjects', {
      method: 'POST',
      body: JSON.stringify(subData),
    }),
  updateSubject: (id, subData) =>
    request(`/subjects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(subData),
    }),
  deleteSubject: (id) => request(`/subjects/${id}`, { method: 'DELETE' }),

  getTopics: (subjectId = null) =>
    request(`/topics${subjectId ? `?subject_id=${subjectId}` : ''}`),
  createTopic: (subjectId, topicData) =>
    request(`/subjects/${subjectId}/topics`, {
      method: 'POST',
      body: JSON.stringify(topicData),
    }),
  updateTopic: (topicId, topicData) =>
    request(`/topics/${topicId}`, {
      method: 'PUT',
      body: JSON.stringify(topicData),
    }),
  toggleTopic: (topicId) =>
    request(`/topics/${topicId}/toggle-complete`, { method: 'PATCH' }),
  deleteTopic: (topicId) => request(`/topics/${topicId}`, { method: 'DELETE' }),

  // Exams & Assignments
  getExams: () => request('/exams'),
  createExam: (examData) =>
    request('/exams', {
      method: 'POST',
      body: JSON.stringify(examData),
    }),
  updateExam: (id, examData) =>
    request(`/exams/${id}`, {
      method: 'PUT',
      body: JSON.stringify(examData),
    }),
  deleteExam: (id) => request(`/exams/${id}`, { method: 'DELETE' }),

  getAssignments: () => request('/assignments'),
  createAssignment: (assignData) =>
    request('/assignments', {
      method: 'POST',
      body: JSON.stringify(assignData),
    }),
  updateAssignment: (id, assignData) =>
    request(`/assignments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(assignData),
    }),
  toggleAssignment: (id) =>
    request(`/assignments/${id}/toggle-complete`, { method: 'PATCH' }),
  deleteAssignment: (id) => request(`/assignments/${id}`, { method: 'DELETE' }),

  // Availability (Per Day of Week)
  getAvailability: () => request('/availability'),
  updateAvailability: (availability) =>
    request('/availability', {
      method: 'PUT',
      body: JSON.stringify({ availability }),
    }),

  // Planner & Tasks
  generatePlan: (planParams) =>
    request('/study-plan/generate', {
      method: 'POST',
      body: JSON.stringify(planParams),
    }),
  getStudyPlan: () => request('/study-plan'),
  getTasks: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/tasks${query ? `?${query}` : ''}`);
  },
  completeTask: (taskId) => request(`/tasks/${taskId}/complete`, { method: 'PUT' }),
  missTask: (taskId) => request(`/tasks/${taskId}/miss`, { method: 'PUT' }),
  updateTaskStatus: (taskId, status) =>
    request(`/tasks/${taskId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  rescheduleMissedTask: (taskId) =>
    request(`/tasks/${taskId}/reschedule-missed`, { method: 'POST' }),
  getRescheduleLogs: () => request('/tasks/reschedule-logs'),

  // Analytics
  getAnalytics: () => request('/analytics'),

  // Notes & RAG Pipeline
  getNotes: () => request('/notes'),
  uploadNote: (formData) =>
    request('/notes/upload', {
      method: 'POST',
      body: formData,
      isFormData: true,
    }),
  deleteNote: (id) => request(`/notes/${id}`, { method: 'DELETE' }),

  // Daily Goals
  getDailyGoals: (date = null) =>
    request(`/daily-goals${date ? `?date=${date}` : ''}`),
  createDailyGoal: (goalData) =>
    request('/daily-goals', {
      method: 'POST',
      body: JSON.stringify(goalData),
    }),
  toggleDailyGoal: (id) =>
    request(`/daily-goals/${id}/toggle`, { method: 'PUT' }),
  deleteDailyGoal: (id) => request(`/daily-goals/${id}`, { method: 'DELETE' }),

  // Notifications
  getNotifications: () => request('/notifications'),
  markNotificationRead: (id) =>
    request(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllNotificationsRead: () =>
    request('/notifications/read-all', { method: 'PUT' }),

  // AI Assistant
  chat: (messages, contextSubjectId = null) =>
    request('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ messages, context_subject_id: contextSubjectId }),
    }),
  getQuiz: (subject = null) =>
    request(`/ai/quiz${subject ? `?subject=${encodeURIComponent(subject)}` : ''}`),
  getRevisionSuggestions: () => request('/ai/revision-suggestions'),
};
