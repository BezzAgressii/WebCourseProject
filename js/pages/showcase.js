
import i18n from '../common/i18n.js';
import { openRequestModal } from '../components/contact-modals.js';

const TYPE_I18N_KEYS = {
  apartments: 'showcase.card.apartments',
  shops: 'showcase.card.shops',
  fitness: 'showcase.card.fitness',
  pools: 'showcase.card.pools',
  houses: 'showcase.card.houses',
  restaurants: 'showcase.card.restaurants',
  clinics: 'showcase.card.clinics',
  beauty: 'showcase.card.beauty'
};

function resolveObjectType(card) {
  const typeKey = card.dataset.showcaseType?.trim() || '';
  const i18nKey = card.dataset.showcaseI18n?.trim() || TYPE_I18N_KEYS[typeKey] || '';

  if (i18nKey) {
    const translated = i18n.t(i18nKey);
    if (translated && translated !== i18nKey) {
      return { objectType: translated, objectTypeKey: typeKey };
    }
  }

  const fromName = card.querySelector('.showcase-card__name')?.textContent?.trim() || '';
  return { objectType: fromName, objectTypeKey: typeKey };
}

function openRequestForCard(card) {
  const { objectType, objectTypeKey } = resolveObjectType(card);

  void i18n.init().then(() => {
    const resolved = resolveObjectType(card);
    openRequestModal({
      objectType: resolved.objectType || objectType,
      objectTypeKey: resolved.objectTypeKey || objectTypeKey
    });
  });
}

export function initShowcaseRequest() {
  const grid = document.querySelector('.showcase__grid');

  if (!grid || grid.dataset.showcaseReady === 'true') {
    return;
  }

  grid.dataset.showcaseReady = 'true';

  grid.addEventListener('click', (event) => {
    const card = event.target.closest('[data-showcase-type]');

    if (!card || !grid.contains(card)) {
      return;
    }

    openRequestForCard(card);
  });

  grid.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    const card = event.target.closest('[data-showcase-type]');

    if (!card || !grid.contains(card)) {
      return;
    }

    event.preventDefault();
    openRequestForCard(card);
  });
}

initShowcaseRequest();
