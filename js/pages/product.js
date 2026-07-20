import api from '../utils/api.js';
import DETAILED_TRANSLATIONS from '../utils/detailed-translation.js';
import i18n from '../common/i18n.js';
import { isAdmin } from '../utils/auth-session.js';
import { Modal } from '../components/modal.js';
import { createImageSlider } from '../components/slider.js';
import { initSpecTooltips, renderSpecTooltipTrigger } from '../components/spec-tooltip.js';

const SUPPORTED_CATEGORIES = new Set(['ventilation', 'conditioning', 'pools']);

class ProductPage {
  constructor() {
    this.product = null;
    this.refs = null;
    this.elements = {
      content: document.getElementById('product-content')
    };
  }

  async init() {
    await i18n.init();
    initSpecTooltips(this.elements.content);
    await this.loadProduct();
    this.render();

    document.addEventListener('languageChanged', () => {
      this.render();
    });
  }

  async loadProduct() {
    const id = new URLSearchParams(window.location.search).get('id');

    if (!id) {
      return;
    }

    try {
      this.product = await api.getProductById(id);
    } catch (error) {
      console.error('Unable to load product:', error);
      this.product = null;
    }
  }

  render() {
    if (!this.product || !SUPPORTED_CATEGORIES.has(this.product.category)) {
      this.refs = null;
      this.elements.content.replaceChildren();
      const empty = document.createElement('p');
      empty.className = 'product-page__empty';
      empty.textContent = this.t('unavailable');
      this.elements.content.append(empty);
      return;
    }

    this.product.details = this.product.details || {};
    this.mountShell();
    this.renderHeader();
    this.renderMainInfo();
    this.renderDetails();
    this.initGallery(this.getProductName());
    this.bindOrderButton();
  }

  mountShell() {
    this.elements.content.innerHTML = `
      <nav class="category-page__breadcrumbs" data-i18n-aria="category.breadcrumbsAria" aria-label="Хлебные крошки">
        <ol class="category-page__breadcrumb-list">
          <li class="category-page__breadcrumb-item">
            <a class="category-page__breadcrumb-link" href="../index.html">
              <svg class="category-page__breadcrumb-home" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5.5v-6h-3v6H5a1 1 0 0 1-1-1v-9.5Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
              </svg>
              <span data-i18n="category.home">Главная</span>
            </a>
          </li>
          <li class="category-page__breadcrumb-item">
            <svg class="category-page__breadcrumb-sep" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <a class="category-page__breadcrumb-link" href="catalog.html" data-i18n="header.catalog">Каталог</a>
          </li>
          <li class="category-page__breadcrumb-item">
            <svg class="category-page__breadcrumb-sep" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <a class="category-page__breadcrumb-link" href="#" data-product-category-link></a>
          </li>
          <li class="category-page__breadcrumb-item">
            <svg class="category-page__breadcrumb-sep" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span class="category-page__breadcrumb-current" aria-current="page" data-i18n="product.details">Подробнее</span>
          </li>
        </ol>
      </nav>
      <div class="product-page__hero">
        <div class="product-page__image-wrap" data-product-gallery></div>
        <div class="product-page__overview">
          <h1 class="product-page__title" data-product-title></h1>
          <section class="product-page__detail-card">
            <h2 class="product-page__detail-title" data-product-summary-title></h2>
            <ul class="product-page__summary" data-product-summary></ul>
          </section>
          <div class="product-page__purchase" data-product-purchase>
            <span class="product-page__price" data-product-price></span>
          </div>
        </div>
      </div>
      <div class="product-page__details" data-product-details></div>
    `;

    this.refs = {
      categoryLink: this.elements.content.querySelector('[data-product-category-link]'),
      title: this.elements.content.querySelector('[data-product-title]'),
      summaryTitle: this.elements.content.querySelector('[data-product-summary-title]'),
      summary: this.elements.content.querySelector('[data-product-summary]'),
      price: this.elements.content.querySelector('[data-product-price]'),
      purchase: this.elements.content.querySelector('[data-product-purchase]'),
      details: this.elements.content.querySelector('[data-product-details]'),
      gallery: this.elements.content.querySelector('[data-product-gallery]')
    };
  }

