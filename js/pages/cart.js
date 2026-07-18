import api from '../utils/api.js';
import i18n from '../common/i18n.js';
import {
  clearCart,
  getCartItems,
  removeFromCart,
  updateCartQuantity
} from '../utils/cart-storage.js';
import { getCurrentUser, isAdmin, requireAuth } from '../utils/auth-session.js';
import { showConfirm } from '../components/confirm.js';
import { Modal } from '../components/modal.js';

class CartPage {
  constructor() {
    this.products = new Map();
    this.cartItems = [];
    this.elements = {
      list: document.getElementById('cart-list'),
      empty: document.getElementById('cart-empty'),
      summary: document.getElementById('cart-summary'),
      total: document.getElementById('cart-total'),
      order: document.getElementById('cart-order')
    };
  }

  async init() {
    if (!requireAuth()) {
      return;
    }

    if (isAdmin()) {
      window.location.href = 'admin.html';
      return;
    }

    await i18n.init();
    await this.loadProducts();
    await this.refreshCart();
    this.bindEvents();

    document.addEventListener('languageChanged', () => this.render());
  }

  async loadProducts() {
    const products = await api.getProducts();
    this.products = new Map(products.map((product) => [product.id, product]));
  }

  async refreshCart() {
    this.cartItems = await getCartItems();
    this.render();
  }

  getLines() {
    return this.cartItems
      .map((item) => {
        const product = this.products.get(item.productId);

        if (!product) {
          return null;
        }

        const quantity = Math.max(1, Number(item.quantity) || 1);
        const lineTotal = product.price * quantity;

        return { product, quantity, lineTotal };
      })
      .filter(Boolean);
  }

  formatPrice(price) {
    return `${new Intl.NumberFormat(i18n.currentLang).format(price)} ${i18n.t('common.currency')}`;
  }

  escapeHtml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;');
  }

  render() {
    const lines = this.getLines();
    const hasItems = lines.length > 0;

    this.elements.empty.hidden = hasItems;
    this.elements.list.hidden = !hasItems;
    this.elements.summary.hidden = !hasItems;
    this.elements.order.disabled = !hasItems;

    if (!hasItems) {
      this.elements.list.innerHTML = '';
      this.elements.total.innerHTML = this.formatPrice(0);
      return;
    }

    this.elements.list.innerHTML = lines.map(({ product, quantity, lineTotal }) => {
      const name = product.name_i18n?.[i18n.currentLang] || product.name_i18n?.ru || product.id;
      const image = product.images?.[0]
        ? `../${product.images[0]}`
        : '../assets/images/cta-fan.png';
      const detailUrl = `product.html?id=${encodeURIComponent(product.id)}`;

      return `
        <article class="cart-item" data-product-id="${this.escapeHtml(product.id)}">
          <a class="cart-item__media" href="${detailUrl}">
            <img src="${this.escapeHtml(image)}" alt="${this.escapeHtml(name)}" loading="lazy">
          </a>
          <div class="cart-item__content">
            <a class="cart-item__title" href="${detailUrl}">${this.escapeHtml(name)}</a>
            <p class="cart-item__unit">${this.escapeHtml(i18n.t('cart.unitPrice'))}: ${this.formatPrice(product.price)}</p>
            <div class="cart-item__controls">
              <div class="cart-qty">
                <button class="cart-qty__btn" type="button" data-action="decrease" aria-label="${this.escapeHtml(i18n.t('cart.decrease'))}">−</button>
                <input class="cart-qty__input" type="number" min="1" value="${quantity}" data-action="quantity" aria-label="${this.escapeHtml(i18n.t('cart.quantity'))}">
                <button class="cart-qty__btn" type="button" data-action="increase" aria-label="${this.escapeHtml(i18n.t('cart.increase'))}">+</button>
              </div>
              <p class="cart-item__line-total">${this.formatPrice(lineTotal)}</p>
              <button class="cart-item__remove" type="button" data-action="remove">${this.escapeHtml(i18n.t('cart.remove'))}</button>
            </div>
          </div>
        </article>
      `;
    }).join('');

    const total = lines.reduce((sum, line) => sum + line.lineTotal, 0);
    this.elements.total.innerHTML = this.formatPrice(total);
  }

  bindEvents() {
    this.elements.list.addEventListener('click', async (event) => {
      const item = event.target.closest('.cart-item');

      if (!item) {
        return;
      }

      const productId = item.dataset.productId;

      try {
        if (event.target.closest('[data-action="increase"]')) {
          const input = item.querySelector('[data-action="quantity"]');
          this.cartItems = await updateCartQuantity(productId, Number(input.value) + 1);
          this.render();
          return;
        }

        if (event.target.closest('[data-action="decrease"]')) {
          const input = item.querySelector('[data-action="quantity"]');
          this.cartItems = await updateCartQuantity(productId, Math.max(1, Number(input.value) - 1));
          this.render();
          return;
        }

        if (event.target.closest('[data-action="remove"]')) {
          this.cartItems = await removeFromCart(productId);
          this.render();
        }
      } catch (error) {
        Modal.showError(error.message || i18n.t('cart.orderErrorMessage'), {
          title: i18n.t('common.error')
        });
      }
    });

    this.elements.list.addEventListener('change', async (event) => {
      const input = event.target.closest('[data-action="quantity"]');
      const item = event.target.closest('.cart-item');

      if (!input || !item) {
        return;
      }

      try {
        this.cartItems = await updateCartQuantity(item.dataset.productId, input.value);
        this.render();
      } catch (error) {
        Modal.showError(error.message || i18n.t('cart.orderErrorMessage'), {
          title: i18n.t('common.error')
        });
      }
    });

    this.elements.order.addEventListener('click', () => this.handleOrder());
  }

  async handleOrder() {
    const lines = this.getLines();

    if (!lines.length) {
      return;
    }

    const total = lines.reduce((sum, line) => sum + line.lineTotal, 0);
    const confirmed = await showConfirm(i18n.t('cart.orderConfirmMessage'), {
      title: i18n.t('cart.orderConfirmTitle'),
      confirmLabel: i18n.t('cart.orderConfirm'),
      cancelLabel: i18n.t('common.cancel')
    });

    if (!confirmed) {
      return;
    }

    const user = getCurrentUser();

    try {
      await api.createOrder({
        userId: user.id,
        total,
        status: 'processing',
        items: lines.map(({ product, quantity, lineTotal }) => ({
          productId: product.id,
          name: product.name_i18n?.ru || product.id,
          name_i18n: product.name_i18n,
          price: product.price,
          quantity,
          lineTotal,
          image: product.images?.[0] || ''
        }))
      });

      this.cartItems = await clearCart();
      this.render();

      Modal.showSuccess(i18n.t('cart.orderSuccessMessage'), {
        title: i18n.t('cart.orderSuccessTitle'),
        actionHref: 'profile.html',
        actionLabel: i18n.t('cart.goToProfile'),
        closeLabel: i18n.t('common.close')
      });
    } catch (error) {
      Modal.showError(error.message || i18n.t('cart.orderErrorMessage'), {
        title: i18n.t('cart.orderErrorTitle')
      });
    }
  }
}

new CartPage().init();
