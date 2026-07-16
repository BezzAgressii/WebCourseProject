import { initBurgerMenu } from './components/burger-menu.js';
import { initContactModals } from './components/contact-modals.js';
import { getCurrentUser, isAdmin } from './auth-session.js';
import { getCartCount } from './cart-storage.js';
import i18n from './i18n.js';

initBurgerMenu();
void initHeaderExtras();

async function initHeaderExtras() {
  await i18n.init();
  initContactModals();

  const actions = document.querySelector('.header__actions');

  if (!actions) {
    return;
  }

  ensureCartLink(actions);
  updateAuthLinks();
  updateCartBadge();

  document.addEventListener('cartUpdated', updateCartBadge);
  document.addEventListener('languageChanged', () => {
    updateAuthLinks();
    updateCartBadge();
  });
}

function ensureCartLink(actions) {
  if (actions.querySelector('[data-header-cart]')) {
    return;
  }

  const cart = document.createElement('a');
  cart.className = 'header__cart';
  cart.dataset.headerCart = '';
  cart.setAttribute('aria-label', 'Корзина');
  cart.innerHTML = `
    <svg class="header__cart-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6.5 8h11l-.8 9.2a2 2 0 0 1-2 1.8H9.3a2 2 0 0 1-2-1.8L6.5 8Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
      <path d="M9 8V6.8A3 3 0 0 1 12 3.8 3 3 0 0 1 15 6.8V8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
    </svg>
    <span class="header__cart-count" data-cart-count hidden>0</span>
  `;

  const profile = actions.querySelector('[data-header-profile]');

  if (profile) {
    profile.before(cart);
  } else {
    actions.prepend(cart);
  }
}

function updateAuthLinks() {
  const user = getCurrentUser();
  const admin = isAdmin();
  const profile = document.querySelector('[data-header-profile]');
  const cart = document.querySelector('[data-header-cart]');

  if (profile) {
    if (user) {
      profile.href = admin ? 'admin.html' : 'profile.html';
      profile.classList.add('header__profile--auth');
      profile.title = user.nickname || user.email || '';
    } else {
      profile.href = 'login.html';
      profile.classList.remove('header__profile--auth');
      profile.title = '';
    }

    profile.setAttribute('aria-label', i18n.t('header.profile'));
  }

  if (cart) {
    cart.hidden = admin;
    cart.href = user && !admin ? 'cart.html' : 'login.html';
    cart.setAttribute('aria-label', i18n.t('header.cart'));
  }
}

function updateCartBadge() {
  const badge = document.querySelector('[data-cart-count]');

  if (!badge) {
    return;
  }

  if (isAdmin() || !getCurrentUser()) {
    badge.hidden = true;
    badge.textContent = '0';
    return;
  }

  void getCartCount()
    .then((count) => {
      badge.textContent = String(count);
      badge.hidden = count < 1;
    })
    .catch(() => {
      badge.textContent = '0';
      badge.hidden = true;
    });
}
