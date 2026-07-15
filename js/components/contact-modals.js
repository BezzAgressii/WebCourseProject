import api from '../api.js';
import i18n from '../i18n.js';
import { openModal } from './modal.js';

const CLOCK_ICON = `
  <svg class="pv-modal__schedule-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="8.25" stroke="currentColor" stroke-width="1.8"/>
    <path d="M12 7.5V12l3 2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
`;

const PHONE_ICON = `
  <svg class="pv-modal__phone-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M8.2 4.8c.4-.4 1-.5 1.5-.3l2 1c.5.2.8.7.8 1.2v2.1c0 .4-.2.8-.6 1-.8.5-1.2 1.3-1.1 2.2.3 2.2 2 4 4.2 4.2.9.1 1.7-.3 2.2-1.1.2-.4.6-.6 1-.6h2.1c.5 0 1 .3 1.2.8l1 2c.2.5.1 1.1-.3 1.5-1.5 1.5-3.7 2.2-5.8 1.8-4.7-.8-8.5-4.6-9.3-9.3-.4-2.1.3-4.3 1.8-5.8Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
  </svg>
`;

function assetUrl(relativeFromJsComponents) {
  return new URL(relativeFromJsComponents, import.meta.url).href;
}

function ensureStylesheet() {
  if (!document.querySelector('link[data-contact-modals-css]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = assetUrl('../../css/contact-modals.css');
    link.dataset.contactModalsCss = '';
    document.head.append(link);
  }

  if (!document.querySelector('link[data-auth-css]')) {
    const authLink = document.createElement('link');
    authLink.rel = 'stylesheet';
    authLink.href = assetUrl('../../css/auth.css');
    authLink.dataset.authCss = '';
    document.head.append(authLink);
  }
}

function lockScroll(lock) {
  document.body.style.overflow = lock ? 'hidden' : '';
}

function closePvModal(modal) {
  document.removeEventListener('keydown', modal._onKeyDown);
  lockScroll(false);
  modal.remove();
}

function createShell({ type, titleHtml, bodyHtml, footerHtml = '' }) {
  ensureStylesheet();

  const modal = document.createElement('div');
  modal.className = `pv-modal pv-modal--${type}`;
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.innerHTML = `
    <div class="pv-modal__backdrop" data-action="close"></div>
    <section class="pv-modal__dialog">
      <button class="pv-modal__close" type="button" data-action="close" aria-label="${i18n.t('common.close')}">×</button>
      <header class="pv-modal__header">
        <h2 class="pv-modal__title">${titleHtml}</h2>
      </header>
      <div class="pv-modal__body">${bodyHtml}</div>
      ${footerHtml}
    </section>
  `;

  modal._onKeyDown = (event) => {
    if (event.key === 'Escape') {
      closePvModal(modal);
    }
  };

  modal.querySelectorAll('[data-action="close"]').forEach((element) => {
    element.addEventListener('click', () => closePvModal(modal));
  });

  document.addEventListener('keydown', modal._onKeyDown);
  document.body.append(modal);
  lockScroll(true);
  modal.querySelector('.pv-modal__close').focus();

  return modal;
}

function titleWithAccent(line1, line2) {
  return `
    <span class="pv-modal__title-line">${line1}</span>
    <span class="pv-modal__accent">
      <span class="pv-modal__accent-text">${line2}</span>
      <span class="pv-modal__accent-rule" aria-hidden="true"></span>
    </span>
  `;
}

function brandFooter() {
  return `
    <div class="pv-modal__brand">
      <img src="${assetUrl('../../assets/icons/logo.svg')}" alt="Pascal Vent — fresh air">
    </div>
  `;
}

export function openRequestModal() {
  const existing = document.querySelector('.pv-modal--request');

  if (existing) {
    return;
  }

  const modal = createShell({
    type: 'request',
    titleHtml: titleWithAccent(i18n.t('modal.request.title1'), i18n.t('modal.request.title2')),
    bodyHtml: `
      <form class="pv-modal__form" id="pv-request-form" novalidate>
        <div class="pv-modal__field">
          <label class="visually-hidden" for="pv-request-name">${i18n.t('footer.name')}</label>
          <input class="pv-modal__input" id="pv-request-name" name="name" type="text" autocomplete="name" required placeholder="${i18n.t('footer.namePlaceholder')}">
        </div>
        <div class="pv-modal__field">
          <label class="visually-hidden" for="pv-request-phone">${i18n.t('footer.phone')}</label>
          <input class="pv-modal__input" id="pv-request-phone" name="phone" type="tel" autocomplete="tel" required placeholder="${i18n.t('footer.phonePlaceholder')}">
        </div>
        <button class="pv-modal__submit" type="submit">${i18n.t('modal.request.submit')}</button>
      </form>
    `,
    footerHtml: brandFooter()
  });

  const form = modal.querySelector('#pv-request-form');
  const nameInput = form.elements.name;
  const phoneInput = form.elements.phone;
  const submit = form.querySelector('.pv-modal__submit');

  const validate = (input) => {
    const valid = input.value.trim().length >= 2;
    input.classList.toggle('pv-modal__input--invalid', !valid);
    return valid;
  };

  [nameInput, phoneInput].forEach((input) => {
    input.addEventListener('input', () => validate(input));
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const nameOk = validate(nameInput);
    const phoneOk = validate(phoneInput);

    if (!nameOk || !phoneOk) {
      return;
    }

    submit.disabled = true;

    try {
      await api.createCallback({
        name: nameInput.value.trim(),
        phone: phoneInput.value.trim(),
        source: 'request-modal',
        createdAt: new Date().toISOString()
      });

      closePvModal(modal);
      openModal({
        title: i18n.t('modal.request.successTitle'),
        message: i18n.t('modal.request.successMessage'),
        type: 'success',
        closeLabel: i18n.t('common.close')
      });
    } catch (error) {
      openModal({
        title: i18n.t('modal.request.errorTitle'),
        message: error.message || i18n.t('modal.request.errorMessage'),
        type: 'error',
        closeLabel: i18n.t('common.close')
      });
      submit.disabled = false;
    }
  });
}

export function openContactModal() {
  const existing = document.querySelector('.pv-modal--contact');

  if (existing) {
    return;
  }

  createShell({
    type: 'contact',
    titleHtml: titleWithAccent(i18n.t('modal.contact.title1'), i18n.t('modal.contact.title2')),
    bodyHtml: `
      <p class="pv-modal__text">${i18n.t('modal.contact.text')}</p>
      <p class="pv-modal__schedule-title">${i18n.t('modal.contact.scheduleTitle')}</p>
      <div class="pv-modal__schedule">
        ${CLOCK_ICON}
        <span>${i18n.t('modal.contact.schedule')}</span>
      </div>
      <div class="pv-modal__phones">
        <a class="pv-modal__phone" href="tel:+74923736331">
          ${PHONE_ICON}
          <span>+ 7 492 373 63 31</span>
        </a>
        <a class="pv-modal__phone" href="tel:+375293678929">
          ${PHONE_ICON}
          <span>+375 29 367-89-29</span>
        </a>
      </div>
    `
  });
}

async function submitInlineCallbackForm(form) {
  const name = form.elements.name?.value.trim() || '';
  const phone = form.elements.phone?.value.trim() || '';

  if (name.length < 2 || phone.length < 2) {
    openModal({
      title: i18n.t('modal.request.errorTitle'),
      message: i18n.t('modal.request.invalid'),
      type: 'error'
    });
    return;
  }

  const submit = form.querySelector('[type="submit"]');

  if (submit) {
    submit.disabled = true;
  }

  try {
    await api.createCallback({
      name,
      phone,
      source: form.className || 'inline-form',
      createdAt: new Date().toISOString()
    });

    form.reset();
    openModal({
      title: i18n.t('modal.request.successTitle'),
      message: i18n.t('modal.request.successMessage'),
      type: 'success',
      closeLabel: i18n.t('common.close')
    });
  } catch (error) {
    openModal({
      title: i18n.t('modal.request.errorTitle'),
      message: error.message || i18n.t('modal.request.errorMessage'),
      type: 'error',
      closeLabel: i18n.t('common.close')
    });
  } finally {
    if (submit) {
      submit.disabled = false;
    }
  }
}

export function initContactModals() {
  ensureStylesheet();

  document.addEventListener('click', (event) => {
    const contactTrigger = event.target.closest('[data-modal="contact"]');
    const requestTrigger = event.target.closest('[data-modal="request"], [data-action="submit"]');

    if (contactTrigger) {
      event.preventDefault();
      openContactModal();
      return;
    }

    if (!requestTrigger) {
      return;
    }

    if (requestTrigger.closest('form') && requestTrigger.getAttribute('type') === 'submit') {
      return;
    }

    event.preventDefault();
    openRequestModal();
  });

  document.querySelectorAll('.footer__form, .cta-form__form').forEach((form) => {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      submitInlineCallbackForm(form);
    });
  });
}
