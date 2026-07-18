/**
 * Light / dark theme manager.
 * Persists choice in localStorage under key "theme".
 */
const STORAGE_KEY = 'theme';
const DEFAULT_THEME = 'light';

const ThemeManager = {
  init() {
    const saved = localStorage.getItem(STORAGE_KEY);
    const theme = saved === 'dark' || saved === 'light' ? saved : DEFAULT_THEME;
    this.setTheme(theme);
    this.bindEvents();
  },

  setTheme(theme) {
    const next = theme === 'dark' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem(STORAGE_KEY, next);
    this.updateThemeButtons();
  },

  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    this.setTheme(current === 'dark' ? 'light' : 'dark');
  },

  bindEvents() {
    if (this._bound) {
      return;
    }

    this._bound = true;
    document.addEventListener('click', (event) => {
      const button = event.target.closest('[data-theme-toggle]');
      if (!button) {
        return;
      }

      const value = button.getAttribute('data-theme-toggle');
      if (value === 'light' || value === 'dark') {
        this.setTheme(value);
      }
    });
  },

  updateThemeButtons() {
    const current = document.documentElement.getAttribute('data-theme') || DEFAULT_THEME;
    document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
      const isActive = button.getAttribute('data-theme-toggle') === current;
      button.classList.toggle('active', isActive);
      button.setAttribute('aria-pressed', String(isActive));
    });
  }
};

export default ThemeManager;
