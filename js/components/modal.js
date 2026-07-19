import i18n from '../common/i18n.js';

function assetUrl(relativeFromJsComponents) {
  return new URL(relativeFromJsComponents, import.meta.url).href;
}

function stylesheetPresent(pathPart) {
  return [...document.querySelectorAll('link[rel="stylesheet"]')].some((link) => {
    const href = link.getAttribute('href') || link.href || '';
    return href.includes(pathPart);
  });
}

function ensureModalStyles() {
  if (!stylesheetPresent('auth.css') && !document.querySelector('link[data-auth-css]')) {
    const authLink = document.createElement('link');
    authLink.rel = 'stylesheet';
    authLink.href = assetUrl('../../css/auth.css');
    authLink.dataset.authCss = '';
    document.head.append(authLink);
  }

  if (!stylesheetPresent('contact-modals.css') && !document.querySelector('link[data-contact-modals-css]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = assetUrl('../../css/contact-modals.css');
    link.dataset.contactModalsCss = '';
    document.head.append(link);
  }
}

function focusWithoutScroll(element) {
  if (!element || typeof element.focus !== 'function') {
    return;
  }

  try {
    element.focus({ preventScroll: true });
  } catch {
    element.focus();
  }
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

class Modal {
  #root = null;
  #onKeyDown = null;
  #onClose = null;
  #settled = false;
  #stack = [];
  #scrollY = null;

  get isOpen() {
    return Boolean(this.#root) || this.#stack.length > 0;
  }

  get element() {
    return this.#root;
  }

  /**
   * Open a modal.
   * - Modal.open(htmlString | HTMLElement, options?)
   * - Modal.open({ title, message|body, type, className, titleHtml, footerHtml, stack, ... })
   */
  open(content, options = {}) {
    ensureModalStyles();

    if (this.isContentOptions(content)) {
      options = { ...content, ...options };
      content = options.body ?? options.content ?? null;
    }

    if (options.stack && this.#root) {
      return this.#openStackedAlert(options, content);
    }

    this.close({ silent: true });
    this.#settled = false;
    this.#onClose = typeof options.onClose === 'function' ? options.onClose : null;

    const root = document.createElement('div');
    const variant = options.variant || (options.titleHtml || options.className?.includes('pv-modal') ? 'pv' : 'alert');

    if (variant === 'pv') {
      this.#renderPvShell(root, content, options);
    } else if (typeof options.onConfirm === 'function' || options.confirmLabel) {
      this.#renderAlertShell(root, {
        ...options,
        message: options.message ?? (typeof content === 'string' ? content : ''),
        title: options.title
      });
    } else if (content instanceof Node || (typeof content === 'string' && options.raw)) {
      this.#renderCustomShell(root, content, options);
    } else {
      this.#renderAlertShell(root, {
        ...options,
        message: options.message ?? (typeof content === 'string' ? content : ''),
        title: options.title
      });
    }

    this.#root = root;
    this.#bindChrome(root, options);
    document.body.append(root);
    this.#lockScroll(true);

    requestAnimationFrame(() => {
      if (this.#root !== root) {
        return;
      }

      root.classList.add('is-open');

      const focusTarget = root.querySelector(
        '[data-modal-focus], .pv-modal__input, .auth-modal__close, .pv-modal__close, button, [href], input'
      );
      focusWithoutScroll(focusTarget);

      if (typeof options.onReady === 'function') {
        options.onReady(root);
      }
    });

    return root;
  }

  close(options = {}) {
    if (this.#stack.length) {
      this.#closeStacked();
      return;
    }

    if (!this.#root) {
      if (!options.silent && this.#onClose) {
        const callback = this.#onClose;
        this.#onClose = null;
        callback();
      }
      return;
    }

    if (this.#settled && !options.force) {
      return;
    }

    this.#settled = true;

    if (this.#onKeyDown) {
      document.removeEventListener('keydown', this.#onKeyDown);
      this.#onKeyDown = null;
    }

    const root = this.#root;
    this.#root = null;
    root.classList.remove('is-open');
    root.remove();
    this.#lockScroll(false);

    const callback = this.#onClose;
    this.#onClose = null;

    if (!options.silent && typeof callback === 'function') {
      callback();
    }
  }

  showSuccess(message, options = {}) {
    return this.open({
      ...options,
      type: 'success',
      title: options.title || i18n.t('common.success'),
      message
    });
  }

  showError(message, options = {}) {
    return this.open({
      ...options,
      type: 'error',
      title: options.title || i18n.t('common.error'),
      message
    });
  }

  confirm(message, options = {}) {
    return new Promise((resolve) => {
      let decided = false;

      this.open({
        title: options.title || i18n.t('common.confirmTitle'),
        message,
        type: options.type || 'info',
        confirmLabel: options.confirmLabel || i18n.t('common.confirm'),
        cancelLabel: options.cancelLabel || i18n.t('common.cancel'),
        onConfirm: () => {
          decided = true;
          resolve(true);
        },
        onClose: () => {
          if (!decided) {
            resolve(false);
          }
        }
      });
    });
  }

  isContentOptions(value) {
    return Boolean(
      value
      && typeof value === 'object'
      && !(value instanceof Node)
      && (
        'title' in value
        || 'message' in value
        || 'body' in value
        || 'titleHtml' in value
        || 'content' in value
        || 'onConfirm' in value
        || 'variant' in value
      )
    );
  }

  #openStackedAlert(options, content) {
    const root = document.createElement('div');
    this.#renderAlertShell(root, {
      ...options,
      message: options.message ?? (typeof content === 'string' ? content : ''),
      title: options.title
    });

    root.style.zIndex = '500';

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        this.#closeStacked();
      }
    };

    const entry = { root, onKeyDown, onClose: options.onClose || null };
    this.#stack.push(entry);

    root.querySelectorAll('[data-action="close"]').forEach((element) => {
      element.addEventListener('click', () => this.#closeStacked());
    });

    document.addEventListener('keydown', onKeyDown);
    document.body.append(root);
    requestAnimationFrame(() => root.classList.add('is-open'));
    focusWithoutScroll(root.querySelector('.auth-modal__close'));
    return root;
  }

  #closeStacked() {
    const entry = this.#stack.pop();
    if (!entry) {
      return;
    }

    document.removeEventListener('keydown', entry.onKeyDown);
    entry.root.remove();
    entry.onClose?.();

    if (this.#root) {
      focusWithoutScroll(this.#root.querySelector('.pv-modal__input, .pv-modal__close, .auth-modal__close'));
    }
  }

  #lockScroll(lock) {
    if (lock) {
      this.#scrollY = window.scrollY || window.pageYOffset || 0;
      document.documentElement.classList.add('is-modal-open');
      document.body.dataset.modalScrollLock = 'true';
      return;
    }

    document.documentElement.classList.remove('is-modal-open');
    delete document.body.dataset.modalScrollLock;

    if (typeof this.#scrollY === 'number') {
      window.scrollTo(0, this.#scrollY);
      this.#scrollY = null;
    }
  }

  #bindChrome(root, options) {
    this.#onKeyDown = (event) => {
      if (event.key === 'Escape') {
        this.close();
      }
    };

    document.addEventListener('keydown', this.#onKeyDown);

    root.querySelectorAll('[data-action="close"]').forEach((element) => {
      element.addEventListener('click', () => this.close());
    });

    root.querySelectorAll('[data-action="confirm"]').forEach((element) => {
      element.addEventListener('click', () => {
        const onConfirm = options.onConfirm;
        this.#onClose = null;
        this.close({ silent: true });
        onConfirm?.();
      });
    });
  }

  #renderAlertShell(root, options) {
    const type = options.type || 'info';
    const title = escapeHtml(options.title || '');
    const message = escapeHtml(options.message || '');
    const closeLabel = escapeHtml(options.closeLabel || i18n.t('common.close') || 'OK');
    const actionLabel = escapeHtml(options.actionLabel || 'OK');
    const confirmLabel = escapeHtml(options.confirmLabel || actionLabel);
    const cancelLabel = escapeHtml(options.cancelLabel || closeLabel);

    let actions;

    if (typeof options.onConfirm === 'function') {
      actions = `
        <div class="auth-modal__actions">
          <button class="auth-modal__button" type="button" data-action="confirm">${confirmLabel}</button>
          <button class="auth-modal__button auth-modal__button--ghost" type="button" data-action="close">${cancelLabel}</button>
        </div>
      `;
    } else if (options.actionHref) {
      actions = `
        <div class="auth-modal__actions">
          <a class="auth-modal__button" href="${escapeHtml(options.actionHref)}">${actionLabel}</a>
          <button class="auth-modal__button auth-modal__button--ghost" type="button" data-action="close">${closeLabel}</button>
        </div>
      `;
    } else {
      actions = `<button class="auth-modal__button" type="button" data-action="close">${closeLabel}</button>`;
    }

    root.className = `auth-modal auth-modal--${type}`;
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-labelledby', 'app-modal-title');
    root.innerHTML = `
      <div class="auth-modal__backdrop" data-action="close"></div>
      <section class="auth-modal__dialog auth-modal__dialog--${type}">
        <button class="auth-modal__close" type="button" data-action="close" aria-label="${closeLabel}">×</button>
        <h2 class="auth-modal__title" id="app-modal-title">${title}</h2>
        <p class="auth-modal__message">${message}</p>
        ${actions}
      </section>
    `;
  }

  #renderPvShell(root, content, options) {
    const type = options.type || 'dialog';
    const titleHtml = options.titleHtml || escapeHtml(options.title || '');
    const bodyHtml = content instanceof Node
      ? ''
      : (content || options.body || options.bodyHtml || '');
    const footerHtml = options.footerHtml || options.footer || '';

    root.className = options.className || `pv-modal pv-modal--${type}`;
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.innerHTML = `
      <div class="pv-modal__backdrop" data-action="close"></div>
      <section class="pv-modal__dialog">
        <button class="pv-modal__close" type="button" data-action="close" aria-label="${escapeHtml(i18n.t('common.close'))}">×</button>
        <header class="pv-modal__header">
          <h2 class="pv-modal__title">${titleHtml}</h2>
        </header>
        <div class="pv-modal__body" data-modal-body></div>
        ${footerHtml}
      </section>
    `;

    const body = root.querySelector('[data-modal-body]');

    if (content instanceof Node) {
      body.append(content);
    } else {
      body.innerHTML = bodyHtml;
    }
  }

  #renderCustomShell(root, content, options) {
    root.className = options.className || 'auth-modal';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.innerHTML = `
      <div class="auth-modal__backdrop" data-action="close"></div>
      <section class="auth-modal__dialog">
        <button class="auth-modal__close" type="button" data-action="close" aria-label="${escapeHtml(i18n.t('common.close'))}">×</button>
        <div data-modal-body></div>
      </section>
    `;

    const body = root.querySelector('[data-modal-body]');

    if (content instanceof Node) {
      body.append(content);
    } else {
      body.innerHTML = content;
    }
  }
}

const ModalSingleton = new Modal();

export { ModalSingleton as Modal };
export default ModalSingleton;