  renderHeader() {
    const name = this.getProductName();

    document.title = `${name} — Pascal Vent`;
    this.refs.categoryLink.href = this.getCategoryHref();
    this.refs.categoryLink.textContent = i18n.t(`catalog.${this.product.category}`);
    this.refs.title.textContent = name;
  }

  renderMainInfo() {
    this.refs.summaryTitle.textContent = this.t('mainParameters');
    this.refs.summary.innerHTML = this.getSummaryRows()
      .map(([key, value]) => this.summaryItem(key, value))
      .join('');
    this.refs.price.innerHTML = this.formatPrice(this.product.price);

    this.refs.purchase.querySelector('[data-action="create-order"]')?.remove();

    if (!isAdmin()) {
      const orderButton = document.createElement('button');
      orderButton.className = 'product-page__order';
      orderButton.type = 'button';
      orderButton.dataset.action = 'create-order';
      orderButton.textContent = this.t('order');
      this.refs.purchase.append(orderButton);
    }
  }

  renderDetails() {
    this.refs.details.innerHTML = this.getDetailSections()
      .map(([title, rows]) => this.detailBlock(title, rows))
      .join('');
  }

  getProductName() {
    return this.product.name_i18n[i18n.currentLang] || this.product.name_i18n.ru;
  }

  getCategoryHref() {
    const { category, subcategory } = this.product;

    if (category === 'ventilation') {
      const slug = subcategory || 'supply-exhaust';
      return `category.html?category=ventilation&subcategory=${encodeURIComponent(slug)}`;
    }

    return `category.html?category=${encodeURIComponent(category)}`;
  }

  getSummaryRows() {
    const product = this.product;
    const details = product.details;

    if (product.category === 'conditioning') {
      return [
        ['brand', product.brand],
        ['series', details.series],
        ['model', details.model],
        ['installationType', this.getInstallationLabel(product.installType)],
        ['inverterTechnology', this.t(product.isInverter ? 'inverter' : 'onOff')],
        ['recommendedArea', this.withUnit(product.area, 'м²')],
        ['availability', this.getAvailability()]
      ];
    }

    if (product.category === 'pools') {
      return [
        ['brand', product.brand],
        ['series', details.series],
        ['model', details.model],
        ['mountType', this.getMountLabel(product.mountType)],
        ['chassis', product.hasChassis ? this.t('chassisYes') : this.t('chassisNo')],
        ['availability', this.getAvailability()],
        ['warranty', details.warrantyYears != null ? `${details.warrantyYears} ${this.t('years')}` : null]
      ];
    }

    return [
      ['brand', details.brand],
      ['model', details.model],
      ['equipmentType', details.type_i18n?.[i18n.currentLang] || details.type_i18n?.ru],
      ['recommendedArea', this.withUnit(product.area, 'м²')],
      ['availability', this.getAvailability()],
      ['warranty', details.warrantyYears != null ? `${details.warrantyYears} ${this.t('years')}` : null]
    ];
  }

