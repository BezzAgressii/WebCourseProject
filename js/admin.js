import api from './api.js';
import { getCurrentUser, requireAdmin, setCurrentUser, resolveAssetPath } from './auth-session.js';
import { openModal } from './components/modal.js';
import { showConfirm } from './components/confirm.js';
import ImageUploader from './loadImages.js';

const SUBCATEGORIES = {
  ventilation: [
    { value: 'supply-exhaust', label: 'Приточно-вытяжные установки' },
    { value: 'high-filtration', label: 'Системы высокой фильтрации' },
    { value: 'humidifiers', label: 'Увлажнители' }
  ],
  conditioning: [
    { value: 'nastennye', label: 'Настенные' },
    { value: 'kanalnye', label: 'Канальные' },
    { value: 'all', label: 'Все типы' }
  ],
  pools: [
    { value: 'osushiteli', label: 'Осушители' }
  ]
};

const CATEGORY_LABELS = {
  ventilation: 'Вентиляция',
  conditioning: 'Кондиционирование',
  pools: 'Бассейны'
};

const DEFAULT_IMAGES = [
  'assets/images/services-photo-741206.png',
  'assets/images/portfolio-photo-1.png',
  'assets/images/benefits-photo-1-6a89c7.png'
];

class AdminPage {
  constructor() {
    this.products = [];
    this.editingId = null;
    this.imageUploader = null;
    this.elements = {
      userName: document.getElementById('admin-user-name'),
      logout: document.getElementById('admin-logout'),
      addButton: document.getElementById('admin-add-product'),
      search: document.getElementById('admin-search'),
      categoryFilter: document.getElementById('admin-category-filter'),
      tableBody: document.getElementById('admin-products-body'),
      modal: document.getElementById('product-modal'),
      modalTitle: document.getElementById('product-modal-title'),
      form: document.getElementById('product-form'),
      submit: document.getElementById('product-form-submit'),
      subcategory: document.querySelector('[name="subcategory"]')
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

    this.elements.modal.querySelectorAll('[data-close-modal]').forEach((element) => {
      element.addEventListener('click', () => this.closeProductModal());
    });

    this.elements.form.elements.category.addEventListener('change', () => {
      this.fillSubcategories(this.elements.form.elements.category.value);
      this.validateField(this.elements.form.elements.category);
      this.validateField(this.elements.form.elements.subcategory);
    });

    [...this.elements.form.elements].forEach((element) => {
      if (!element.name || element.type === 'hidden' || element.type === 'checkbox') {
        return;
      }

      const eventName = element.tagName === 'SELECT' ? 'change' : 'input';
      element.addEventListener(eventName, () => this.validateField(element));
      element.addEventListener('blur', () => this.validateField(element));
    });

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
      this.elements.tableBody.innerHTML = `<tr><td colspan="5"><p class="admin-empty">${this.escapeHtml(error.message)}</p></td></tr>`;
    }
  }

