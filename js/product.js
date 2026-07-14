import api from './api.js';
import DETAILED_TRANSLATIONS from './detailed-translation.js';
import i18n from './i18n.js';

class ProductPage {
  constructor() {
    this.product = null;
    this.elements = {
      content: document.getElementById('product-content')
    };
  }

  async init() {
    await i18n.init();
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
    if (!this.product || this.product.category !== 'ventilation' || !this.product.details) {
      this.elements.content.innerHTML = `<p class="product-page__empty">${this.t('unavailable')}</p>`;
      return;
    }

    const productName = this.product.name_i18n[i18n.currentLang] || this.product.name_i18n.ru;
    const details = this.product.details;
    const image = this.product.images[0] || 'assets/images/cta-fan.png';
    const availability = this.product.inStock
      ? this.t('inStock')
      : `${this.t('madeToOrder')} (${this.t('deliveryFrom')} ${this.product.deliveryDays || 5} ${this.t('days')})`;

    document.title = `${productName} — Pascal Vent`;
    this.elements.content.innerHTML = `
      <a class="product-page__back" href="category.html?category=ventilation">← ${this.t('backToCatalog')}</a>
      <div class="product-page__hero">
        <div class="product-page__image-wrap">
          <img class="product-page__image" src="${this.escapeHtml(image)}" alt="${this.escapeHtml(productName)}">
        </div>
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
            <button class="product-page__order" type="button" data-action="create-order">${this.t('order')}</button>
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

    this.elements.content.querySelector('[data-action="create-order"]').addEventListener('click', () => {
      console.log('Create order for:', this.product.id);
    });
  }

  summaryItem(key, value) {
    return `<li class="product-page__summary-item"><span>${this.t(key)}</span><strong>${this.escapeHtml(value)}</strong></li>`;
  }

  detailBlock(title, rows) {
    return `
      <section class="product-page__detail-card">
        <h2 class="product-page__detail-title">${this.escapeHtml(title)}</h2>
        <dl class="product-page__detail-list">
          ${rows.map(([key, value]) => `
            <div class="product-page__detail-row">
              <dt>${this.t(key)}</dt>
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