  getDetailSections() {
    const product = this.product;
    const details = product.details;

    if (product.category === 'conditioning') {
      return [
        [this.t('operationAndClimate'), [
          ['minimumHeatingTemp', product.heatingTemp != null ? `${this.t('upTo')} ${product.heatingTemp} °C` : null],
          ['minimumCoolingTemp', details.coolingMinTemp != null ? `${this.t('upTo')} ${details.coolingMinTemp} °C` : null],
          ['maximumOperatingTemp', details.maxOperatingTemp != null ? `${this.t('upTo')} +${details.maxOperatingTemp} °C` : null],
          ['refrigerant', details.refrigerant]
        ]],
        [this.t('controlAndSmartFeatures'), [
          ['wifiControl', this.getWifiLabel(details.wifiMode || (product.hasWifi ? 'builtIn' : 'none'))],
          ['smartHome', product.hasSmartHome || details.smartHomeMode === 'alica' ? this.t('smartHomeYes') : this.t('no')],
          ['remoteControl', details.remoteControl ? this.t('yes') : this.t('no')],
          ['indoorNoise', details.indoorNoiseMin != null && details.indoorNoiseMax != null
            ? `${details.indoorNoiseMin} / ${details.indoorNoiseMax} дБ`
            : null],
          ['outdoorNoise', this.withUnit(details.outdoorNoise, 'дБ')]
        ]],
        [this.t('electricalDetails'), [
          ['maxPower', this.withUnit(product.maxPower, 'кВт')],
          ['coolingPower', this.withUnit(product.coolingPower, 'кВт')],
          ['heatingPower', this.withUnit(product.heatingPower, 'кВт')],
          ['powerSupply', details.powerSupply],
          ['nominalCurrent', this.withUnit(details.nominalCurrent, 'А')]
        ]],
        [this.t('designAndDimensions'), [
          ['color', this.getColorLabel(product.color)],
          ['width', this.withUnit(details.width, 'см')],
          ['height', this.withUnit(details.height, 'см')],
          ['depth', this.withUnit(details.depth, 'см')],
          ['netWeight', this.withUnit(details.netWeight, 'кг')],
          ['grossWeight', this.withUnit(details.grossWeight, 'кг')]
        ]]
      ];
    }

    if (product.category === 'pools') {
      return [
        [this.t('dehumidificationPerformance'), [
          ['moistureRemoval', this.withUnit(product.moistureRemoval, 'л/сутки')],
          ['airflow', this.withUnit(product.performance, 'м³/час')]
        ]],
        [this.t('electricityAndSafety'), [
          ['powerSupply', product.powerType != null ? `${product.powerType} В` : null],
          ['protectionClass', details.protectionClass]
        ]],
        [this.t('condensateAndConstruction'), [
          ['drainPump', product.hasDrainPump ? this.t('yes') : this.t('no')],
          ['noiseLevel', this.withUnit(product.noiseLevel, 'дБ')]
        ]],
        [this.t('dimensionsAndWeight'), [
          ['width', this.withUnit(details.width, 'см')],
          ['height', this.withUnit(details.height, 'см')],
          ['depth', this.withUnit(details.depth, 'см')],
          ['netWeight', this.withUnit(details.netWeight, 'кг')],
          ['grossWeight', this.withUnit(details.grossWeight, 'кг')]
        ]]
      ];
    }

    return [
      [this.t('performanceAndEfficiency'), [
        ['maximumAirflow', this.withUnit(product.performance, 'м³/час')],
        ['maximumStaticPressure', this.withUnit(details.staticPressure, 'Па')],
        ['recuperatorType', this.getRecuperatorLabel(product.recuperatorType)],
        ['recoveryEfficiency', details.recoveryEfficiency ? `${this.t('upTo')} ${details.recoveryEfficiency}%` : null],
        ['noiseLevel', this.withUnit(details.noiseLevel, 'дБ')]
      ]],
      [this.t('electricalParameters'), [
        ['maxPower', this.withUnit(product.maxPower, 'кВт')],
        ['heaterPower', this.withUnit(details.heaterPower, 'кВт')],
        ['powerSupply', details.powerSupply],
        ['nominalCurrent', this.withUnit(details.nominalCurrent, 'А')]
      ]],
      [this.t('material'), [
        ['bodyMaterial', details.bodyMaterial ? this.t(details.bodyMaterial) : null]
      ]],
      [this.t('dimensionsAndWeight'), [
        ['width', this.withUnit(details.width, 'см')],
        ['height', this.withUnit(details.height, 'см')],
        ['depth', this.withUnit(details.depth, 'см')],
        ['netWeight', this.withUnit(details.netWeight, 'кг')],
        ['packageDimensions', details.packageDimensions],
        ['grossWeight', this.withUnit(details.grossWeight, 'кг')]
      ]]
    ];
  }

