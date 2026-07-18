import i18n from './i18n.js';
import { bindPhoneMask } from '../utils/phone-mask.js';

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

/** Partial uses paths for /pages/*; on the home page strip one "../". */
function rewriteFooterPathsForHome(footer) {
  if (document.body.dataset.page !== 'home') {
    return;
  }

  footer.querySelectorAll('a[href]').forEach((link) => {
    const href = link.getAttribute('href');
    if (!href) {
      return;
    }

    if (href === '../index.html' || href.startsWith('../index.html#')) {
      link.setAttribute('href', href.replace('../index.html', 'index.html'));
    }
  });

  footer.querySelectorAll('[src]').forEach((el) => {
    const src = el.getAttribute('src');
    if (src?.startsWith('../assets/')) {
      el.setAttribute('src', src.slice(3));
    }
  });

  footer.querySelectorAll('[srcset]').forEach((el) => {
    const srcset = el.getAttribute('srcset');
    if (srcset) {
      el.setAttribute('srcset', srcset.replaceAll('../assets/', 'assets/'));
    }
  });
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
  const footerUrl = new URL('../../partials/footer.html', import.meta.url);

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
    rewriteFooterPathsForHome(footer);
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
