/**
 * Accessibility mode for visually impaired users.
 * Persists in localStorage under key "accessibility".
 *
 * Storage shape:
 *   { enabled, colorScheme, fontSize, imagesEnabled }
 *
 * html attrs (when enabled):
 *   data-accessibility="active"
 *   data-color-scheme="black-yellow|black-white|white-black|blue-yellow"
 *   data-font-size="normal|increased|large|extra-large"
 *   data-images="visible|hidden"
 */

const STORAGE_KEY = 'accessibility';
const SCHEMA_VERSION = 2;

const DEFAULT_STATE = {
  enabled: false,
  colorScheme: 'black-yellow',
  fontSize: 'normal',
  imagesEnabled: true
};

const COLOR_SCHEMES = [
  'black-yellow',
  'black-white',
  'white-black',
  'blue-yellow'
];

const FONT_SIZES = ['normal', 'increased', 'large', 'extra-large'];

/** Legacy labels → current fontSize keys (reference site + aliases) */
function migrateFontSize(raw) {
  if (raw === 'small' || raw === 'medium') {
    return 'normal';
  }

  // Old reference schema used "large" as the first bump before "increased" existed.
  // Prefer explicit legacy aliases so current "large" (125%) is not remapped.
  if (raw === 'legacy-large') {
    return 'increased';
  }

  if (raw === 'xlarge' || raw === 'xl') {
    return 'extra-large';
  }

  if (FONT_SIZES.includes(raw)) {
    return raw;
  }

  return DEFAULT_STATE.fontSize;
}

function readState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return { ...DEFAULT_STATE };
    }

    const parsed = JSON.parse(raw);
    const enabled = Boolean(
      parsed.enabled !== undefined ? parsed.enabled : parsed.active
    );
    const imagesEnabled =
      parsed.imagesEnabled !== undefined
        ? Boolean(parsed.imagesEnabled)
        : parsed.images !== 'hidden';

    return {
      enabled,
      colorScheme: COLOR_SCHEMES.includes(parsed.colorScheme)
        ? parsed.colorScheme
        : DEFAULT_STATE.colorScheme,
      fontSize: migrateFontSize(parsed.fontSize),
      imagesEnabled
    };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

function writeState(state) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      enabled: state.enabled,
      colorScheme: state.colorScheme,
      fontSize: state.fontSize,
      imagesEnabled: state.imagesEnabled,
      schemaVersion: SCHEMA_VERSION
    })
  );
}

