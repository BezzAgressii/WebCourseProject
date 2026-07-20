/**
 * Light / dark theme manager.
 * Persists explicit choice in localStorage under key "theme".
 * When unset, follows prefers-color-scheme.
 */
const STORAGE_KEY = 'theme';

const ThemeManager = {
  init() {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved === 'dark' || saved === 'light') {
      this.applyTheme(saved);
    } else {
      this.applyTheme(this.getSystemTheme());
    }

    this.bindEvents();
    this.bindSystemPreference();
  },

  getSystemTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  },

  applyTheme(theme) {
    const next = theme === 'dark' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    this.updateThemeButtons();
  },

  setTheme(theme) {
    const next = theme === 'dark' ? 'dark' : 'light';
    localStorage.setItem(STORAGE_KEY, next);
    this.applyTheme(next);
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

  bindSystemPreference() {
    if (this._systemBound || !window.matchMedia) {
      return;
    }

    this._systemBound = true;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (event) => {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'dark' || saved === 'light') {
        return;
      }

      this.applyTheme(event.matches ? 'dark' : 'light');
    };

    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', onChange);
    } else if (typeof media.addListener === 'function') {
      media.addListener(onChange);
    }
  },

  updateThemeButtons() {
    const current = document.documentElement.getAttribute('data-theme') || this.getSystemTheme();
    document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
      const isActive = button.getAttribute('data-theme-toggle') === current;
      button.classList.toggle('active', isActive);
      button.setAttribute('aria-pressed', String(isActive));
    });
  }
};

export default ThemeManager;
