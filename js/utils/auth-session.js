export function getCurrentUser() {
  const raw = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setCurrentUser(user) {
  if (!user) {
    localStorage.removeItem('currentUser');
    sessionStorage.removeItem('currentUser');
    return;
  }

  const payload = JSON.stringify(user);

  if (localStorage.getItem('currentUser')) {
    localStorage.setItem('currentUser', payload);
    return;
  }

  if (sessionStorage.getItem('currentUser')) {
    sessionStorage.setItem('currentUser', payload);
    return;
  }

  localStorage.setItem('currentUser', payload);
}

export function isAuthenticated() {
  return Boolean(getCurrentUser());
}

export function isAdmin() {
  return getCurrentUser()?.role === 'admin';
}

export function requireAuth(redirectTo = 'login.html') {
  if (isAuthenticated()) {
    return true;
  }

  window.location.href = redirectTo;
  return false;
}

export function requireAdmin(redirectTo = 'login.html') {
  const user = getCurrentUser();

  if (user?.role === 'admin') {
    return true;
  }

  window.location.href = redirectTo;
  return false;
}
