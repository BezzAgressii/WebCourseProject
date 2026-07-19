import api from '../utils/api.js';
import { getCurrentUser, requireAdmin, setCurrentUser } from '../utils/auth-session.js';
import { Modal } from '../components/modal.js';
import { showConfirm } from '../components/confirm.js';
import ImageUploader from '../utils/loadImages.js';
import ThemeManager from '../common/theme.js';
import {
  SUBCATEGORIES,
  CATEGORY_LABELS,
  INSTALL_TYPE_BY_SUBCATEGORY,
  SUBCATEGORY_BY_INSTALL_TYPE,
  getAdminAttributeFields,
  coerceAttrValue,
  formatAttrValueForInput
} from '../utils/admin-product-fields.js';

ThemeManager.init();

const DEFAULT_IMAGES = [
  'assets/images/services-photo.png',
  'assets/images/portfolio-photo-1.png',
  'assets/images/benefits-photo-1.png'
];

class AdminPage {
  constructor() {
    this.products = [];
    this.orders = [];
    this.callbacks = [];
    this.users = [];
    this.editingId = null;
    this.imageUploader = null;
    this.elements = {
      userName: document.getElementById('admin-user-name'),
      logout: document.getElementById('admin-logout'),
      addButton: document.getElementById('admin-add-product'),
      search: document.getElementById('admin-search'),
      categoryFilter: document.getElementById('admin-category-filter'),
      tableBody: document.getElementById('admin-products-body'),
      ordersBody: document.getElementById('admin-orders-body'),
      ordersCount: document.getElementById('admin-orders-count'),
      ordersStatusFilter: document.getElementById('admin-orders-status-filter'),
      callbacksBody: document.getElementById('admin-callbacks-body'),
      callbacksCount: document.getElementById('admin-callbacks-count'),
      callbacksStatusFilter: document.getElementById('admin-callbacks-status-filter'),
      tabButtons: document.querySelectorAll('[data-admin-tab]'),
      panels: document.querySelectorAll('[data-admin-panel]'),
      modal: document.getElementById('product-modal'),
      modalTitle: document.getElementById('product-modal-title'),
      form: document.getElementById('product-form'),
      submit: document.getElementById('product-form-submit'),
      subcategory: document.querySelector('[name="subcategory"]'),
      attrs: document.getElementById('product-attrs'),
      attrsEmpty: document.getElementById('product-attrs-empty'),
      currentImages: document.getElementById('product-current-images'),
      currentImagesGrid: document.getElementById('product-current-images-grid')
    };
  }

  async init() {
    if (!requireAdmin()) {
      return;
    }

    const user = getCurrentUser();
    this.elements.userName.textContent = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email;

    this.imageUploader = new ImageUploader({
      dropZoneId: 'product-images-dropzone',
      inputId: 'product-images-input',
      previewId: 'product-images-preview',
      maxFiles: 8
    });

    this.bindEvents();
    await this.loadProducts();
  }

