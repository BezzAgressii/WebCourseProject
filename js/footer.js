import i18n from './i18n.js';
import { bindPhoneMask } from './utils/phone-mask.js';

const FOOTER_VARIANT_BY_PAGE = {
  home: 'full',
  catalog: 'full',
  category: 'full',
  product: 'full',
  profile: 'full',
  cart: 'full',
  contacts: 'compact'
};

function resolveFooterVariant(mount) {
  const explicit = mount.dataset.footer?.trim();
  if (explicit === 'full' || explicit === 'compact') {
    return explicit;
  }

  const page = document.body.dataset.page || '';
  return FOOTER_VARIANT_BY_PAGE[page] || 'full';
}

function applyFooterVariant(footer, variant) {
  footer.dataset.footerVariant = variant;

  if (variant === 'compact') {
    footer.querySelectorAll('[data-footer-part="form"]').forEach((part) => part.remove());
  }
}

function bindFooterPhoneMask(footer) {
  footer.querySelectorAll('.footer__form input[name="phone"]').forEach((input) => {
    bindPhoneMask(input);
  });
}

export async function loadFooter() {
  const mount = document.querySelector('[data-footer]');

  if (!mount) {
    return null;
  }

  if (document.querySelector('[data-footer-root]')) {
    return document.querySelector('[data-footer-root]');
  }

  const variant = resolveFooterVariant(mount);
  const footerUrl = new URL('../partials/footer.html', import.meta.url);

  try {
    const response = await fetch(footerUrl);

    if (!response.ok) {
      throw new Error(`Footer request failed with status ${response.status}`);
    }

    const markup = await response.text();
    const template = document.createElement('template');
    template.innerHTML = markup.trim();

    const footer = template.content.querySelector('[data-footer-root]') || template.content.firstElementChild;

    if (!footer) {
      throw new Error('Footer markup is empty');
    }

    applyFooterVariant(footer, variant);
    mount.replaceWith(footer);
    bindFooterPhoneMask(footer);
    i18n.translatePage();
    document.dispatchEvent(new CustomEvent('footerReady', { detail: { variant } }));

    return footer;
  } catch (error) {
    console.error('Failed to load footer:', error);
    mount.innerHTML = '';
    return null;
  }
}

export default loadFooter;