const AccessibilityManager = {
  state: { ...DEFAULT_STATE },
  _headerObserver: null,

  init() {
    this.state = readState();
    this.applySettings();
    this.bindEvents();
    this.syncControls();
    this.observeHeader();
  },

  applySettings() {
    const root = document.documentElement;

    if (!this.state.enabled) {
      root.removeAttribute('data-accessibility');
      root.removeAttribute('data-color-scheme');
      root.removeAttribute('data-font-size');
      root.removeAttribute('data-images');
      root.style.removeProperty('--header-offset');
      return;
    }

    root.setAttribute('data-accessibility', 'active');
    root.setAttribute('data-color-scheme', this.state.colorScheme);
    root.setAttribute('data-font-size', this.state.fontSize);
    root.setAttribute(
      'data-images',
      this.state.imagesEnabled ? 'visible' : 'hidden'
    );
    this.updateHeaderOffset();
  },

  persist() {
    writeState(this.state);
    this.applySettings();
    this.syncControls();
  },

  setEnabled(enabled) {
    this.state.enabled = Boolean(enabled);
    this.persist();
  },

  toggleEnabled() {
    this.setEnabled(!this.state.enabled);
  },

  setColorScheme(scheme) {
    if (!COLOR_SCHEMES.includes(scheme)) {
      return;
    }

    this.state.colorScheme = scheme;
    if (!this.state.enabled) {
      this.state.enabled = true;
    }
    this.persist();
  },

  setFontSize(size) {
    if (!FONT_SIZES.includes(size)) {
      return;
    }

    this.state.fontSize = size;
    if (!this.state.enabled) {
      this.state.enabled = true;
    }
    this.persist();
  },

  setImagesEnabled(enabled) {
    this.state.imagesEnabled = Boolean(enabled);
    if (!this.state.enabled) {
      this.state.enabled = true;
    }
    this.persist();
  },

  toggleImages() {
    if (!this.state.enabled) return;
    this.setImagesEnabled(!this.state.imagesEnabled);
  },

  resetSettings() {
    const wasEnabled = this.state.enabled;
    this.state = {
      ...DEFAULT_STATE,
      enabled: wasEnabled
    };
    this.persist();
  },

  updateHeaderOffset() {
    const header = document.querySelector('.header');
    const root = document.documentElement;

    if (!header || !this.state.enabled) {
      root.style.removeProperty('--header-offset');
      return;
    }

    root.style.setProperty('--header-offset', `${header.offsetHeight}px`);
  },

  observeHeader() {
    const header = document.querySelector('.header');

    if (!header || typeof ResizeObserver === 'undefined') {
      return;
    }

    if (this._headerObserver) {
      this._headerObserver.disconnect();
    }

    this._headerObserver = new ResizeObserver(() => {
      this.updateHeaderOffset();
    });
    this._headerObserver.observe(header);
    this.updateHeaderOffset();
  },

  bindEvents() {
    if (this._bound) {
      return;
    }

    this._bound = true;

    document.addEventListener('click', (event) => {
      const toggle = event.target.closest('[data-a11y-toggle]');
      if (toggle) {
        event.preventDefault();
        this.toggleEnabled();
        return;
      }

      const schemeBtn = event.target.closest('[data-a11y-scheme]');
      if (schemeBtn) {
        event.preventDefault();
        this.setColorScheme(schemeBtn.getAttribute('data-a11y-scheme'));
        return;
      }

      const fontBtn = event.target.closest('.a11y-fonts__btn[data-font-size]');
      if (fontBtn) {
        event.preventDefault();
        this.setFontSize(fontBtn.getAttribute('data-font-size'));
        return;
      }

      const imagesBtn = event.target.closest('[data-a11y-images]');
      if (imagesBtn) {
        event.preventDefault();
        this.toggleImages();
        return;
      }

      const resetBtn = event.target.closest('[data-a11y-reset]');
      if (resetBtn) {
        event.preventDefault();
        this.resetSettings();
      }
    });

    window.addEventListener('resize', () => {
      this.updateHeaderOffset();
    });
  },

  syncControls() {
    const { enabled, colorScheme, fontSize, imagesEnabled } = this.state;

    document.querySelectorAll('[data-a11y-toggle]').forEach((button) => {
      button.setAttribute('aria-pressed', String(enabled));
      button.classList.toggle('active', enabled);
    });

    document.querySelectorAll('[data-accessibility-panel]').forEach((block) => {
      block.hidden = !enabled;
    });

    document.querySelectorAll('[data-a11y-scheme]').forEach((button) => {
      const isActive =
        enabled && button.getAttribute('data-a11y-scheme') === colorScheme;
      button.setAttribute('aria-pressed', String(isActive));
      button.classList.toggle('active', isActive);
    });

    document.querySelectorAll('.a11y-fonts__btn[data-font-size]').forEach((button) => {
      const isActive =
        enabled && button.getAttribute('data-font-size') === fontSize;
      button.setAttribute('aria-pressed', String(isActive));
      button.classList.toggle('active', isActive);
    });

    document.querySelectorAll('[data-a11y-images]').forEach((button) => {
      const isHidden = enabled && !imagesEnabled;
      button.setAttribute('aria-pressed', String(isHidden));
      button.classList.toggle('active', isHidden);
    });

    document.querySelectorAll('[data-a11y-reset]').forEach((button) => {
      button.disabled = !enabled;
    });
  }
};

export default AccessibilityManager;
