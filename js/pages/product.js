import api from '../utils/api.js';
import DETAILED_TRANSLATIONS from '../utils/detailed-translation.js';
import i18n from '../common/i18n.js';
import { isAdmin } from '../utils/auth-session.js';
import { Modal } from '../components/modal.js';
import { createImageSlider } from '../components/slider.js';
import { initSpecTooltips, renderSpecTooltipTrigger } from '../components/spec-tooltip.js';

class ProductPage {
  constructor() {
    this.product = null;
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
    if (!this.product || !this.product.details) {
      this.elements.content.innerHTML = `<p class="product-page__empty">${this.t('unavailable')}</p>`;
      return;
    }

    if (this.product.category === 'conditioning') {
      this.renderConditioningProduct();
      return;
    }

    if (this.product.category === 'pools') {
      this.renderPoolProduct();
      return;
    }

    if (this.product.category !== 'ventilation') {
      this.elements.content.innerHTML = `<p class="product-page__empty">${this.t('unavailable')}</p>`;
      return;
    }

    const productName = this.product.name_i18n[i18n.currentLang] || this.product.name_i18n.ru;
    const details = this.product.details;
    const availability = this.getAvailability();

    document.title = `${productName} — Pascal Vent`;
    this.elements.content.innerHTML = `
      <a class="product-page__back" href="category.html?category=ventilation">← ${this.t('backToCatalog')}</a>
      <div class="product-page__hero">
        <div class="product-page__image-wrap" data-product-gallery></div>
        <div class="product-page__overview">
          <h1 class="product-page__title">${this.escapeHtml(productName)}</h1>
          <section class="product-page__detail-card">
            <h2 class="product-page__detail-title">${this.t('mainParameters')}</h2>
            <ul class="product-page__summary">
              ${this.summaryItem('brand', details.brand)}
              ${this.summaryItem('model', details.model)}
              ${this.summaryItem('equipmentType', details.type_i18n[i18n.currentLang] || details.type_i18n.ru)}
              ${this.summaryItem('recommendedArea', `${this.product.area} м²`)}
              ${this.summaryItem('availability', availability)}
              ${this.summaryItem('warranty', `${details.warrantyYears} ${this.t('years')}`)}
            </ul>
          </section>
          <div class="product-page__purchase">
            <span class="product-page__price">${this.formatPrice(this.product.price)}</span>
            ${this.getOrderButtonHtml()}
          </div>
        </div>
      </div>
      <div class="product-page__details">
        ${this.detailBlock(this.t('performanceAndEfficiency'), [
          ['maximumAirflow', `${this.product.performance} м³/час`],
          ['maximumStaticPressure', `${details.staticPressure} Па`],
          ['recuperatorType', this.getRecuperatorLabel(this.product.recuperatorType)],
          ['recoveryEfficiency', details.recoveryEfficiency ? `${this.t('upTo')} ${details.recoveryEfficiency}%` : '—'],
          ['noiseLevel', `${details.noiseLevel} дБ`]
        ])}
        ${this.detailBlock(this.t('electricalParameters'), [
          ['maxPower', `${this.product.maxPower} кВт`],
          ['heaterPower', `${details.heaterPower} кВт`],
          ['powerSupply', details.powerSupply],
          ['nominalCurrent', `${details.nominalCurrent} А`]
        ])}
        ${this.detailBlock(this.t('material'), [
          ['bodyMaterial', this.t(details.bodyMaterial)]
        ])}
        ${this.detailBlock(this.t('dimensionsAndWeight'), [
          ['width', `${details.width} см`],
          ['height', `${details.height} см`],
          ['depth', `${details.depth} см`],
          ['netWeight', `${details.netWeight} кг`],
          ['packageDimensions', details.packageDimensions],
          ['grossWeight', `${details.grossWeight} кг`]
        ])}
      </div>
    `;

    this.initGallery(productName);
    this.bindOrderButton();
  }

  renderConditioningProduct() {
    const product = this.product;
    const details = product.details;
    const name = product.name_i18n[i18n.currentLang] || product.name_i18n.ru;

    document.title = `${name} — Pascal Vent`;
    this.elements.content.innerHTML = `
      <a class="product-page__back" href="category.html?category=conditioning">← ${this.t('backToCatalog')}</a>
      <div class="product-page__hero">
        <div class="product-page__image-wrap" data-product-gallery></div>
        <div class="product-page__overview">
          <h1 class="product-page__title">${this.escapeHtml(name)}</h1>
          <section class="product-page__detail-card">
            <h2 class="product-page__detail-title">${this.t('mainParameters')}</h2>
            <ul class="product-page__summary">
              ${this.summaryItem('brand', product.brand)}
              ${this.summaryItem('series', details.series)}
              ${this.summaryItem('model', details.model)}
              ${this.summaryItem('installationType', this.getInstallationLabel(product.installType))}
              ${this.summaryItem('inverterTechnology', this.t(product.isInverter ? 'inverter' : 'onOff'))}
              ${this.summaryItem('recommendedArea', `${product.area} м²`)}
              ${this.summaryItem('availability', this.getAvailability())}
            </ul>
          </section>
          <div class="product-page__purchase">
            <span class="product-page__price">${this.formatPrice(product.price)}</span>
            ${this.getOrderButtonHtml()}
          </div>
        </div>
      </div>
      <div class="product-page__details">
        ${this.detailBlock(this.t('operationAndClimate'), [
          ['minimumHeatingTemp', `${this.t('upTo')} ${product.heatingTemp} °C`],
          ['minimumCoolingTemp', `${this.t('upTo')} ${details.coolingMinTemp} °C`],
          ['maximumOperatingTemp', `${this.t('upTo')} +${details.maxOperatingTemp} °C`],
          ['refrigerant', details.refrigerant]
        ])}
        ${this.detailBlock(this.t('controlAndSmartFeatures'), [
          ['wifiControl', this.getWifiLabel(details.wifiMode)],
          ['smartHome', details.smartHomeMode === 'alica' ? this.t('smartHomeYes') : this.t('no')],
          ['remoteControl', details.remoteControl ? this.t('yes') : this.t('no')],
          ['indoorNoise', `${details.indoorNoiseMin} / ${details.indoorNoiseMax} дБ`],
          ['outdoorNoise', `${details.outdoorNoise} дБ`]
        ])}
        ${this.detailBlock(this.t('electricalDetails'), [
          ['maxPower', `${product.maxPower} кВт`],
          ['coolingPower', `${product.coolingPower} кВт`],
          ['heatingPower', `${product.heatingPower} кВт`],
          ['powerSupply', details.powerSupply],
          ['nominalCurrent', `${details.nominalCurrent} А`]
        ])}
        ${this.detailBlock(this.t('designAndDimensions'), [
          ['color', this.getColorLabel(product.color)],
          ['width', `${details.width} см`],
          ['height', `${details.height} см`],
          ['depth', `${details.depth} см`],
          ['netWeight', `${details.netWeight} кг`],
          ['grossWeight', `${details.grossWeight} кг`]
        ])}
      </div>
    `;
    this.initGallery(name);
    this.bindOrderButton();
  }

