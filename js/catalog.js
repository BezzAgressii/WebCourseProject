import api from './api.js';
import i18n from './i18n.js';

function getProductWord(count, language) {
  if (language === 'ru') {
    const lastTwoDigits = count % 100;
    const lastDigit = count % 10;

    if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
      return 'товаров';
    }

    if (lastDigit === 1) {
      return 'товар';
    }

    if (lastDigit >= 2 && lastDigit <= 4) {
      return 'товара';
    }

    return 'товаров';
  }

  if (language === 'be') {
    return count === 1 ? 'тавар' : 'тавараў';
  }

  return count === 1 ? 'product' : 'products';
}

async function renderCategoryCounts() {
  try {
    const products = await api.getProducts();

    document.querySelectorAll('[data-category-count]').forEach((element) => {
      const category = element.dataset.categoryCount;
      const count = products.filter((product) => product.category === category).length;

      element.textContent = `${count} ${getProductWord(count, i18n.currentLang)}`;
    });
  } catch (error) {
    console.error('Unable to render catalog counts:', error);
  }
}

await i18n.init();
await renderCategoryCounts();

document.addEventListener('languageChanged', renderCategoryCounts);