  bindEvents() {
    this.elements.logout.addEventListener('click', () => {
      setCurrentUser(null);
      window.location.href = 'login.html';
    });

    this.elements.addButton.addEventListener('click', () => this.openProductModal());
    this.elements.search.addEventListener('input', () => this.renderProducts());
    this.elements.categoryFilter.addEventListener('change', () => this.renderProducts());

    this.elements.tabButtons.forEach((button) => {
      button.addEventListener('click', () => this.openTab(button.dataset.adminTab));
    });

    this.elements.modal.querySelectorAll('[data-close-modal]').forEach((element) => {
      element.addEventListener('click', () => this.closeProductModal());
    });

    this.elements.form.elements.category.addEventListener('change', () => {
      this.fillSubcategories(this.elements.form.elements.category.value);
      this.renderAttributeFields();
      this.validateField(this.elements.form.elements.category);
      this.validateField(this.elements.form.elements.subcategory);
    });

    this.elements.form.elements.subcategory.addEventListener('change', () => {
      const values = this.getCurrentAttrValues();
      const category = this.elements.form.elements.category.value;
      const subcategory = this.elements.form.elements.subcategory.value;

      if (category === 'conditioning') {
        const installType = INSTALL_TYPE_BY_SUBCATEGORY[subcategory];
        if (installType) {
          values.installType = installType;
        }
      }

      this.renderAttributeFields(values);
      this.validateField(this.elements.form.elements.subcategory);
    });

    this.bindStaticFieldValidation();

    this.elements.form.addEventListener('submit', (event) => this.handleSubmit(event));

    this.elements.tableBody.addEventListener('click', (event) => {
      const editButton = event.target.closest('[data-action="edit"]');
      const deleteButton = event.target.closest('[data-action="delete"]');

      if (editButton) {
        this.openProductModal(editButton.dataset.productId);
      }

      if (deleteButton) {
        this.handleDelete(deleteButton.dataset.productId);
      }
    });

    this.elements.ordersBody.addEventListener('change', (event) => {
      const statusSelect = event.target.closest('[data-order-status]');

      if (statusSelect) {
        this.updateOrderStatus(statusSelect.dataset.orderId, statusSelect.value, statusSelect);
      }
    });

    this.elements.callbacksBody.addEventListener('change', (event) => {
      const statusSelect = event.target.closest('[data-callback-status]');

      if (statusSelect) {
        this.updateCallbackStatus(statusSelect.dataset.callbackId, statusSelect.value, statusSelect);
      }
    });

    this.elements.ordersStatusFilter.addEventListener('change', () => this.renderOrders());
    this.elements.callbacksStatusFilter.addEventListener('change', () => this.renderCallbacks());

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !this.elements.modal.hidden) {
        this.closeProductModal();
      }
    });
  }

  async loadProducts() {
    try {
      this.products = await api.getProducts();
      this.renderProducts();
    } catch (error) {
      this.elements.tableBody.innerHTML = `<tr><td colspan="5"><p class="admin-empty">${error.message}</p></td></tr>`;
    }
  }

  async loadOrders() {
    this.elements.ordersBody.innerHTML = '<tr><td colspan="5"><p class="admin-empty">Загрузка...</p></td></tr>';

    try {
      const [orders, users] = await Promise.all([api.getOrders(), api.getUsers()]);
      this.orders = Array.isArray(orders)
        ? orders.sort((first, second) => new Date(second.createdAt) - new Date(first.createdAt))
        : [];
      this.users = Array.isArray(users) ? users : [];
      this.renderOrders();
    } catch (error) {
      this.elements.ordersCount.textContent = 'Всего заказов: 0';
      this.elements.ordersBody.innerHTML = `<tr><td colspan="5"><p class="admin-empty">${error.message || 'Не удалось загрузить заказы'}</p></td></tr>`;
    }
  }

  async loadCallbacks() {
    this.elements.callbacksBody.innerHTML = '<tr><td colspan="5"><p class="admin-empty">Загрузка...</p></td></tr>';

    try {
      const [callbacks, users] = await Promise.all([api.getCallbacks(), api.getUsers()]);
      this.callbacks = Array.isArray(callbacks) ? callbacks : [];
      this.users = Array.isArray(users) ? users : [];
      this.renderCallbacks();
    } catch (error) {
      this.elements.callbacksCount.textContent = 'Всего заявок: 0';
      this.elements.callbacksBody.innerHTML = `<tr><td colspan="5"><p class="admin-empty">${error.message || 'Не удалось загрузить заявки'}</p></td></tr>`;
    }
  }

  openTab(tabName) {
    if (!['products', 'orders', 'callbacks'].includes(tabName)) {
      return;
    }

    this.elements.tabButtons.forEach((button) => {
      const isActive = button.dataset.adminTab === tabName;
      button.classList.toggle('admin-nav__btn--active', isActive);
      button.setAttribute('aria-selected', String(isActive));
    });

    this.elements.panels.forEach((panel) => {
      panel.hidden = panel.dataset.adminPanel !== tabName;
    });

    if (tabName === 'orders') {
      void this.loadOrders();
    }

    if (tabName === 'callbacks') {
      void this.loadCallbacks();
    }
  }

  getUserLabel(userId) {
    if (userId === null || userId === undefined || userId === '') {
      return { name: 'Гость', contact: '—' };
    }

    const user = this.users.find((item) => String(item.id) === String(userId));

    if (!user) {
      return { name: 'Пользователь удалён', contact: String(userId) };
    }

    const name = [user.firstName, user.lastName].filter(Boolean).join(' ')
      || user.nickname
      || user.email;

    return {
      name,
      contact: user.email || user.phone || '—'
    };
  }

  formatDate(value) {
    if (!value) {
      return '—';
    }

    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(value));
  }

  getFilteredOrders() {
    const status = this.elements.ordersStatusFilter.value;
    return this.orders.filter((order) => !status || order.status === status);
  }

  renderOrders() {
    const orders = this.getFilteredOrders();
    const total = this.orders.length;
    const filtered = orders.length;

    this.elements.ordersCount.textContent = this.elements.ordersStatusFilter.value
      ? `Показано: ${filtered} из ${total}`
      : `Всего заказов: ${total}`;

    if (!orders.length) {
      this.elements.ordersBody.innerHTML = '<tr><td colspan="5"><p class="admin-empty">Заказы не найдены</p></td></tr>';
      return;
    }

    this.elements.ordersBody.innerHTML = orders.map((order) => {
      const customer = this.getUserLabel(order.userId);
      const items = Array.isArray(order.items) ? order.items : [];
      const itemsHtml = items.length
        ? items.map((item) => {
          const name = item.name_i18n?.ru || item.name || item.productId;
          return `<li>${name} × ${item.quantity}</li>`;
        }).join('')
        : '<li>Нет товаров</li>';

      return `
        <tr>
          <td>
            <div class="admin-table__name">${customer.name}</div>
            <div class="admin-table__meta">${customer.contact}</div>
          </td>
          <td class="admin-table__date">${this.formatDate(order.createdAt)}</td>
          <td><ul class="admin-order-items">${itemsHtml}</ul></td>
          <td><span class="admin-table__price">${this.formatPrice(order.total)}</span></td>
          <td>
            <select class="admin-order-status" data-order-status data-order-id="${order.id}" aria-label="Статус заказа ${order.id}">
              ${this.renderStatusOptions(order.status)}
            </select>
          </td>
        </tr>
      `;
    }).join('');
  }

  getFilteredCallbacks() {
    const status = this.elements.callbacksStatusFilter.value;
    return this.callbacks.filter((callback) => {
      const callbackStatus = callback.status === 'processed' ? 'processed' : 'new';
      return !status || callbackStatus === status;
    });
  }

  renderCallbacks() {
    const callbacks = this.getFilteredCallbacks();
    const total = this.callbacks.length;
    const filtered = callbacks.length;

    this.elements.callbacksCount.textContent = this.elements.callbacksStatusFilter.value
      ? `Показано: ${filtered} из ${total}`
      : `Всего заявок: ${total}`;

    if (!callbacks.length) {
      this.elements.callbacksBody.innerHTML = '<tr><td colspan="5"><p class="admin-empty">Заявки не найдены</p></td></tr>';
      return;
    }

    this.elements.callbacksBody.innerHTML = callbacks.map((callback) => {
      const isGuest = callback.userId === null || callback.userId === undefined || callback.userId === '';
      const user = isGuest ? null : this.users.find((item) => String(item.id) === String(callback.userId));
      const accountLabel = isGuest ? 'Гость' : 'Пользователь';
      const accountClass = isGuest ? 'admin-badge--guest' : 'admin-badge--user';
      const status = callback.status === 'processed' ? 'processed' : 'new';
      const userMeta = user
        ? [user.email, user.nickname].filter(Boolean).join(' · ')
        : (isGuest ? 'Без аккаунта' : `ID ${callback.userId}`);
      const objectType = String(callback.objectType || '').trim();
      const objectTypeCell = objectType
        ? `<span class="admin-badge admin-badge--object">${objectType}</span>`
        : '<span class="admin-table__muted">Не указан</span>';

      return `
        <tr>
          <td>
            <div class="admin-table__name">${callback.name}</div>
            <div class="admin-table__meta">${userMeta}</div>
            <div class="admin-table__badges">
              <span class="admin-badge ${accountClass}">${accountLabel}</span>
            </div>
          </td>
          <td><a class="admin-table__phone" href="tel:${String(callback.phone).replace(/[^\d+]/g, '')}">${callback.phone}</a></td>
          <td>${objectTypeCell}</td>
          <td>
            <select class="admin-callback-status admin-callback-status--${status}" data-callback-status data-callback-id="${callback.id}" aria-label="Статус заявки">
              ${this.renderCallbackStatusOptions(status)}
            </select>
          </td>
          <td class="admin-table__date">${this.formatDate(callback.createdAt)}</td>
        </tr>
      `;
    }).join('');
  }

  renderCallbackStatusOptions(currentStatus) {
    const statuses = [
      ['new', 'Новая'],
      ['processed', 'Обработана']
    ];

    return statuses.map(([value, label]) =>
      `<option value="${value}"${value === currentStatus ? ' selected' : ''}>${label}</option>`
    ).join('');
  }

  renderStatusOptions(currentStatus) {
    const statuses = [
      ['processing', 'В обработке'],
      ['shipped', 'Отправлен'],
      ['delivered', 'Доставлен'],
      ['cancelled', 'Отменён']
    ];

    return statuses.map(([value, label]) =>
      `<option value="${value}"${value === currentStatus ? ' selected' : ''}>${label}</option>`
    ).join('');
  }

  async updateOrderStatus(orderId, status, select) {
    const previousOrder = this.orders.find((order) => String(order.id) === String(orderId));

    if (!previousOrder || previousOrder.status === status) {
      return;
    }

    select.disabled = true;

    try {
      const updated = await api.updateOrder(orderId, { status });
      this.orders = this.orders.map((order) =>
        String(order.id) === String(orderId) ? { ...order, ...updated } : order
      );
      this.renderOrders();
      Modal.showSuccess(`Статус заказа #${orderId} изменён`, {
        title: 'Статус обновлён'
      });
    } catch (error) {
      select.value = previousOrder.status;
      Modal.showError(error.message || 'Не удалось изменить статус заказа', {
        title: 'Ошибка обновления'
      });
    } finally {
      select.disabled = false;
    }
  }

  async updateCallbackStatus(callbackId, status, select) {
    const previousCallback = this.callbacks.find((callback) => String(callback.id) === String(callbackId));
    const previousStatus = previousCallback?.status === 'processed' ? 'processed' : 'new';

    if (!previousCallback || previousStatus === status) {
      return;
    }

    select.disabled = true;

    try {
      const updated = await api.updateCallback(callbackId, { status });
      this.callbacks = this.callbacks.map((callback) =>
        String(callback.id) === String(callbackId) ? { ...callback, ...updated } : callback
      );
      this.renderCallbacks();
      Modal.showSuccess('Статус заявки изменён', {
        title: 'Статус обновлён'
      });
    } catch (error) {
      select.value = previousStatus;
      Modal.showError(error.message || 'Не удалось изменить статус заявки', {
        title: 'Ошибка обновления'
      });
    } finally {
      select.disabled = false;
    }
  }

  getFilteredProducts() {
    const query = this.elements.search.value.trim().toLowerCase();
    const category = this.elements.categoryFilter.value;

    return this.products.filter((product) => {
      const name = product.name_i18n?.ru || '';
      const matchesQuery = !query || name.toLowerCase().includes(query) || String(product.id).toLowerCase().includes(query);
      const matchesCategory = !category || product.category === category;
      return matchesQuery && matchesCategory;
    });
  }

  renderProducts() {
    const products = this.getFilteredProducts();

    if (!products.length) {
      this.elements.tableBody.innerHTML = '<tr><td colspan="5"><p class="admin-empty">Товары не найдены</p></td></tr>';
      return;
    }

    this.elements.tableBody.innerHTML = products.map((product) => {
      const name = product.name_i18n?.ru || product.id;
      const image = `../${product.images?.[0] || DEFAULT_IMAGES[0]}`;
      const stockClass = product.inStock ? '' : ' admin-table__stock--out';
      const stockText = product.inStock ? 'В наличии' : 'Нет в наличии';

      return `
        <tr>
          <td>
            <div class="admin-table__product">
              <img class="admin-table__image" src="${image}" alt="">
              <div>
                <div class="admin-table__name">${name}</div>
                <div class="admin-table__meta">${product.id}</div>
              </div>
            </div>
          </td>
          <td>
            <div>${CATEGORY_LABELS[product.category] || product.category}</div>
            <div class="admin-table__meta">${product.subcategory || '—'}</div>
          </td>
          <td>${this.formatPrice(product.price)}</td>
          <td><span class="admin-table__stock${stockClass}">${stockText}</span></td>
          <td>
            <div class="admin-table__actions">
              <button class="admin-button admin-button--ghost admin-button--small" type="button" data-action="edit" data-product-id="${product.id}">Изменить</button>
              <button class="admin-button admin-button--danger admin-button--small" type="button" data-action="delete" data-product-id="${product.id}">Удалить</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  bindStaticFieldValidation() {
    ['nameRu', 'nameBe', 'nameEn', 'category', 'subcategory', 'price', 'brand', 'model', 'specs'].forEach((name) => {
      const element = this.elements.form.elements[name];
      if (!element) {
        return;
      }

      const eventName = element.tagName === 'SELECT' ? 'change' : 'input';
      element.addEventListener(eventName, () => this.validateField(element));
      element.addEventListener('blur', () => this.validateField(element));
    });
  }

  fillSubcategories(category, selected = '') {
    const options = SUBCATEGORIES[category] || [];
    this.elements.subcategory.innerHTML = options.length
      ? `<option value="">Выберите подкатегорию</option>${options.map((item) => `<option value="${item.value}">${item.label}</option>`).join('')}`
      : '<option value="">Сначала выберите категорию</option>';

    if (selected) {
      this.elements.subcategory.value = selected;
    }
  }

  getCurrentAttrValues() {
    const values = {};
    this.elements.attrs?.querySelectorAll('[data-attr-field]').forEach((input) => {
      values[input.dataset.attrField] = input.value;
    });
    return values;
  }

  syncInstallTypeFromSubcategory() {
    const category = this.elements.form.elements.category.value;
    const subcategory = this.elements.form.elements.subcategory.value;

    if (category !== 'conditioning') {
      return;
    }

    const installType = INSTALL_TYPE_BY_SUBCATEGORY[subcategory];
    const installInput = this.elements.attrs?.querySelector('[data-attr-field="installType"]');

    if (installType && installInput) {
      installInput.value = installType;
    }
  }

  renderAttributeFields(presetValues = {}) {
    const category = this.elements.form.elements.category.value;
    const subcategory = this.elements.form.elements.subcategory.value;
    const fields = getAdminAttributeFields(category, subcategory);

    if (!this.elements.attrs || !this.elements.attrsEmpty) {
      return;
    }

    if (!fields.length) {
      this.elements.attrs.hidden = true;
      this.elements.attrs.innerHTML = '';
      this.elements.attrsEmpty.hidden = false;
      return;
    }

    this.elements.attrsEmpty.hidden = true;
    this.elements.attrs.hidden = false;
    this.elements.attrs.innerHTML = fields.map((field) => this.renderAttrFieldHtml(field, presetValues[field.field])).join('');

    if (category === 'conditioning' && !presetValues.installType) {
      this.syncInstallTypeFromSubcategory();
    }

    this.elements.attrs.querySelectorAll('[data-attr-field]').forEach((input) => {
      const eventName = input.tagName === 'SELECT' ? 'change' : 'input';
      input.addEventListener(eventName, () => {
        if (input.dataset.attrField === 'installType') {
          const nextSub = SUBCATEGORY_BY_INSTALL_TYPE[input.value];
          if (nextSub && this.elements.form.elements.category.value === 'conditioning') {
            this.elements.form.elements.subcategory.value = nextSub;
          }
        }
        this.validateField(input);
      });
      input.addEventListener('blur', () => this.validateField(input));
    });
  }

  renderAttrFieldHtml(field, rawValue) {
    const value = formatAttrValueForInput(field.field, rawValue);
    const error = `<span class="admin-form__error" data-error-for="${field.field}"></span>`;

    if (field.input === 'select') {
      const options = [
        '<option value="">Не выбрано</option>',
        ...field.options.map((option) => {
          const selected = String(option.value) === String(value) ? ' selected' : '';
          return `<option value="${option.value}"${selected}>${option.label}</option>`;
        })
      ].join('');

      return `
        <label class="admin-form__field">
          <span class="admin-form__label">${field.label}</span>
          <select class="admin-form__select" name="${field.field}" data-attr-field="${field.field}">
            ${options}
          </select>
          ${error}
        </label>
      `;
    }

    if (field.input === 'boolean') {
      return `
        <label class="admin-form__field">
          <span class="admin-form__label">${field.label}</span>
          <select class="admin-form__select" name="${field.field}" data-attr-field="${field.field}">
            <option value="">Не выбрано</option>
            <option value="true"${value === 'true' ? ' selected' : ''}>Да</option>
            <option value="false"${value === 'false' ? ' selected' : ''}>Нет</option>
          </select>
          ${error}
        </label>
      `;
    }

    if (field.input === 'number') {
      const min = field.min != null ? ` min="${field.min}"` : '';
      const max = field.max != null ? ` max="${field.max}"` : '';
      const step = field.step != null ? ` step="${field.step}"` : ' step="any"';

      return `
        <label class="admin-form__field">
          <span class="admin-form__label">${field.label}</span>
          <input class="admin-form__input" name="${field.field}" data-attr-field="${field.field}" type="number"${min}${max}${step} value="${value}">
          ${error}
        </label>
      `;
    }

    return `
      <label class="admin-form__field">
        <span class="admin-form__label">${field.label}</span>
        <input class="admin-form__input" name="${field.field}" data-attr-field="${field.field}" type="text" value="${value}">
        ${error}
      </label>
    `;
  }

  renderCurrentImages(product) {
    const images = Array.isArray(product?.images) ? product.images.filter(Boolean) : [];

    if (!this.elements.currentImages || !this.elements.currentImagesGrid) {
      return;
    }

    if (!images.length) {
      this.elements.currentImages.hidden = true;
      this.elements.currentImagesGrid.innerHTML = '';
      return;
    }

    this.elements.currentImages.hidden = false;
    this.elements.currentImagesGrid.innerHTML = images.map((src) => `
      <img class="admin-form__current-image" src="../${src.replace(/^\.\.\//, '')}" alt="">
    `).join('');
  }

  openProductModal(productId = null) {
    this.editingId = productId;
    this.elements.form.reset();
    this.imageUploader?.clear();
    this.clearErrors();
    this.renderCurrentImages(null);

    const product = productId ? this.products.find((item) => String(item.id) === String(productId)) : null;
    this.elements.modalTitle.textContent = product ? 'Редактировать товар' : 'Добавить товар';
    this.elements.submit.textContent = product ? 'Сохранить изменения' : 'Добавить товар';

    if (product) {
      this.elements.form.elements.id.value = product.id;
      this.elements.form.elements.nameRu.value = product.name_i18n?.ru || '';
      this.elements.form.elements.nameBe.value = product.name_i18n?.be || '';
      this.elements.form.elements.nameEn.value = product.name_i18n?.en || '';
      this.elements.form.elements.category.value = product.category || '';
      this.fillSubcategories(product.category, product.subcategory || '');
      this.elements.form.elements.price.value = product.price ?? '';
      this.elements.form.elements.brand.value = product.brand || product.details?.brand || '';
      this.elements.form.elements.model.value = product.details?.model || '';
      this.elements.form.elements.specs.value = Array.isArray(product.specs) ? product.specs.join('\n') : '';
      this.elements.form.elements.inStock.checked = Boolean(product.inStock);
      this.renderAttributeFields(product);
      this.renderCurrentImages(product);
    } else {
      this.elements.form.elements.id.value = '';
      this.fillSubcategories('');
      this.elements.form.elements.inStock.checked = true;
      this.renderAttributeFields();
    }

    this.elements.modal.hidden = false;
    document.documentElement.classList.add('is-modal-open');
    this.elements.form.elements.nameRu.focus({ preventScroll: true });
  }

  closeProductModal() {
    this.elements.modal.hidden = true;
    document.documentElement.classList.remove('is-modal-open');
    this.editingId = null;
    this.elements.form.reset();
    this.imageUploader?.clear();
    this.clearErrors();
    this.renderAttributeFields();
    this.renderCurrentImages(null);
  }

  clearErrors() {
    this.elements.form.querySelectorAll('.admin-form__field').forEach((field) => {
      field.classList.remove('admin-form__field--invalid');
    });
    this.elements.form.querySelectorAll('.admin-form__error, .image-uploader__error').forEach((error) => {
      error.textContent = '';
    });
  }

  setFieldError(name, message) {
    const field = this.elements.form.elements[name]?.closest('.admin-form__field')
      || this.elements.form.querySelector(`[data-error-for="${name}"]`)?.closest('.admin-form__field');
    const error = this.elements.form.querySelector(`[data-error-for="${name}"]`);

    if (field) {
      field.classList.toggle('admin-form__field--invalid', Boolean(message));
    }

    if (error) {
      error.textContent = message || '';
    }
  }

  validateField(input) {
    if (!input?.name) {
      return true;
    }

    const rawValue = input.value ?? '';
    const value = input.type === 'number' ? String(rawValue) : String(rawValue).trim();
    let message = '';

    switch (input.name) {
      case 'nameRu':
        if (value.length < 3) {
          message = 'Введите название (минимум 3 символа)';
        }
        break;
      case 'category':
      case 'subcategory':
        if (!value) {
          message = 'Обязательное поле';
        }
        break;
      case 'price':
        if (!value || Number(value) <= 0) {
          message = 'Укажите цену больше 0';
        }
        break;
      case 'specs':
        if (!value || !value.split('\n').some((line) => line.trim())) {
          message = 'Добавьте хотя бы одну характеристику';
        }
        break;
      default:
        if (
          input.type === 'number'
          && value !== ''
          && Number(value) < 0
          && input.name !== 'heatingTemp'
          && input.name !== 'winterTemp'
        ) {
          message = 'Значение не может быть отрицательным';
        }
        break;
    }

    this.setFieldError(input.name, message);
    return !message;
  }

  validateImages() {
    const selectedFiles = this.imageUploader?.getSelectedFiles() || [];
    const existing = this.editingId
      ? this.products.find((item) => String(item.id) === String(this.editingId))
      : null;
    const hasExistingImages = Array.isArray(existing?.images) && existing.images.length > 0;

    if (!this.editingId && !selectedFiles.length) {
      this.setFieldError('images', 'Добавьте хотя бы одно изображение');
      return false;
    }

    if (this.editingId && !selectedFiles.length && !hasExistingImages) {
      this.setFieldError('images', 'Добавьте хотя бы одно изображение');
      return false;
    }

    this.setFieldError('images', '');
    return true;
  }

  validateForm() {
    const baseFields = ['nameRu', 'category', 'subcategory', 'price', 'specs'];
    const attrFields = [...(this.elements.attrs?.querySelectorAll('[data-attr-field]') || [])];
    const fieldsValid = baseFields.every((name) => this.validateField(this.elements.form.elements[name]));
    const attrsValid = attrFields.every((input) => this.validateField(input));
    const imagesValid = this.validateImages();
    const isValid = fieldsValid && attrsValid && imagesValid;

    if (!isValid) {
      const invalid = this.elements.form.querySelector('.admin-form__field--invalid, .image-uploader__error:not(:empty)');
      invalid?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }

    return isValid;
  }

  collectAttributePayload() {
    const payload = {};

    this.elements.attrs?.querySelectorAll('[data-attr-field]').forEach((input) => {
      const field = input.dataset.attrField;
      payload[field] = coerceAttrValue(field, input.value);
    });

    return payload;
  }

  buildProductPayload() {
    const form = this.elements.form;
    const nameRu = form.elements.nameRu.value.trim();
    const nameBe = form.elements.nameBe.value.trim() || nameRu;
    const nameEn = form.elements.nameEn.value.trim() || nameRu;
    const specs = form.elements.specs.value
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    const brand = form.elements.brand.value.trim();
    const model = form.elements.model.value.trim();
    const category = form.elements.category.value;
    const subcategory = form.elements.subcategory.value;
    const existing = this.editingId
      ? this.products.find((item) => String(item.id) === String(this.editingId))
      : null;
    const selectedFiles = this.imageUploader?.getSelectedFiles() || [];
    const attrs = this.collectAttributePayload();

    if (category === 'conditioning') {
      const installFromSub = INSTALL_TYPE_BY_SUBCATEGORY[subcategory];
      if (installFromSub && (attrs.installType == null || attrs.installType === '')) {
        attrs.installType = installFromSub;
      }
    }

    const payload = {
      name_i18n: { ru: nameRu, be: nameBe, en: nameEn },
      category,
      subcategory,
      price: Number(form.elements.price.value),
      specs,
      inStock: form.elements.inStock.checked,
      brand: brand || attrs.brand || existing?.brand || '',
      ...attrs,
      details: {
        ...(existing?.details || {}),
        brand: brand || attrs.brand || existing?.details?.brand || '',
        model: model || existing?.details?.model || ''
      }
    };

    if (!selectedFiles.length) {
      payload.images = existing?.images?.length ? [...existing.images] : [...DEFAULT_IMAGES];
    }

    if (!this.editingId) {
      payload.id = this.generateProductId();
    } else {
      payload.id = Number(this.editingId) || this.editingId;
    }

    return payload;
  }

  generateProductId() {
    const maxId = this.products.reduce((max, product) => {
      const id = Number(product.id);
      return Number.isFinite(id) ? Math.max(max, id) : max;
    }, 0);

    return maxId + 1;
  }

  async handleSubmit(event) {
    event.preventDefault();

    if (!this.validateForm()) {
      Modal.showError('Заполните обязательные поля корректно', {
        title: 'Проверьте форму'
      });
      return;
    }

    let payload;
    const selectedFiles = this.imageUploader?.getSelectedFiles() || [];

    try {
      payload = this.buildProductPayload();
    } catch (error) {
      Modal.showError(error.message || 'Не удалось собрать данные товара', {
        title: 'Ошибка формы'
      });
      return;
    }

    this.elements.submit.disabled = true;

    try {
      if (this.editingId && !selectedFiles.length) {
        await api.updateProduct(this.editingId, payload);
        Modal.showSuccess('Изменения успешно сохранены', {
          title: 'Товар обновлён'
        });
      } else {
        await api.createProductWithImages(payload, selectedFiles);
        Modal.showSuccess(this.editingId
            ? 'Изменения и изображения успешно сохранены'
            : 'Новый товар появился в каталоге', {
          title: this.editingId ? 'Товар обновлён' : 'Товар добавлен'
        });
      }

      this.closeProductModal();
      await this.loadProducts();
    } catch (error) {
      Modal.showError(error.message || 'Не удалось сохранить товар', {
        title: 'Ошибка сохранения'
      });
    } finally {
      this.elements.submit.disabled = false;
    }
  }

  async handleDelete(productId) {
    const product = this.products.find((item) => String(item.id) === String(productId));
    const name = product?.name_i18n?.ru || productId;
    const confirmed = await showConfirm(`Удалить товар «${name}»?`, {
      title: 'Удаление товара',
      confirmLabel: 'Удалить',
      cancelLabel: 'Отмена',
      type: 'error'
    });

    if (!confirmed) {
      return;
    }

    try {
      await api.deleteProduct(productId);
      await this.loadProducts();
      Modal.showSuccess(`«${name}» удалён из каталога`, {
        title: 'Товар удалён'
      });
    } catch (error) {
      Modal.showError(error.message || 'Не удалось удалить товар', {
        title: 'Ошибка удаления'
      });
    }
  }

  formatPrice(price) {
    return `${new Intl.NumberFormat('ru-RU').format(price || 0)}\u00A0<span class="currency-icon" aria-hidden="true"></span>`;
  }
}

new AdminPage().init();
