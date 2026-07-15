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

export function getLoginPath() {
  return 'login.html';
}

export function requireAuth(redirectTo = 'login.html') {
  if (isAuthenticated()) {
    return true;
  }

  window.location.href = redirectTo;
  return false;
}

/** Resolve asset paths stored as root-relative (assets/...) for pages in /pages/. */
export function resolveAssetPath(path) {
  if (!path) {
    return '../assets/images/cta-fan.png';
  }

  if (/^(https?:|data:|\/|\.\.\/)/i.test(path)) {
    return path;
  }

  return `../${path}`;
}
