/**
 * Page preloader for Pascal Vent.
 * Classic (non-module) script — include in <head> on every page.
 */
(function initPascalVentPreloader() {
  const MIN_VISIBLE_MS = 280;
  const FAILSAFE_MS = 12000;
  const NAV_KEY = 'pv-preloader-nav';
  const scriptUrl = document.currentScript?.src || window.location.href;
  const LOGO_SRC = new URL('../../assets/icons/logo.svg', scriptUrl).href;

  let settled = false;
  let loadDone = false;
  let minDone = false;
  let shownAt = 0;
  let minTimer = 0;

  document.documentElement.classList.add('is-preload');

  if (document.body) {
    ensureMounted();
    startMinTimer();
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      ensureMounted();
      startMinTimer();
    }, { once: true });
  }

  if (document.readyState === 'complete') {
    markLoadDone();
  } else {
    window.addEventListener('load', markLoadDone, { once: true });
  }

  window.setTimeout(markLoadDone, FAILSAFE_MS);
  window.addEventListener('pageshow', onPageShow);
  document.addEventListener('click', onDocumentClick, true);

  function ensureMounted() {
    let root = document.getElementById('preloader');

    if (!root) {
      root = document.createElement('div');
      root.id = 'preloader';
      root.className = 'preloader';
      root.setAttribute('role', 'status');
      root.setAttribute('aria-live', 'polite');
      root.innerHTML = `
        <div class="preloader__inner">
          <img class="preloader__logo" src="${LOGO_SRC}" alt="Pascal Vent" width="196" height="61">
          <div class="preloader__spinner" aria-hidden="true"></div>
          <p class="preloader__text">Загрузка...</p>
        </div>
      `;
      document.body.prepend(root);
    }

    root.classList.remove('is-hidden');
    root.setAttribute('aria-busy', 'true');
    return root;
  }

  function startMinTimer() {
    shownAt = performance.now();
    minDone = false;
    window.clearTimeout(minTimer);
    minTimer = window.setTimeout(() => {
      minDone = true;
      tryHide();
    }, MIN_VISIBLE_MS);
  }

  function markLoadDone() {
    loadDone = true;
    tryHide();
  }

  function tryHide() {
    if (settled || !loadDone || !minDone) {
      return;
    }

    // Keep covering until both paint conditions are met.
    const elapsed = performance.now() - shownAt;
    if (elapsed < MIN_VISIBLE_MS) {
      window.setTimeout(tryHide, MIN_VISIBLE_MS - elapsed);
      return;
    }

    hide();
  }

  function hide() {
    if (settled) {
      return;
    }

    settled = true;
    sessionStorage.removeItem(NAV_KEY);

    const root = document.getElementById('preloader');
    document.documentElement.classList.remove('is-preload');

    if (!root) {
      return;
    }

    root.setAttribute('aria-busy', 'false');
    root.classList.add('is-hidden');

    const remove = () => {
      if (root.parentNode) {
        root.remove();
      }
    };

    root.addEventListener('transitionend', remove, { once: true });
    window.setTimeout(remove, 500);
  }

  function showForNavigation() {
    settled = false;
    loadDone = false;
    minDone = false;
    document.documentElement.classList.add('is-preload');

    if (document.body) {
      ensureMounted();
      startMinTimer();
    }

    try {
      sessionStorage.setItem(NAV_KEY, String(Date.now()));
    } catch (_) {
      /* ignore */
    }
  }

  function isInternalNavLink(anchor) {
    if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) {
      return false;
    }

    const href = anchor.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) {
      return false;
    }

    let url;
    try {
      url = new URL(anchor.href, window.location.href);
    } catch (_) {
      return false;
    }

    if (url.origin !== window.location.origin) {
      return false;
    }

    // Same-page hash / query-only changes: skip.
    if (url.pathname === window.location.pathname && url.search === window.location.search) {
      return false;
    }

    return true;
  }

  function onDocumentClick(event) {
    if (event.defaultPrevented || event.button !== 0) {
      return;
    }

    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }

    const anchor = event.target.closest('a[href]');
    if (!isInternalNavLink(anchor)) {
      return;
    }

    showForNavigation();
  }

  function onPageShow(event) {
    if (event.persisted) {
      // Back-forward cache: page is already ready.
      loadDone = true;
      minDone = true;
      hide();
    }
  }
})();
