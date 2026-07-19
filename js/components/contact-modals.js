import api from '../utils/api.js';
import i18n from '../common/i18n.js';
import { getCurrentUser, isAdmin } from '../utils/auth-session.js';
import { Modal } from './modal.js';
import { bindPhoneMask, isValidBelarusPhone } from '../utils/phone-mask.js';

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

function showAdminForbidden() {
  Modal.showError(i18n.t('auth.adminForbiddenMessage'), {
    title: i18n.t('auth.adminForbiddenTitle'),
    closeLabel: i18n.t('common.close')
  });
}

export function openRequestModal(options = {}) {
  if (isAdmin()) {
    showAdminForbidden();
    return;
  }

  if (Modal.element?.classList.contains('pv-modal--request')) {
    return;
  }

  const objectType = String(options.objectType || '').trim();
  const objectTypeKey = String(options.objectTypeKey || '').trim();
  const objectTypeHtml = objectType
    ? `<p class="pv-modal__object-type"><span class="pv-modal__object-type-label">${i18n.t('modal.request.objectType')}</span> <strong>${escapeHtml(objectType)}</strong></p>`
    : '';

  Modal.open({
    variant: 'pv',
    type: 'request',
    titleHtml: titleWithAccent(i18n.t('modal.request.title1'), i18n.t('modal.request.title2')),
    body: `
      ${objectTypeHtml}
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
    footerHtml: brandFooter(),
    onReady: (modal) => {
      const form = modal.querySelector('#pv-request-form');
      const nameInput = form.elements.name;
      const phoneInput = form.elements.phone;
      const submit = form.querySelector('.pv-modal__submit');

      bindPhoneMask(phoneInput);

      const validateName = (input) => {
        const valid = input.value.trim().length >= 2;
        input.classList.toggle('pv-modal__input--invalid', !valid);
        return valid;
      };

      const validatePhone = (input) => {
        const valid = isValidBelarusPhone(input.value);
        input.classList.toggle('pv-modal__input--invalid', !valid);
        return valid;
      };

      nameInput.addEventListener('input', () => validateName(nameInput));
      phoneInput.addEventListener('input', () => validatePhone(phoneInput));

      form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const nameOk = validateName(nameInput);
        const phoneOk = validatePhone(phoneInput);

        if (!nameOk || !phoneOk) {
          Modal.showError(
            phoneOk ? i18n.t('modal.request.invalid') : i18n.t('validation.phone'),
            {
              title: i18n.t('modal.request.errorTitle'),
              closeLabel: i18n.t('common.close'),
              stack: true
            }
          );
          return;
        }

        submit.disabled = true;

        try {
          const payload = {
            name: nameInput.value.trim(),
            phone: phoneInput.value.trim(),
            userId: getCurrentUser()?.id ?? null,
            createdAt: new Date().toISOString()
          };

          if (objectType) {
            payload.objectType = objectType;
            payload.source = 'showcase';
          }

          if (objectTypeKey) {
            payload.objectTypeKey = objectTypeKey;
          }

          await api.createCallback(payload);

          Modal.close({ silent: true });
          Modal.showSuccess(i18n.t('modal.request.successMessage'), {
            title: i18n.t('modal.request.successTitle'),
            closeLabel: i18n.t('common.close')
          });
        } catch (error) {
          Modal.showError(error.message || i18n.t('modal.request.errorMessage'), {
            title: i18n.t('modal.request.errorTitle'),
            closeLabel: i18n.t('common.close'),
            stack: true
          });
          submit.disabled = false;
        }
      });
    }
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function openContactModal() {
  if (Modal.element?.classList.contains('pv-modal--contact')) {
    return;
  }

  Modal.open({
    variant: 'pv',
    type: 'contact',
    titleHtml: titleWithAccent(i18n.t('modal.contact.title1'), i18n.t('modal.contact.title2')),
    body: `
      <p class="pv-modal__text">${i18n.t('modal.contact.text')}</p>
      <p class="pv-modal__schedule-title">${i18n.t('modal.contact.scheduleTitle')}</p>
      <div class="pv-modal__schedule">
        ${CLOCK_ICON}
        <span>${i18n.t('modal.contact.schedule')}</span>
      </div>
      <div class="pv-modal__phones">
        <a class="pv-modal__phone" href="tel:+375222736331">
          ${PHONE_ICON}
          <span>+375 222 73-63-31</span>
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
  if (isAdmin()) {
    showAdminForbidden();
    return;
  }

  const name = form.elements.name?.value.trim() || '';
  const phone = form.elements.phone?.value.trim() || '';

  if (name.length < 2 || !isValidBelarusPhone(phone)) {
    Modal.showError(
      name.length < 2 ? i18n.t('modal.request.invalid') : i18n.t('validation.phone'),
      {
        title: i18n.t('modal.request.errorTitle'),
        closeLabel: i18n.t('common.close')
      }
    );
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
      userId: getCurrentUser()?.id ?? null,
      createdAt: new Date().toISOString()
    });

    form.reset();
    Modal.showSuccess(i18n.t('modal.request.successMessage'), {
      title: i18n.t('modal.request.successTitle'),
      closeLabel: i18n.t('common.close')
    });
  } catch (error) {
    Modal.showError(error.message || i18n.t('modal.request.errorMessage'), {
      title: i18n.t('modal.request.errorTitle'),
      closeLabel: i18n.t('common.close')
    });
  } finally {
    if (submit) {
      submit.disabled = false;
    }
  }
}

function bindPhoneMasksInDocument() {
  document.querySelectorAll('.footer__form input[name="phone"], .cta-form__form input[name="phone"], #pv-request-phone').forEach((input) => {
    bindPhoneMask(input);
  });
}

export function initContactModals() {
  if (document.documentElement.dataset.contactModalsReady === 'true') {
    return;
  }

  document.documentElement.dataset.contactModalsReady = 'true';
  bindPhoneMasksInDocument();

  document.addEventListener('click', (event) => {
    const contactTrigger = event.target.closest('[data-modal="contact"]');
    const requestTrigger = event.target.closest('[data-modal="request"], [data-action="submit"]');

    if (contactTrigger) {
      event.preventDefault();
      void i18n.init().then(() => openContactModal());
      return;
    }

    if (!requestTrigger) {
      return;
    }

    if (requestTrigger.closest('form') && requestTrigger.getAttribute('type') === 'submit') {
      return;
    }

    event.preventDefault();
    void i18n.init().then(() => openRequestModal());
  });

  document.addEventListener('submit', (event) => {
    const form = event.target.closest('.footer__form, .cta-form__form');

    if (!form) {
      return;
    }

    event.preventDefault();
    void i18n.init().then(() => submitInlineCallbackForm(form));
  });
}