  getFilteredProducts() {
    const query = this.elements.search.value.trim().toLowerCase();
    const category = this.elements.categoryFilter.value;

    return this.products.filter((product) => {
      const name = product.name_i18n?.ru || '';
      const matchesQuery = !query || name.toLowerCase().includes(query) || product.id.toLowerCase().includes(query);
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
      const image = resolveAssetPath(product.images?.[0] || DEFAULT_IMAGES[0]);
      const stockClass = product.inStock ? '' : ' admin-table__stock--out';
      const stockText = product.inStock ? 'В наличии' : 'Нет в наличии';

      return `
        <tr>
          <td>
            <div class="admin-table__product">
              <img class="admin-table__image" src="${this.escapeHtml(image)}" alt="">
              <div>
                <div class="admin-table__name">${this.escapeHtml(name)}</div>
                <div class="admin-table__meta">${this.escapeHtml(product.id)}</div>
              </div>
            </div>
          </td>
          <td>
            <div>${this.escapeHtml(CATEGORY_LABELS[product.category] || product.category)}</div>
            <div class="admin-table__meta">${this.escapeHtml(product.subcategory || '—')}</div>
          </td>
          <td>${this.formatPrice(product.price)}</td>
          <td><span class="admin-table__stock${stockClass}">${stockText}</span></td>
          <td>
            <div class="admin-table__actions">
              <button class="admin-button admin-button--ghost admin-button--small" type="button" data-action="edit" data-product-id="${this.escapeHtml(product.id)}">Изменить</button>
              <button class="admin-button admin-button--danger admin-button--small" type="button" data-action="delete" data-product-id="${this.escapeHtml(product.id)}">Удалить</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
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

  openProductModal(productId = null) {
    this.editingId = productId;
    this.elements.form.reset();
    this.imageUploader?.clear();
    this.clearErrors();

    const product = productId ? this.products.find((item) => item.id === productId) : null;
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
      this.elements.form.elements.performance.value = product.performance ?? '';
      this.elements.form.elements.area.value = product.area ?? '';
      this.elements.form.elements.maxPower.value = product.maxPower ?? '';
      this.elements.form.elements.brand.value = product.brand || product.details?.brand || '';
      this.elements.form.elements.model.value = product.details?.model || '';
      this.elements.form.elements.specs.value = Array.isArray(product.specs) ? product.specs.join('\n') : '';
      this.elements.form.elements.inStock.checked = Boolean(product.inStock);
    } else {
      this.elements.form.elements.id.value = '';
      this.fillSubcategories('');
      this.elements.form.elements.inStock.checked = true;
    }

    this.elements.modal.hidden = false;
    document.body.style.overflow = 'hidden';
    this.elements.form.elements.nameRu.focus();
  }

  closeProductModal() {
    this.elements.modal.hidden = true;
    document.body.style.overflow = '';
    this.editingId = null;
    this.elements.form.reset();
    this.imageUploader?.clear();
    this.clearErrors();
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

    const value = input.type === 'number' ? input.value : input.value.trim();
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
      case 'performance':
      case 'area':
      case 'maxPower':
        if (value !== '' && Number(value) < 0) {
          message = 'Значение не может быть отрицательным';
        }
        break;
      case 'specs':
        if (!value || !value.split('\n').some((line) => line.trim())) {
          message = 'Добавьте хотя бы одну характеристику';
        }
        break;
      default:
        break;
    }

    this.setFieldError(input.name, message);
    return !message;
  }

  validateImages() {
    const selectedFiles = this.imageUploader?.getSelectedFiles() || [];
    const existing = this.editingId
      ? this.products.find((item) => item.id === this.editingId)
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
    const fields = ['nameRu', 'category', 'subcategory', 'price', 'specs', 'performance', 'area', 'maxPower'];
    const fieldsValid = fields.every((name) => this.validateField(this.elements.form.elements[name]));
    const imagesValid = this.validateImages();
    return fieldsValid && imagesValid;
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
    const existing = this.editingId ? this.products.find((item) => item.id === this.editingId) : null;
    const selectedFiles = this.imageUploader?.getSelectedFiles() || [];

    const payload = {
      name_i18n: { ru: nameRu, be: nameBe, en: nameEn },
      category,
      subcategory: form.elements.subcategory.value,
      price: Number(form.elements.price.value),
      specs,
      performance: form.elements.performance.value === '' ? null : Number(form.elements.performance.value),
      area: form.elements.area.value === '' ? null : Number(form.elements.area.value),
      maxPower: form.elements.maxPower.value === '' ? null : Number(form.elements.maxPower.value),
      inStock: form.elements.inStock.checked,
      brand: brand || existing?.brand || undefined,
      details: {
        ...(existing?.details || {}),
        brand: brand || existing?.details?.brand || '',
        model: model || existing?.details?.model || ''
      }
    };

    if (!selectedFiles.length) {
      payload.images = existing?.images?.length ? [...existing.images] : [...DEFAULT_IMAGES];
    }

    if (!this.editingId) {
      payload.id = this.generateProductId(category);
      payload.equipmentType = this.defaultEquipmentType(category);
      payload.winterTemp = null;
      payload.heaterType = null;
      payload.recuperatorType = null;
      payload.powerType = '220';
      payload.bodyMaterial = 'galvanized-steel';
    } else {
      payload.id = this.editingId;
    }

    return payload;
  }

  defaultEquipmentType(category) {
    if (category === 'conditioning') {
      return 'wall-mounted';
    }

    if (category === 'pools') {
      return 'dehumidifier';
    }

    return 'compact';
  }

  generateProductId(category) {
    const prefix = {
      ventilation: 'pv-vent',
      conditioning: 'pv-cond',
      pools: 'pv-pool'
    }[category] || 'pv-item';

    return `${prefix}-${Date.now().toString().slice(-6)}`;
  }

  async handleSubmit(event) {
    event.preventDefault();

    if (!this.validateForm()) {
      openModal({
        title: 'Проверьте форму',
        message: 'Заполните обязательные поля корректно',
        type: 'error'
      });
      return;
    }

    const payload = this.buildProductPayload();
    const selectedFiles = this.imageUploader?.getSelectedFiles() || [];
    this.elements.submit.disabled = true;

    try {
      if (this.editingId && !selectedFiles.length) {
        await api.updateProduct(this.editingId, payload);
        openModal({
          title: 'Товар обновлён',
          message: 'Изменения успешно сохранены',
          type: 'success'
        });
      } else {
        await api.createProductWithImages(payload, selectedFiles);
        openModal({
          title: this.editingId ? 'Товар обновлён' : 'Товар добавлен',
          message: this.editingId
            ? 'Изменения и изображения успешно сохранены'
            : 'Новый товар появился в каталоге',
          type: 'success'
        });
      }

      this.closeProductModal();
      await this.loadProducts();
    } catch (error) {
      openModal({
        title: 'Ошибка сохранения',
        message: error.message || 'Не удалось сохранить товар',
        type: 'error'
      });
    } finally {
      this.elements.submit.disabled = false;
    }
  }

  async handleDelete(productId) {
    const product = this.products.find((item) => item.id === productId);
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
      openModal({
        title: 'Товар удалён',
        message: `«${name}» удалён из каталога`,
        type: 'success'
      });
    } catch (error) {
      openModal({
        title: 'Ошибка удаления',
        message: error.message || 'Не удалось удалить товар',
        type: 'error'
      });
    }
  }

  formatPrice(price) {
    return `${new Intl.NumberFormat('ru-RU').format(price || 0)} ₽`;
  }

  escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;');
  }
}

new AdminPage().init();
