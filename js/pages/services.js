import i18n from '../common/i18n.js';

const SERVICE_LISTS = {
  ventilation: [
    'services.ventilation.item1',
    'services.ventilation.item2',
    'services.ventilation.item3',
    'services.ventilation.item4',
    'services.ventilation.item5',
    'services.ventilation.item6'
  ],
  conditioning: [
    'services.conditioning.item1',
    'services.conditioning.item2',
    'services.conditioning.item3',
    'services.conditioning.item4',
    'services.conditioning.item5',
    'services.conditioning.item6'
  ]
};

const SERVICE_PHOTOS = {
  ventilation: {
    desktop: 'assets/images/services-photo.png',
    mobile: 'assets/images/services-photo-mobile.png',
    altKey: 'services.photoAlt.ventilation'
  },
  conditioning: {
    desktop: 'assets/images/benefits-photo-1.png',
    mobile: 'assets/images/benefits-photo-1.png',
    altKey: 'services.photoAlt.conditioning'
  }
};

function renderServicesList(listElement, category) {
  const keys = SERVICE_LISTS[category] || SERVICE_LISTS.ventilation;

  listElement.innerHTML = keys.map((key, index) => `
    <li class="services__item">
      <img class="services__item-icon" src="assets/icons/svc-icon-${(index % 6) + 1}.svg" alt="">
      <span class="services__item-text" data-i18n="${key}">${i18n.t(key)}</span>
    </li>
  `).join('');
}

function updateServicesPhoto(section, category) {
  const photoWrap = section.querySelector('.services__panel-photo');
  const picture = photoWrap?.querySelector('picture');
  const img = photoWrap?.querySelector('img');
  const source = picture?.querySelector('source');
  const config = SERVICE_PHOTOS[category] || SERVICE_PHOTOS.ventilation;

  if (!img) {
    return;
  }

  const nextAlt = i18n.t(config.altKey) || img.alt;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const applySources = () => {
    if (source) {
      source.srcset = config.mobile;
    }

    img.src = config.desktop;
    img.alt = nextAlt;
    img.dataset.i18nAlt = config.altKey;
  };

  if (reduceMotion || img.getAttribute('src') === config.desktop) {
    applySources();
    photoWrap?.classList.remove('is-switching');
    return;
  }

  photoWrap?.classList.add('is-switching');

  window.setTimeout(() => {
    applySources();

    const finish = () => {
      photoWrap?.classList.remove('is-switching');
      img.removeEventListener('load', finish);
    };

    if (img.complete) {
      window.requestAnimationFrame(() => {
        photoWrap?.classList.remove('is-switching');
      });
      return;
    }

    img.addEventListener('load', finish, { once: true });
    window.setTimeout(finish, 400);
  }, 180);
}

export function initServicesTabs() {
  const section = document.querySelector('.services');
  if (!section) {
    return;
  }

  const tabs = section.querySelectorAll('.services__tab[data-services-tab]');
  const list = section.querySelector('.services__list');

  if (!tabs.length || !list) {
    return;
  }

  const setActive = (category) => {
    tabs.forEach((tab) => {
      const isActive = tab.dataset.servicesTab === category;
      tab.classList.toggle('services__tab--active', isActive);
      tab.setAttribute('aria-selected', String(isActive));
      tab.tabIndex = isActive ? 0 : -1;
    });

    list.dataset.servicesCategory = category;
    renderServicesList(list, category);
    updateServicesPhoto(section, category);
  };

  tabs.forEach((tab) => {
    tab.setAttribute('role', 'tab');
    tab.addEventListener('click', () => setActive(tab.dataset.servicesTab));
  });

  document.addEventListener('languageChanged', () => {
    const active = section.querySelector('.services__tab--active')?.dataset.servicesTab || 'ventilation';
    renderServicesList(list, active);
    updateServicesPhoto(section, active);
  });

  const initial = section.querySelector('.services__tab--active')?.dataset.servicesTab || 'ventilation';
  setActive(initial);
}

void i18n.init().then(() => initServicesTabs());
