import api from './api.js';
import FILTER_CONFIG from './filter-config.js';
import i18n from './i18n.js';
import { isAdmin, isAuthenticated, resolveAssetPath } from './auth-session.js';
import { addToCart } from './cart-storage.js';
import { showConfirm } from './components/confirm.js';
import { Modal } from './components/modal.js';
import { createHoverCarousel } from './components/slider.js';

class CategoryPage {
  constructor() {
    this.category = 'ventilation';
    this.subcategory = '';
    this.categoryKey = '';
    this.products = [];
    this.sortCriteria = 'popular';
    this.currentPage = 1;
    this.productsPerPage = 6;
    this.elements = {
      breadcrumb: document.getElementById('breadcrumb-current'),
      title: document.getElementById('page-title'),
      form: document.getElementById('filters-form'),
      search: document.getElementById('search-input'),
      generatedFilters: document.getElementById('generated-filters'),
      reset: document.getElementById('reset-filters'),
      sort: document.getElementById('sort-select'),
      count: document.getElementById('products-count'),
      grid: document.getElementById('products-grid'),
      pagination: document.getElementById('pagination')
    };
  }

  async init() {
    await i18n.init();
    this.readUrlParameters();
    await this.loadProducts();
    this.renderPage();
    this.bindEvents();

    document.addEventListener('languageChanged', () => {
      this.renderPage();
    });
  }

  readUrlParameters() {
    const params = new URLSearchParams(window.location.search);
    const category = params.get('category');
    const allowedCategories = ['ventilation', 'conditioning', 'pools'];
    const defaultSubcategories = {
      ventilation: 'supply-exhaust',
      conditioning: 'all',
      pools: 'osushiteli'
    };

    this.category = allowedCategories.includes(category) ? category : 'ventilation';
    this.subcategory = params.get('subcategory') || defaultSubcategories[this.category];
    this.categoryKey = `${this.category}_${this.subcategory}`;

    if (!FILTER_CONFIG[this.categoryKey]) {
      this.categoryKey = `${this.category}_${defaultSubcategories[this.category]}`;
    }
  }

  async loadProducts() {
    try {
      this.products = await api.getProducts({ category: this.category });
    } catch (error) {
      console.error('Unable to load products:', error);
      this.products = [];
    }
  }

  renderPage() {
    const title = i18n.t(`catalog.${this.category}`);

    this.elements.title.textContent = title;
    this.elements.breadcrumb.textContent = title;
    document.title = `${title} — Pascal Vent`;
    this.renderFilters(this.categoryKey);
    this.applyFilters();
    i18n.translatePage();
  }

  renderFilters(categoryKey) {
    const filters = FILTER_CONFIG[categoryKey] || [];

    this.elements.generatedFilters.innerHTML = filters
      .map((filter) => this.renderFilter(filter))
      .join('');
  }

  renderFilter(filter) {
    if (filter.type === 'range') {
      return `
        <fieldset class="category-page__filter-group" data-filter="${filter.field}">
          <legend class="category-page__label" data-i18n="${filter.labelKey}">${i18n.t(filter.labelKey)}</legend>
          <div class="category-page__price">
            <input class="category-page__input" type="number" min="${filter.min}" max="${filter.max}" step="${filter.step}" data-filter-min="${filter.field}" data-i18n-placeholder="common.from" placeholder="${i18n.t('common.from')}">
            <input class="category-page__input" type="number" min="${filter.min}" max="${filter.max}" step="${filter.step}" data-filter-max="${filter.field}" data-i18n-placeholder="common.to" placeholder="${i18n.t('common.to')}">
          </div>
          <div class="category-page__range">
            <input class="category-page__range-input" type="range" min="${filter.min}" max="${filter.max}" step="${filter.step}" value="${filter.min}" data-filter-range-min="${filter.field}">
            <input class="category-page__range-input" type="range" min="${filter.min}" max="${filter.max}" step="${filter.step}" value="${filter.max}" data-filter-range-max="${filter.field}">
          </div>
        </fieldset>
      `;
    }

    if (filter.type === 'boolean') {
      return `
        <label class="category-page__check category-page__stock-filter">
          <input type="checkbox" data-filter-boolean="${filter.field}">
          <span data-i18n="${filter.labelKey}">${i18n.t(filter.labelKey)}</span>
        </label>
      `;
    }

    const modifier = filter.style ? ` category-page__checkboxes--${filter.style}` : '';
    const options = filter.options.map((option) => {
      const label = option.labelKey ? i18n.t(option.labelKey) : option.label;
      const labelAttribute = option.labelKey ? ` data-i18n="${option.labelKey}"` : '';
      const pillClass = filter.style === 'pills' ? ' category-page__check--pill' : '';

      return `
        <label class="category-page__check${pillClass}">
          <input type="${filter.type}" name="${filter.field}" value="${option.value}">
          <span${labelAttribute}>${label}</span>
        </label>
      `;
    }).join('');

    return `
      <fieldset class="category-page__filter-group" data-filter="${filter.field}">
        <legend class="category-page__label" data-i18n="${filter.labelKey}">${i18n.t(filter.labelKey)}</legend>
        <div class="category-page__checkboxes${modifier}">${options}</div>
      </fieldset>
    `;
  }

