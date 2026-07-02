// Auth utility — session management
// Replace localStorage calls with your .NET JWT cookie/header approach

const SESSION_KEY = 'nexushr_session';

export function setSession(userData, role) {
  const session = {
    user: userData,
    role,          // 'employee' | 'admin'
    token: userData.token || null,
    refreshToken: userData.refreshToken || null,
    expiresAt: userData.expiresAt || null,
    loginAt: new Date().toISOString(),
  };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function getSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    // Check expiry if present
    if (session.expiresAt && new Date(session.expiresAt) < new Date()) {
      clearSession();
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function getUser() {
  return getSession()?.user || null;
}

export function getRole() {
  return getSession()?.role || null;
}

export function getToken() {
  return getSession()?.token || null;
}

export function getRefreshToken() {
  return getSession()?.refreshToken || null;
}

export function updateSessionTokens(token, refreshToken, expiresAt) {
  const session = getSession();
  if (session) {
    session.token = token;
    session.refreshToken = refreshToken;
    session.expiresAt = expiresAt;
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }
}

export function isAuthenticated() {
  return getSession() !== null;
}

export function isAdmin() {
  return getRole() === 'admin';
}

export function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

export function requireAuth(requiredRole = null) {
  const session = getSession();
  if (!session) {
    const loginUrl = requiredRole === 'admin'
      ? '/auth/admin-login.html'
      : '/auth/employee-login.html';
    window.location.href = loginUrl;
    return false;
  }
  if (requiredRole && session.role !== requiredRole) {
    window.location.href = '/auth/employee-login.html';
    return false;
  }
  return true;
}

export async function logout() {
  const role = getRole();
  const refreshToken = getRefreshToken();

  try {
    const { AuthAPI } = await import('../services/api.js');
    if (refreshToken) {
      await AuthAPI.logout({ refreshToken });
    }
  } catch (err) {
    console.error('Logout error on backend:', err);
  } finally {
    clearSession();
    const loginUrl = role === 'admin'
      ? '/auth/admin-login.html'
      : '/auth/employee-login.html';
    window.location.href = loginUrl;
  }
}