  renderPoolProduct() {
    const product = this.product;
    const details = product.details;
    const name = product.name_i18n[i18n.currentLang] || product.name_i18n.ru;

    document.title = `${name} — Pascal Vent`;
    this.elements.content.innerHTML = `
      <a class="product-page__back" href="category.html?category=pools">← ${this.t('backToCatalog')}</a>
      <div class="product-page__hero">
        <div class="product-page__image-wrap" data-product-gallery></div>
        <div class="product-page__overview">
          <h1 class="product-page__title">${this.escapeHtml(name)}</h1>
          <section class="product-page__detail-card">
            <h2 class="product-page__detail-title">${this.t('mainParameters')}</h2>
            <ul class="product-page__summary">
              ${this.summaryItem('brand', product.brand)}
              ${this.summaryItem('series', details.series)}
              ${this.summaryItem('model', details.model)}
              ${this.summaryItem('mountType', this.getMountLabel(product.mountType))}
              ${this.summaryItem('chassis', product.hasChassis ? this.t('chassisYes') : this.t('chassisNo'))}
              ${this.summaryItem('availability', this.getAvailability())}
              ${this.summaryItem('warranty', `${details.warrantyYears} ${this.t('years')}`)}
            </ul>
          </section>
          <div class="product-page__purchase">
            <span class="product-page__price">${this.formatPrice(product.price)}</span>
            ${this.getOrderButtonHtml()}
          </div>
        </div>
      </div>
      <div class="product-page__details">
        ${this.detailBlock(this.t('dehumidificationPerformance'), [
          ['moistureRemoval', `${product.moistureRemoval} л/сутки`],
          ['airflow', `${product.performance} м³/час`]
        ])}
        ${this.detailBlock(this.t('electricityAndSafety'), [
          ['powerSupply', `${product.powerType} В`],
          ['protectionClass', details.protectionClass]
        ])}
        ${this.detailBlock(this.t('condensateAndConstruction'), [
          ['drainPump', product.hasDrainPump ? this.t('yes') : this.t('no')],
          ['noiseLevel', `${product.noiseLevel} дБ`]
        ])}
        ${this.detailBlock(this.t('dimensionsAndWeight'), [
          ['width', `${details.width} см`],
          ['height', `${details.height} см`],
          ['depth', `${details.depth} см`],
          ['netWeight', `${details.netWeight} кг`],
          ['grossWeight', `${details.grossWeight} кг`]
        ])}
      </div>
    `;
    this.initGallery(name);
    this.bindOrderButton();
  }

  initGallery(alt) {
    const container = this.elements.content.querySelector('[data-product-gallery]');
    const images = (this.product.images || []).map((src) => `../${src}`);

    createImageSlider(container, images, alt);
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
    const orderButton = this.elements.content.querySelector('[data-action="create-order"]');

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

  getOrderButtonHtml() {
    if (isAdmin()) {
      return '';
    }

    return `<button class="product-page__order" type="button" data-action="create-order">${this.t('order')}</button>`;
  }

  summaryItem(key, value) {
    return `
      <li class="product-page__summary-item">
        <span class="product-page__spec-label">
          ${this.escapeHtml(this.t(key))}
          ${renderSpecTooltipTrigger(key, i18n.currentLang)}
        </span>
        <strong>${this.escapeHtml(value)}</strong>
      </li>
    `;
  }

  detailBlock(title, rows) {
    return `
      <section class="product-page__detail-card">
        <h2 class="product-page__detail-title">${this.escapeHtml(title)}</h2>
        <dl class="product-page__detail-list">
          ${rows.map(([key, value]) => `
            <div class="product-page__detail-row">
              <dt>
                <span class="product-page__spec-label">
                  ${this.escapeHtml(this.t(key))}
                  ${renderSpecTooltipTrigger(key, i18n.currentLang)}
                </span>
              </dt>
              <dd>${this.escapeHtml(value)}</dd>
            </div>
          `).join('')}
        </dl>
      </section>
    `;
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
    return `${new Intl.NumberFormat(i18n.currentLang).format(price)} ${i18n.t('common.currency')}`;
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

new ProductPage().init();