  initGallery(alt) {
    const images = (this.product.images || []).map((src) => `../${src}`);
    createImageSlider(this.refs.gallery, images, alt);
  }

  getAvailability() {
    return this.product.inStock
      ? this.t('inStock')
      : `${this.t('madeToOrder')} (${this.t('deliveryFrom')} ${this.product.deliveryDays || 5} ${this.t('days')})`;
  }

  getInstallationLabel(type) {
    const labels = {
      wall: 'wallMount',
      duct: 'ductMount',
      cassette: 'cassetteMount'
    };

    return this.t(labels[type] || type);
  }

  getMountLabel(type) {
    const labels = {
      floor: 'floorMount',
      wall: 'wallMount',
      duct: 'ductMount'
    };

    return this.t(labels[type] || type);
  }

  getColorLabel(color) {
    const labels = {
      white: 'whiteColor',
      'matte-white': 'matteWhiteColor',
      'graphite-black': 'graphiteBlackColor',
      gold: 'goldColor'
    };

    return this.t(labels[color] || color);
  }

  getWifiLabel(mode) {
    const labels = {
      builtIn: 'wifiBuiltIn',
      option: 'wifiOption',
      none: 'wifiNone'
    };

    return this.t(labels[mode] || 'wifiNone');
  }

  bindOrderButton() {
    const orderButton = this.refs?.purchase?.querySelector('[data-action="create-order"]');

    if (!orderButton) {
      return;
    }

    orderButton.addEventListener('click', () => {
      if (isAdmin()) {
        Modal.showError(i18n.t('auth.adminForbiddenMessage'), {
          title: i18n.t('auth.adminForbiddenTitle'),
          closeLabel: i18n.t('common.close')
        });
        return;
      }

      console.log('Create order for:', this.product.id);
    });
  }

  summaryItem(key, value) {
    return `
      <li class="product-page__summary-item">
        <span class="product-page__spec-label">
          ${this.t(key)}
          ${renderSpecTooltipTrigger(key, i18n.currentLang)}
        </span>
        <strong>${this.formatValue(value)}</strong>
      </li>
    `;
  }

  detailBlock(title, rows) {
    return `
      <section class="product-page__detail-card">
        <h2 class="product-page__detail-title">${title}</h2>
        <dl class="product-page__detail-list">
          ${rows.map(([key, value]) => `
            <div class="product-page__detail-row">
              <dt>
                <span class="product-page__spec-label">
                  ${this.t(key)}
                  ${renderSpecTooltipTrigger(key, i18n.currentLang)}
                </span>
              </dt>
              <dd>${this.formatValue(value)}</dd>
            </div>
          `).join('')}
        </dl>
      </section>
    `;
  }

  formatValue(value, unit = '') {
    if (value == null || value === '' || value === 'undefined' || Number.isNaN(value)) {
      return '—';
    }

    const text = String(value).trim();

    if (!text || text === 'undefined' || text === 'null' || text.includes('undefined')) {
      return '—';
    }

    return unit ? `${text} ${unit}` : text;
  }

  withUnit(value, unit) {
    if (value == null || value === '' || Number.isNaN(value)) {
      return '—';
    }

    return `${value} ${unit}`;
  }

  t(key) {
    return DETAILED_TRANSLATIONS[i18n.currentLang]?.[key]
      || DETAILED_TRANSLATIONS.ru[key]
      || key;
  }

  getRecuperatorLabel(type) {
    const labels = {
      plate: 'plateRecuperator',
      rotary: 'rotaryRecuperator'
    };

    return this.t(labels[type] || 'noRecuperator');
  }

  formatPrice(price) {
    return `${new Intl.NumberFormat(i18n.currentLang).format(price)}\u00A0${i18n.t('common.currency')}`;
  }
}

new ProductPage().init();