  applyFilters(resetPage = true) {
    const query = this.elements.search.value.trim();
    const filters = FILTER_CONFIG[this.categoryKey] || [];
    const filteredProducts = filters.reduce((products, filter) => {
      return products.filter((product) => this.matchesFilter(product, filter));
    }, this.searchProducts(query));

    if (resetPage) {
      this.currentPage = 1;
    }

    this.filteredProducts = this.sortProducts(filteredProducts, this.sortCriteria);
    this.renderProducts(this.filteredProducts);
  }

  matchesFilter(product, filter) {
    if (filter.type === 'range') {
      const min = this.toNumber(this.elements.generatedFilters.querySelector(`[data-filter-min="${filter.field}"]`).value);
      const max = this.toNumber(this.elements.generatedFilters.querySelector(`[data-filter-max="${filter.field}"]`).value);
      const value = Number(product[filter.field]);

      return (min === null || value >= min) && (max === null || value <= max);
    }

    if (filter.type === 'boolean') {
      const checkbox = this.elements.generatedFilters.querySelector(`[data-filter-boolean="${filter.field}"]`);

      return !checkbox.checked || Boolean(product[filter.field]);
    }

    const selectedValues = [...this.elements.generatedFilters.querySelectorAll(`input[name="${filter.field}"]:checked`)]
      .map((input) => input.value);

    if (!selectedValues.length || selectedValues.length === filter.options.length) {
      return true;
    }

    return selectedValues.includes(String(product[filter.field]));
  }

  searchProducts(query) {
    const normalizedQuery = query.toLocaleLowerCase(i18n.currentLang);

    return this.products.filter((product) => {
      const name = product.name_i18n[i18n.currentLang] || product.name_i18n.ru;

      return !normalizedQuery || name.toLocaleLowerCase(i18n.currentLang).includes(normalizedQuery);
    });
  }

  sortProducts(products, criteria) {
    const sortedProducts = [...products];

    if (criteria === 'price-asc') {
      return sortedProducts.sort((left, right) => left.price - right.price);
    }

    if (criteria === 'price-desc') {
      return sortedProducts.sort((left, right) => right.price - left.price);
    }

    if (criteria === 'name') {
      return sortedProducts.sort((left, right) => {
        const leftName = left.name_i18n[i18n.currentLang] || left.name_i18n.ru;
        const rightName = right.name_i18n[i18n.currentLang] || right.name_i18n.ru;

        return leftName.localeCompare(rightName, i18n.currentLang);
      });
    }

    return sortedProducts;
  }

  renderProducts(filteredProducts) {
    this.elements.count.textContent = `${i18n.t('catalog.found')}: ${filteredProducts.length} ${i18n.t('catalog.products.count')}`;
    const pageCount = Math.ceil(filteredProducts.length / this.productsPerPage);

    if (this.currentPage > pageCount) {
      this.currentPage = Math.max(pageCount, 1);
    }

    const firstProduct = (this.currentPage - 1) * this.productsPerPage;
    const pageProducts = filteredProducts.slice(firstProduct, firstProduct + this.productsPerPage);

    this.elements.grid.innerHTML = filteredProducts.length
      ? pageProducts.map((product) => this.renderProductCard(product)).join('')
      : `<p class="category-page__empty">${this.escapeHtml(i18n.t('category.empty'))}</p>`;

    pageProducts.forEach((product) => {
      const image = this.elements.grid.querySelector(`[data-product-image="${product.id}"]`);
      createHoverCarousel(image, (product.images || []).map(resolveAssetPath));
    });

    this.renderPagination(pageCount);
  }

