import api from './api.js';
import i18n from './i18n.js';
import { getCurrentUser, isAdmin, requireAuth, setCurrentUser } from './auth-session.js';
import { openModal } from './components/modal.js';

class ProfilePage {
  constructor() {
    this.user = null;
    this.orders = [];
    this.activeTab = 'orders';
    this.elements = {
      avatar: document.getElementById('profile-avatar'),
      name: document.getElementById('profile-name'),
      nickname: document.getElementById('profile-nickname'),
      email: document.getElementById('profile-email'),
      phone: document.getElementById('profile-phone'),
      role: document.getElementById('profile-role'),
      orders: document.getElementById('orders-list'),
      ordersEmpty: document.getElementById('orders-empty'),
      ordersCount: document.getElementById('profile-orders-count'),
      tabButtons: document.querySelectorAll('[data-profile-tab]'),
      panels: document.querySelectorAll('[data-profile-panel]'),
      form: document.getElementById('profile-settings-form'),
      logout: document.getElementById('profile-logout')
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
    this.user = getCurrentUser();
    await this.loadOrders();
    this.renderUser();
    this.fillSettingsForm();
    this.renderOrders();
    this.openTab(this.activeTab);
    this.bindEvents();

    document.addEventListener('languageChanged', () => {
      this.renderUser();
      this.renderOrders();
    });
  }

  async loadOrders() {
    try {
      const orders = await api.getOrders({ userId: this.user.id });
      this.orders = Array.isArray(orders)
        ? orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        : [];
    } catch {
      this.orders = [];
    }
  }

  formatPrice(price) {
    return `${new Intl.NumberFormat(i18n.currentLang).format(price)}\u00A0${i18n.t('common.currency')}`;
  }

  formatDate(value) {
    if (!value) {
      return '';
    }

    return new Intl.DateTimeFormat(i18n.currentLang, {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(value));
  }

  escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;');
  }

  statusLabel(status) {
    return i18n.t(`profile.status.${status}`) || status;
  }

  getInitials() {
    const first = String(this.user.firstName || '').trim().charAt(0);
    const last = String(this.user.lastName || '').trim().charAt(0);

    if (first || last) {
      return `${first}${last}`.toUpperCase();
    }

    const nickname = String(this.user.nickname || this.user.email || '?').trim();
    return nickname.slice(0, 2).toUpperCase();
  }

  renderUser() {
    const fullName = [this.user.firstName, this.user.lastName].filter(Boolean).join(' ');
    this.elements.avatar.textContent = this.getInitials();
    this.elements.name.textContent = fullName || this.user.nickname || this.user.email;
    this.elements.nickname.textContent = this.user.nickname || '—';
    this.elements.email.textContent = this.user.email || '—';
    this.elements.phone.textContent = this.user.phone || '—';
    this.elements.role.textContent = i18n.t(`roles.${this.user.role}`) || this.user.role;
  }

  fillSettingsForm() {
    this.elements.form.elements.firstName.value = this.user.firstName || '';
    this.elements.form.elements.lastName.value = this.user.lastName || '';
    this.elements.form.elements.email.value = this.user.email || '';
    this.elements.form.elements.phone.value = this.user.phone || '';
  }

  renderOrders() {
    const hasOrders = this.orders.length > 0;
    this.elements.ordersEmpty.hidden = hasOrders;
    this.elements.orders.hidden = !hasOrders;
    this.elements.ordersCount.hidden = !hasOrders;
    this.elements.ordersCount.textContent = String(this.orders.length);

    if (!hasOrders) {
      this.elements.orders.innerHTML = '';
      return;
    }

    this.elements.orders.innerHTML = this.orders.map((order) => {
      const itemsHtml = (order.items || []).map((item) => {
        const name = item.name_i18n?.[i18n.currentLang] || item.name || item.productId;
        return `<li>${this.escapeHtml(name)} × ${item.quantity}</li>`;
      }).join('');

      return `
        <article class="profile-order">
          <div class="profile-order__head">
            <div>
              <h3 class="profile-order__id">${this.escapeHtml(i18n.t('profile.order'))} ${this.escapeHtml(order.id)}</h3>
              <p class="profile-order__date">${this.escapeHtml(this.formatDate(order.createdAt))}</p>
            </div>
            <span class="profile-order__status profile-order__status--${this.escapeHtml(order.status)}">${this.escapeHtml(this.statusLabel(order.status))}</span>
          </div>
          <ul class="profile-order__items">${itemsHtml}</ul>
          <p class="profile-order__total">${this.escapeHtml(i18n.t('profile.orderTotal'))}: ${this.formatPrice(order.total)}</p>
        </article>
      `;
    }).join('');
  }

  openTab(tabName) {
    if (!['orders', 'settings'].includes(tabName)) {
      return;
    }

    this.activeTab = tabName;

    this.elements.tabButtons.forEach((button) => {
      const isActive = button.dataset.profileTab === tabName;
      button.classList.toggle('profile-tabs__btn--active', isActive);
      button.setAttribute('aria-selected', String(isActive));
      button.tabIndex = isActive ? 0 : -1;
    });

    this.elements.panels.forEach((panel) => {
      panel.hidden = panel.dataset.profilePanel !== tabName;
    });
  }

  bindEvents() {
    this.elements.tabButtons.forEach((button) => {
      button.addEventListener('click', () => this.openTab(button.dataset.profileTab));
    });

    this.elements.form.addEventListener('submit', (event) => this.handleSettingsSubmit(event));
    this.elements.logout.addEventListener('click', () => {
      setCurrentUser(null);
      window.location.href = 'index.html';
    });
  }

  async handleSettingsSubmit(event) {
    event.preventDefault();

    const firstName = this.elements.form.elements.firstName.value.trim();
    const lastName = this.elements.form.elements.lastName.value.trim();
    const email = this.elements.form.elements.email.value.trim();
    const phone = this.elements.form.elements.phone.value.trim();

    if (firstName.length < 2 || lastName.length < 2 || !email || !phone) {
      openModal({
        title: i18n.t('profile.settingsErrorTitle'),
        message: i18n.t('profile.settingsInvalid'),
        type: 'error'
      });
      return;
    }

    try {
      const updated = await api.updateUser(this.user.id, {
        firstName,
        lastName,
        email,
        phone
      });

      this.user = { ...this.user, ...updated };
      setCurrentUser(this.user);
      this.renderUser();

      openModal({
        title: i18n.t('profile.settingsSuccessTitle'),
        message: i18n.t('profile.settingsSuccessMessage'),
        type: 'success'
      });
    } catch (error) {
      openModal({
        title: i18n.t('profile.settingsErrorTitle'),
        message: error.message || i18n.t('profile.settingsErrorMessage'),
        type: 'error'
      });
    }
  }
}

new ProfilePage().init();
