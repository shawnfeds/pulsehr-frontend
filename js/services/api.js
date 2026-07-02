// API Service Layer
// Replace BASE_URL with your .NET API URL
// All endpoints mirror the API contract document

import { getToken, clearSession, getRefreshToken, updateSessionTokens } from '../utils/auth.js';

export const BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000/api'
  : 'https://pulsehr-api-cqja.onrender.com/api';

// ─── HTTP Client ──────────────────────────────────────────────────────────────
async function request(method, path, body = null, opts = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...opts.headers,
  };

  const config = {
    method,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
  };

  // ── MOCK MODE ── Remove this block when connecting to real .NET API
  if (window.MOCK_MODE !== false) {
    return await mockHandler(method, path, body);
  }
  // ─────────────────────────────────────────────────────────────────

  try {
    let res = await fetch(`${BASE_URL}${path}`, config);

    if (res.status === 401) {
      if (path !== '/auth/refresh' && path !== '/auth/employee/login' && path !== '/auth/admin/login') {
        const refreshToken = getRefreshToken();
        if (refreshToken) {
          try {
            const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refreshToken }),
            });

            if (refreshRes.ok) {
              const refreshData = await refreshRes.json();
              if (refreshData && refreshData.success && refreshData.data) {
                const { token: newAccessToken, refreshToken: newRefreshToken, expiresAt } = refreshData.data;
                updateSessionTokens(newAccessToken, newRefreshToken, expiresAt);

                // Retry original request
                const newHeaders = {
                  ...headers,
                  Authorization: `Bearer ${newAccessToken}`,
                };
                const newConfig = {
                  ...config,
                  headers: newHeaders,
                };
                res = await fetch(`${BASE_URL}${path}`, newConfig);
              } else {
                throw new Error('Invalid refresh response structure');
              }
            } else {
              throw new Error('Token refresh request failed');
            }
          } catch (refreshErr) {
            console.error('Session expired, auto-refresh failed:', refreshErr);
            clearSession();
            window.location.href = 'auth/employee-login.html';
            return;
          }
        } else {
          clearSession();
          window.location.href = 'auth/employee-login.html';
          return;
        }
      } else {
        clearSession();
        window.location.href = 'auth/employee-login.html';
        return;
      }
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
      throw new Error(err.message || `Request failed: ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    if (err.name === 'TypeError') {
      throw new Error('Network error — unable to reach server');
    }
    throw err;
  }
}

const http = {
  get: (path, opts) => request('GET', path, null, opts),
  post: (path, body, opts) => request('POST', path, body, opts),
  put: (path, body, opts) => request('PUT', path, body, opts),
  patch: (path, body, opts) => request('PATCH', path, body, opts),
  delete: (path, opts) => request('DELETE', path, null, opts),
};

// ─── AUTH ─────────────────────────────────────────────────────────────────────
export const AuthAPI = {
  employeeLogin: (body) => http.post('/auth/employee/login', body),
  adminLogin: (body) => http.post('/auth/admin/login', body),
  logout: (body) => http.post('/auth/logout', body),
  refreshToken: (body) => http.post('/auth/refresh', body),
  me: () => http.get('/auth/me'),
  changePassword: (body) => http.post('/auth/change-password', body),
};

// ─── EMPLOYEES ────────────────────────────────────────────────────────────────
export const EmployeeAPI = {
  getAll: (params = {}) => http.get(`/employees?${new URLSearchParams(params)}`),
  getById: (id) => http.get(`/employees/${id}`),
  getProfile: (id) => http.get(`/employees/${id}/profile`),
  create: (body) => http.post('/employees', body),
  update: (id, body) => http.put(`/employees/${id}`, body),
  updateProfile: (id, body) => http.put(`/employees/${id}/profile`, body),
  delete: (id) => http.delete(`/employees/${id}`),
  assignRoles: (id, roles) => http.post(`/employees/${id}/roles`, { roles }),
  assignProjects: (id, projectIds) => http.post(`/employees/${id}/projects`, { projectIds }),
  getSalaryHistory: (id) => http.get(`/employees/${id}/salary-history`),
  getEmploymentHistory: (id) => http.get(`/employees/${id}/employment-history`),
  uploadAvatar: (id, formData) => request('POST', `/employees/${id}/avatar`, null, {
    headers: { /* omit Content-Type — browser sets multipart boundary */ },
    // Note: pass FormData directly, not JSON
  }),
};

// ─── PROJECTS ─────────────────────────────────────────────────────────────────
export const ProjectAPI = {
  getAll: (params = {}) => http.get(`/projects?${new URLSearchParams(params)}`),
  getById: (id) => http.get(`/projects/${id}`),
  getMyProjects: (employeeId) => http.get(`/projects/employee/${employeeId}`),
  create: (body) => http.post('/projects', body),
  update: (id, body) => http.put(`/projects/${id}`, body),
  delete: (id) => http.delete(`/projects/${id}`),
  assignMembers: (id, employeeIds) => http.post(`/projects/${id}/members`, { employeeIds }),
  removeMembers: (id, employeeIds) => http.delete(`/projects/${id}/members`, { employeeIds }),
};

// ─── LEAVES ───────────────────────────────────────────────────────────────────
export const LeaveAPI = {
  getAll: (params = {}) => http.get(`/leaves?${new URLSearchParams(params)}`),
  getById: (id) => http.get(`/leaves/${id}`),
  getMyLeaves: (employeeId, params = {}) => http.get(`/leaves/employee/${employeeId}?${new URLSearchParams(params)}`),
  getBalance: (employeeId) => http.get(`/leaves/employee/${employeeId}/balance`),
  apply: (body) => http.post('/leaves', body),
  updateStatus: (id, body) => http.patch(`/leaves/${id}/status`, body),
  cancel: (id) => http.delete(`/leaves/${id}`),
};

// ─── TIMESHEETS ───────────────────────────────────────────────────────────────
export const TimesheetAPI = {
  getAll: (params = {}) => http.get(`/timesheets?${new URLSearchParams(params)}`),
  getMyTimesheets: (employeeId, params = {}) => http.get(`/timesheets/employee/${employeeId}?${new URLSearchParams(params)}`),
  getById: (id) => http.get(`/timesheets/${id}`),
  create: (body) => http.post('/timesheets', body),
  update: (id, body) => http.put(`/timesheets/${id}`, body),
  delete: (id) => http.delete(`/timesheets/${id}`),
  exportCsv: (employeeId, month) => http.get(`/timesheets/employee/${employeeId}/export?month=${month}`),
};

// ─── POLICIES ─────────────────────────────────────────────────────────────────
export const PolicyAPI = {
  getAll: (params = {}) => http.get(`/policies?${new URLSearchParams(params)}`),
  getById: (id) => http.get(`/policies/${id}`),
  upload: (formData) => request('POST', '/policies/upload', null, {
    headers: {}, // multipart — browser sets boundary
  }),
  delete: (id) => http.delete(`/policies/${id}`),
  download: (id) => `${BASE_URL}/policies/${id}/download`, // direct link
};

// ─── HOLIDAYS ─────────────────────────────────────────────────────────────────
export const HolidayAPI = {
  getAll: (params = {}) => http.get(`/holidays?${new URLSearchParams(params)}`),
  create: (body) => http.post('/holidays', body),
  update: (id, body) => http.put(`/holidays/${id}`, body),
  delete: (id) => http.delete(`/holidays/${id}`),
};

// ─── EVENTS ───────────────────────────────────────────────────────────────────
export const EventAPI = {
  getAll: (params = {}) => http.get(`/events?${new URLSearchParams(params)}`),
  create: (body) => http.post('/events', body),
  update: (id, body) => http.put(`/events/${id}`, body),
  delete: (id) => http.delete(`/events/${id}`),
};

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
export const DashboardAPI = {
  getAdminStats: () => http.get('/dashboard/admin'),
  getEmployeeStats: (employeeId) => http.get(`/dashboard/employee/${employeeId}`),
};

// ─── SEARCH ───────────────────────────────────────────────────────────────────
export const SearchAPI = {
  global: (query) => http.get(`/search?q=${encodeURIComponent(query)}`),
};

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
export const NotificationAPI = {
  getAll: () => http.get('/notifications'),
  markRead: (id) => http.patch(`/notifications/${id}/read`),
  markAllRead: () => http.post('/notifications/read-all'),
};

// ════════════════════════════════════════════════════════════════════════════════
// MOCK HANDLER — Remove this entire section when integrating with .NET API
// ════════════════════════════════════════════════════════════════════════════════
if (window.MOCK_MODE === undefined) {
  window.MOCK_MODE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
}

import * as MockData from '../data.js';

let _employees = [...MockData.MOCK_EMPLOYEES];
let _projects = [...MockData.MOCK_PROJECTS];
let _leaves = [...MockData.MOCK_LEAVES];
let _timesheets = [...MockData.MOCK_TIMESHEETS];
let _policies = [...MockData.MOCK_POLICIES];
let _holidays = [...MockData.MOCK_HOLIDAYS];
let _events = [...MockData.MOCK_EVENTS];
let _ids = { emp: 100, proj: 10, leave: 10, ts: 10, pol: 10, hol: 10, evt: 10 };

const delay = (ms = 350) => new Promise(r => setTimeout(r, ms));

async function mockHandler(method, path, body) {
  await delay();

  // AUTH
  if (path === '/auth/employee/login') {
    const user = _employees.find(e => e.email === body.email) || MockData.CURRENT_USER;
    return { success: true, data: { ...user, token: 'mock-jwt-token', refreshToken: 'mock-refresh-token', expiresAt: new Date(Date.now() + 3600000).toISOString() } };
  }
  if (path === '/auth/admin/login') {
    if (!body.email.includes('admin') && body.email !== 'priya@nexus.io') {
      await delay(200);
      throw new Error('Invalid admin credentials');
    }
    return { success: true, data: { ...MockData.CURRENT_USER, role: 'Admin', token: 'mock-admin-jwt', refreshToken: 'mock-admin-refresh-token', expiresAt: new Date(Date.now() + 3600000).toISOString() } };
  }
  if (path === '/auth/me') return { success: true, data: MockData.CURRENT_USER };
  if (path === '/auth/logout') return { success: true };
  if (path === '/auth/refresh') {
    return { success: true, data: { token: 'mock-refreshed-jwt-token', refreshToken: 'mock-refreshed-refresh-token', expiresAt: new Date(Date.now() + 3600000).toISOString() } };
  }
  if (path === '/auth/change-password') return { success: true };

  // DASHBOARD
  if (path === '/dashboard/admin') {
    return { success: true, data: {
      totalEmployees: _employees.filter(e => e.status === 'active').length,
      totalProjects: _projects.length,
      activeProjects: _projects.filter(p => p.status === 'active').length,
      pendingLeaves: _leaves.filter(l => l.status === 'pending').length,
      totalDepartments: 4,
    }};
  }
  if (path.startsWith('/dashboard/employee/')) {
    const empId = parseInt(path.split('/').pop());
    const myTs = _timesheets.filter(t => t.employeeId === empId);
    const myLeaves = _leaves.filter(l => l.employeeId === empId && l.status === 'approved');
    const emp = _employees.find(e => e.id === empId);
    return { success: true, data: {
      hoursThisMonth: myTs.reduce((s, t) => s + t.hours, 0),
      leavesTaken: myLeaves.reduce((s, l) => s + l.days, 0),
      activeProjects: emp?.projects?.length || 0,
      attendanceRate: 96,
    }};
  }

  // SEARCH
  if (path.startsWith('/search')) {
    const q = new URL(`http://x${path}`).searchParams.get('q').toLowerCase();
    const empR = _employees.filter(e => e.name.toLowerCase().includes(q) || e.email.toLowerCase().includes(q)).slice(0, 3)
      .map(e => ({ type: 'employee', id: e.id, label: e.name, sub: e.role, avatar: e.avatar, color: e.avatarColor }));
    const projR = _projects.filter(p => p.name.toLowerCase().includes(q)).slice(0, 2)
      .map(p => ({ type: 'project', id: p.id, label: p.name, sub: p.status }));
    return { success: true, data: [...empR, ...projR] };
  }

  // EMPLOYEES
  if (path.startsWith('/employees')) {
    const parts = path.split('/').filter(Boolean);
    const id = parts[1] ? parseInt(parts[1]) : null;
    const sub = parts[2];

    if (method === 'GET' && !id) {
      const url = new URL(`http://x${path}`);
      let r = [..._employees];
      const q = url.searchParams.get('search');
      const status = url.searchParams.get('status');
      if (q) r = r.filter(e => e.name.toLowerCase().includes(q.toLowerCase()) || e.email.toLowerCase().includes(q.toLowerCase()));
      if (status) r = r.filter(e => e.status === status);
      return { success: true, data: r, total: r.length };
    }
    if (method === 'GET' && id && !sub) return { success: true, data: _employees.find(e => e.id === id) };
    if (method === 'GET' && sub === 'salary-history') return { success: true, data: MockData.SALARY_HISTORY };
    if (method === 'GET' && sub === 'employment-history') return { success: true, data: MockData.EMPLOYEE_HISTORY };
    if (method === 'POST' && !id) {
      const n = { ...body, id: ++_ids.emp, status: 'active', projects: [], avatar: body.name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2), avatarColor: '#2563eb' };
      _employees.push(n); return { success: true, data: n };
    }
    if (method === 'PUT' && id) {
      const idx = _employees.findIndex(e => e.id === id);
      _employees[idx] = { ..._employees[idx], ...body };
      return { success: true, data: _employees[idx] };
    }
    if (method === 'POST' && sub === 'projects') {
      const idx = _employees.findIndex(e => e.id === id);
      _employees[idx].projects = body.projectIds;
      return { success: true, data: _employees[idx] };
    }
    if (method === 'DELETE' && id) { _employees = _employees.filter(e => e.id !== id); return { success: true }; }
  }

  // PROJECTS
  if (path.startsWith('/projects')) {
    const parts = path.split('/').filter(Boolean);
    const id = parts[1] && !isNaN(parts[1]) ? parseInt(parts[1]) : null;
    const sub = parts[2];

    if (method === 'GET' && !id && !parts[1]) return { success: true, data: [..._projects], total: _projects.length };
    if (method === 'GET' && parts[1] === 'employee') {
      const empId = parseInt(parts[2]);
      const emp = _employees.find(e => e.id === empId);
      return { success: true, data: _projects.filter(p => emp?.projects?.includes(p.id)) };
    }
    if (method === 'GET' && id) return { success: true, data: _projects.find(p => p.id === id) };
    if (method === 'POST' && !id) {
      const n = { ...body, id: ++_ids.proj, progress: 0, members: [] };
      _projects.push(n); return { success: true, data: n };
    }
    if (method === 'PUT' && id) {
      const idx = _projects.findIndex(p => p.id === id);
      _projects[idx] = { ..._projects[idx], ...body };
      return { success: true, data: _projects[idx] };
    }
    if (method === 'POST' && sub === 'members') {
      const idx = _projects.findIndex(p => p.id === id);
      _projects[idx].members = body.employeeIds;
      return { success: true, data: _projects[idx] };
    }
    if (method === 'DELETE' && id) { _projects = _projects.filter(p => p.id !== id); return { success: true }; }
  }

  // LEAVES
  if (path.startsWith('/leaves')) {
    const parts = path.replace(/\?.*/,'').split('/').filter(Boolean);
    const id = parts[1] && !isNaN(parts[1]) ? parseInt(parts[1]) : null;
    const sub = parts[2];

    if (method === 'GET' && parts[1] === 'employee') {
      const empId = parseInt(parts[2]);
      const url = new URL(`http://x${path}`);
      let r = _leaves.filter(l => l.employeeId === empId);
      const status = url.searchParams.get('status');
      if (status) r = r.filter(l => l.status === status);
      return { success: true, data: r };
    }
    if (path.endsWith('/balance')) {
      return { success: true, data: MockData.LEAVE_SUMMARY };
    }
    if (method === 'GET' && !id) {
      const url = new URL(`http://x${path}`);
      let r = [..._leaves];
      const status = url.searchParams.get('status');
      if (status) r = r.filter(l => l.status === status);
      return { success: true, data: r };
    }
    if (method === 'POST') {
      const n = { ...body, id: ++_ids.leave, status: 'pending' };
      _leaves.push(n); return { success: true, data: n };
    }
    if (method === 'PATCH' && sub === 'status') {
      const idx = _leaves.findIndex(l => l.id === id);
      _leaves[idx].status = body.status;
      return { success: true, data: _leaves[idx] };
    }
    if (method === 'DELETE' && id) { _leaves = _leaves.filter(l => l.id !== id); return { success: true }; }
  }

  // TIMESHEETS
  if (path.startsWith('/timesheets')) {
    const parts = path.replace(/\?.*/,'').split('/').filter(Boolean);
    const id = parts[1] && !isNaN(parts[1]) ? parseInt(parts[1]) : null;

    if (parts[1] === 'employee') {
      const empId = parseInt(parts[2]);
      const url = new URL(`http://x${path}`);
      const month = url.searchParams.get('month');
      let r = _timesheets.filter(t => t.employeeId === empId);
      if (month) r = r.filter(t => t.month === month);
      return { success: true, data: r };
    }
    if (method === 'GET' && !id) return { success: true, data: [..._timesheets] };
    if (method === 'POST') {
      const n = { ...body, id: ++_ids.ts };
      _timesheets.push(n); return { success: true, data: n };
    }
    if (method === 'PUT' && id) {
      const idx = _timesheets.findIndex(t => t.id === id);
      _timesheets[idx] = { ..._timesheets[idx], ...body };
      return { success: true, data: _timesheets[idx] };
    }
    if (method === 'DELETE' && id) { _timesheets = _timesheets.filter(t => t.id !== id); return { success: true }; }
  }

  // POLICIES
  if (path.startsWith('/policies')) {
    const parts = path.split('/').filter(Boolean);
    const id = parts[1] && !isNaN(parts[1]) ? parseInt(parts[1]) : null;
    if (method === 'GET' && !id) return { success: true, data: [..._policies] };
    if (method === 'POST') {
      const n = { ...body, id: ++_ids.pol }; _policies.push(n); return { success: true, data: n };
    }
    if (method === 'DELETE') { _policies = _policies.filter(p => p.id !== id); return { success: true }; }
  }

  // HOLIDAYS
  if (path.startsWith('/holidays')) {
    const id = parseInt(path.split('/')[2]);
    if (method === 'GET') return { success: true, data: [..._holidays] };
    if (method === 'POST') { const n = { ...body, id: ++_ids.hol }; _holidays.push(n); return { success: true, data: n }; }
    if (method === 'DELETE') { _holidays = _holidays.filter(h => h.id !== id); return { success: true }; }
  }

  // EVENTS
  if (path.startsWith('/events')) {
    const id = parseInt(path.split('/')[2]);
    if (method === 'GET') return { success: true, data: [..._events] };
    if (method === 'POST') { const n = { ...body, id: ++_ids.evt }; _events.push(n); return { success: true, data: n }; }
    if (method === 'DELETE') { _events = _events.filter(e => e.id !== id); return { success: true }; }
  }

  // NOTIFICATIONS
  if (path.startsWith('/notifications')) {
    return { success: true, data: MockData.MOCK_NOTIFICATIONS };
  }

  throw new Error(`Unhandled mock: ${method} ${path}`);
}