  renderPagination(pageCount) {
    if (pageCount <= 1) {
      this.elements.pagination.innerHTML = '';
      return;
    }

    this.elements.pagination.innerHTML = Array.from({ length: pageCount }, (_, index) => {
      const page = index + 1;
      const activeClass = page === this.currentPage ? ' category-page__pagination-button--active' : '';

      return `<button class="category-page__pagination-button${activeClass}" type="button" data-page="${page}" aria-current="${page === this.currentPage ? 'page' : 'false'}">${page}</button>`;
    }).join('');
  }

  renderProductCard(product) {
    const name = product.name_i18n[i18n.currentLang] || product.name_i18n.ru;
    const image = resolveAssetPath(product.images[0]);
    const stockKey = product.inStock ? 'catalog.inStock' : 'catalog.outOfStock';
    const stockClass = product.inStock ? '' : ' product-card__stock--out';
    const details = this.getProductDetails(product);
    const detailUrl = `product.html?id=${encodeURIComponent(product.id)}`;
    const cartButton = isAdmin()
      ? ''
      : `<button class="product-card__cart" type="button" data-action="add-to-cart" data-product-id="${this.escapeHtml(product.id)}" aria-label="${this.escapeHtml(i18n.t('category.addToCart'))}" title="${this.escapeHtml(i18n.t('category.addToCart'))}">🛒</button>`;

    return `
      <article class="product-card">
        <div class="product-card__image-wrap">
          <img class="product-card__image" data-product-image="${this.escapeHtml(product.id)}" src="${this.escapeHtml(image)}" alt="${this.escapeHtml(name)}" loading="lazy">
          <span class="product-card__stock${stockClass}">${this.escapeHtml(i18n.t(stockKey))}</span>
        </div>
        <div class="product-card__body">
          <h2 class="product-card__title">${this.escapeHtml(name)}</h2>
          <ul class="product-card__specs">${details}</ul>
          <p class="product-card__price">${this.formatPrice(product.price)}</p>
          <div class="product-card__actions">
            ${cartButton}
            <a class="product-card__more" href="${detailUrl}">${this.escapeHtml(i18n.t('catalog.more'))}</a>
          </div>
        </div>
      </article>
    `;
  }

  getProductDetails(product) {
    if (this.category === 'conditioning') {
      return [
        `<li><strong>${this.escapeHtml(i18n.t('category.brand'))}:</strong> ${this.escapeHtml(product.brand)}</li>`,
        `<li><strong>${this.escapeHtml(i18n.t('category.coolingPower'))}:</strong> ${this.escapeHtml(product.coolingPower)} кВт</li>`,
        `<li><strong>${this.escapeHtml(i18n.t('category.area'))}:</strong> ${this.escapeHtml(product.area)} м²</li>`
      ].join('');
    }

    if (this.category === 'pools') {
      return [
        `<li><strong>${this.escapeHtml(i18n.t('category.brand'))}:</strong> ${this.escapeHtml(product.brand)}</li>`,
        `<li><strong>${this.escapeHtml(i18n.t('category.moistureRemoval'))}:</strong> ${this.escapeHtml(product.moistureRemoval)} л/сутки</li>`,
        `<li><strong>${this.escapeHtml(i18n.t('category.mountType'))}:</strong> ${this.escapeHtml(i18n.t(`category.mount.${product.mountType}`))}</li>`
      ].join('');
    }

    return product.specs.map((spec) => `<li>${this.escapeHtml(spec)}</li>`).join('');
  }

