const API_BASE = '/api';

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '请求失败' }));
    throw new Error(error.message || '请求失败');
  }

  return response.json();
}

export const authApi = {
  login: (data: { username?: string; password: string; phone?: string; email?: string }) =>
    apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  register: (data: { username?: string; password: string; name: string; role?: string; phone?: string; email?: string }) =>
    apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  me: () => apiFetch('/auth/me'),
};

export const studentApi = {
  list: () => apiFetch('/students'),
  me: () => apiFetch('/students/me'),
  get: (id: number) => apiFetch(`/students/${id}`),
  create: (data: any) => apiFetch('/students', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) => apiFetch(`/students/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => apiFetch(`/students/${id}`, { method: 'DELETE' }),
  records: (id: number) => apiFetch(`/students/${id}/records`),
};

export const examApi = {
  list: () => apiFetch('/exams'),
  get: (id: number) => apiFetch(`/exams/${id}`),
  create: (data: any) => apiFetch('/exams', { method: 'POST', body: JSON.stringify(data) }),
  submit: (id: number, data: { answers: Record<string, string>; duration: number; tab_switch_count?: number; question_times?: Record<string, number> }) =>
    apiFetch(`/exams/${id}/submit`, { method: 'POST', body: JSON.stringify(data) }),
  records: (id: number) => apiFetch(`/exams/${id}/records`),
  recordDetail: (recordId: number) => apiFetch(`/exams/records/${recordId}`),
  checkStatus: (recordId: number) => apiFetch(`/exams/records/${recordId}/status`),
  adminList: (query?: string) => apiFetch(`/exams/admin/list${query || ''}`),
};

export const questionApi = {
  list: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiFetch(`/questions${query}`);
  },
  create: (data: any) => apiFetch('/questions', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) => apiFetch(`/questions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => apiFetch(`/questions/${id}`, { method: 'DELETE' }),
  usage: (id: number) => apiFetch(`/questions/${id}/usage`),
  aiGenerate: (data: any) => apiFetch('/questions/ai-generate', { method: 'POST', body: JSON.stringify(data) }),
  aiReview: (question: any) => apiFetch('/questions/ai-review', { method: 'POST', body: JSON.stringify({ question }) }),
};

export const classApi = {
  list: () => apiFetch('/classes'),
  create: (data: any) => apiFetch('/classes', { method: 'POST', body: JSON.stringify(data) }),
  students: (id: number) => apiFetch(`/classes/${id}/students`),
  addStudent: (id: number, studentId: number) =>
    apiFetch(`/classes/${id}/students`, { method: 'POST', body: JSON.stringify({ student_id: studentId }) }),
};

export const noticeApi = {
  list: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiFetch(`/notices${query}`);
  },
  send: (data: any) => apiFetch('/notices', { method: 'POST', body: JSON.stringify(data) }),
  markRead: (id: number) => apiFetch(`/notices/${id}/read`, { method: 'PUT' }),
  templates: () => apiFetch('/notices/templates'),
  createTemplate: (data: any) => apiFetch('/notices/templates', { method: 'POST', body: JSON.stringify(data) }),
  updateTemplate: (id: number, data: any) => apiFetch(`/notices/templates/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
};

export const configApi = {
  get: () => apiFetch('/config'),
  update: (data: any) => apiFetch('/config', { method: 'PUT', body: JSON.stringify(data) }),
};

export const userApi = {
  list: () => apiFetch('/users'),
  create: (data: any) => apiFetch('/users', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) => apiFetch(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => apiFetch(`/users/${id}`, { method: 'DELETE' }),
};

export const dashboardApi = {
  get: () => apiFetch('/dashboard'),
};

export const courseApi = {
  list: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiFetch(`/courses${query}`);
  },
  get: (id: number) => apiFetch(`/courses/${id}`),
  create: (data: any) => apiFetch('/courses', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) => apiFetch(`/courses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => apiFetch(`/courses/${id}`, { method: 'DELETE' }),
  schedules: (courseId: number) => apiFetch(`/courses/${courseId}/schedules`),
  createSchedule: (courseId: number, data: any) => apiFetch(`/courses/${courseId}/schedules`, { method: 'POST', body: JSON.stringify(data) }),
  updateSchedule: (scheduleId: number, data: any) => apiFetch(`/courses/schedules/${scheduleId}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSchedule: (scheduleId: number) => apiFetch(`/courses/schedules/${scheduleId}`, { method: 'DELETE' }),
};