  bindEvents() {
    let searchTimer;

    this.elements.search.addEventListener('input', () => {
      window.clearTimeout(searchTimer);
      searchTimer = window.setTimeout(() => this.applyFilters(), 250);
    });

    this.elements.form.addEventListener('submit', (event) => {
      event.preventDefault();
      this.applyFilters();
    });

    this.elements.generatedFilters.addEventListener('input', (event) => {
      this.syncRangeInputs(event.target);
      this.applyFilters();
    });

    this.elements.generatedFilters.addEventListener('change', () => this.applyFilters());

    this.elements.reset.addEventListener('click', () => {
      this.elements.form.reset();
      this.resetRangeInputs();
      this.applyFilters();
    });

    this.elements.sort.addEventListener('change', () => {
      this.sortCriteria = this.elements.sort.value;
      this.applyFilters();
    });

    this.elements.grid.addEventListener('click', (event) => {
      const cartButton = event.target.closest('[data-action="add-to-cart"]');

      if (!cartButton) {
        return;
      }

      if (isAdmin()) {
        Modal.showError(i18n.t('auth.adminForbiddenMessage'), {
          title: i18n.t('auth.adminForbiddenTitle'),
          closeLabel: i18n.t('common.close')
        });
        return;
      }

      if (!isAuthenticated()) {
        Modal.showError(i18n.t('auth.cartLoginMessage'), {
          title: i18n.t('auth.cartLoginTitle'),
          actionHref: 'login.html',
          actionLabel: i18n.t('auth.login.submit'),
          closeLabel: i18n.t('auth.cartLoginClose')
        });
        return;
      }

      showConfirm(i18n.t('category.addToCartConfirm'), {
        title: i18n.t('category.addToCart'),
        confirmLabel: i18n.t('common.confirm'),
        cancelLabel: i18n.t('common.cancel')
      }).then(async (confirmed) => {
        if (!confirmed) {
          return;
        }

        try {
          await addToCart(cartButton.dataset.productId, 1);
          Modal.showSuccess(i18n.t('category.addedMessage'), {
            title: i18n.t('category.addedTitle'),
            actionHref: 'cart.html',
            actionLabel: i18n.t('header.cart'),
            closeLabel: i18n.t('common.close')
          });
        } catch (error) {
          Modal.showError(error.message || i18n.t('cart.orderErrorMessage'), {
            title: i18n.t('common.error'),
            closeLabel: i18n.t('common.close')
          });
        }
      });
    });

    this.elements.pagination.addEventListener('click', (event) => {
      const button = event.target.closest('[data-page]');

      if (!button) {
        return;
      }

      this.currentPage = Number(button.dataset.page);
      this.applyFilters(false);
      window.scrollTo({
        top: this.elements.grid.getBoundingClientRect().top + window.scrollY - 90,
        behavior: 'smooth'
      });
    });
  }

  syncRangeInputs(input) {
    const attribute = [...input.attributes].find((item) => item.name.startsWith('data-filter-range-'));

    if (!attribute) {
      return;
    }

    const field = attribute.value;
    const isMin = attribute.name === 'data-filter-range-min';
    const numberInput = this.elements.generatedFilters.querySelector(isMin
      ? `[data-filter-min="${field}"]`
      : `[data-filter-max="${field}"]`);

    numberInput.value = input.value;

    const minRange = this.elements.generatedFilters.querySelector(`[data-filter-range-min="${field}"]`);
    const maxRange = this.elements.generatedFilters.querySelector(`[data-filter-range-max="${field}"]`);

    if (Number(minRange.value) > Number(maxRange.value)) {
      if (isMin) {
        maxRange.value = minRange.value;
        this.elements.generatedFilters.querySelector(`[data-filter-max="${field}"]`).value = minRange.value;
      } else {
        minRange.value = maxRange.value;
        this.elements.generatedFilters.querySelector(`[data-filter-min="${field}"]`).value = maxRange.value;
      }
    }
  }

  resetRangeInputs() {
    this.elements.generatedFilters.querySelectorAll('[data-filter-range-min]').forEach((input) => {
      input.value = input.min;
    });
    this.elements.generatedFilters.querySelectorAll('[data-filter-range-max]').forEach((input) => {
      input.value = input.max;
    });
  }

  formatPrice(price) {
    return `${new Intl.NumberFormat(i18n.currentLang).format(price)} ${i18n.t('common.currency')}`;
  }

  toNumber(value) {
    const parsed = Number(value);

    return value !== '' && Number.isFinite(parsed) ? parsed : null;
  }

  escapeHtml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }
}

new CategoryPage().init();
