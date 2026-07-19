import i18n from '../common/i18n.js';

const MAP_COORDS = [53.901212, 30.335829];
const MAP_LON_LAT = [30.335829, 53.901212];

let mapInstance = null;
let placemarkInstance = null;
let iframeMode = false;

function getAddressPlain() {
  return String(i18n.t('footer.address.full') || '')
    .replace(/<br\s*\/?>/gi, ', ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getAddressHtml() {
  return i18n.t('footer.address.full') || '';
}

function getSiteTheme() {
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}

function buildIframeSrc(theme) {
  const [lon, lat] = MAP_LON_LAT;
  const params = new URLSearchParams({
    ll: `${lon},${lat}`,
    z: '17',
    pt: `${lon},${lat},pm2rdm`,
    l: 'map',
    lang: 'ru_RU'
  });

  if (theme === 'dark') {
    params.set('theme', 'dark');
  }

  return `https://yandex.ru/map-widget/v1/?${params.toString()}`;
}

function clearMapContainer(container) {
  container.innerHTML = '';
  container.classList.remove('contacts-map__frame--locked', 'contacts-map__frame--dim');
}

function renderLockedIframe(container, theme = getSiteTheme()) {
  iframeMode = true;
  mapInstance = null;
  placemarkInstance = null;

  clearMapContainer(container);
  container.classList.add('contacts-map__frame--locked');

  const iframe = document.createElement('iframe');
  iframe.dataset.contactsMap = 'true';
  iframe.title = `Pascal Vent — ${getAddressPlain()}`;
  iframe.src = buildIframeSrc(theme);
  iframe.loading = 'lazy';
  iframe.referrerPolicy = 'no-referrer-when-downgrade';
  iframe.setAttribute('tabindex', '-1');
  container.appendChild(iframe);

  const caption = document.createElement('div');
  caption.className = 'contacts-map__caption';
  caption.innerHTML = `
    <p class="contacts-map__caption-title">Pascal Vent</p>
    <p class="contacts-map__caption-address">${getAddressHtml()}</p>
  `;
  container.appendChild(caption);
}

function updatePlacemarkContent() {
  if (!placemarkInstance) {
    return;
  }

  placemarkInstance.properties.set({
    iconCaption: 'Pascal Vent',
    balloonContentHeader: 'Pascal Vent',
    balloonContentBody: getAddressHtml(),
    hintContent: getAddressPlain()
  });
}

function initYandexMap(container) {
  window.ymaps.ready(() => {
    iframeMode = false;
    clearMapContainer(container);

    mapInstance = new window.ymaps.Map(container, {
      center: MAP_COORDS,
      zoom: 17,
      type: 'yandex#map',
      controls: ['zoomControl', 'fullscreenControl']
    }, {
      suppressMapOpenBlock: true
    });

    placemarkInstance = new window.ymaps.Placemark(MAP_COORDS, {
      iconCaption: 'Pascal Vent',
      balloonContentHeader: 'Pascal Vent',
      balloonContentBody: getAddressHtml(),
      hintContent: getAddressPlain()
    }, {
      preset: 'islands#darkGreenDotIconWithCaption',
      iconCaptionMaxWidth: 240,
      hideIconOnBalloonOpen: false
    });

    mapInstance.geoObjects.add(placemarkInstance);
    placemarkInstance.balloon.open();

    container.classList.toggle('contacts-map__frame--dim', getSiteTheme() === 'dark');
  });
}

function applyTheme(container) {
  const theme = getSiteTheme();

  if (iframeMode) {
    renderLockedIframe(container, theme);
    return;
  }

  if (!mapInstance) {
    return;
  }

  container.classList.toggle('contacts-map__frame--dim', theme === 'dark');
}

function observeSiteTheme(container) {
  const observer = new MutationObserver(() => {
    applyTheme(container);
  });

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme']
  });
}

function loadYandexMapsScript() {
  return new Promise((resolve, reject) => {
    if (window.ymaps) {
      resolve();
      return;
    }

    const existing = document.querySelector('script[data-yandex-maps]');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Yandex Maps failed to load')));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://api-maps.yandex.ru/2.1/?lang=ru_RU';
    script.async = true;
    script.dataset.yandexMaps = 'true';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Yandex Maps failed to load'));
    document.head.appendChild(script);
  });
}

function tilesSeemLoaded(container) {
  const images = [...container.querySelectorAll('ymaps img, .ymaps-2-1-79-ground-pane img')];
  if (images.some((img) => img.naturalWidth > 8)) {
    return true;
  }

  const canvases = [...container.querySelectorAll('canvas')];
  return canvases.some((canvas) => canvas.width > 8 && canvas.height > 8);
}

async function initContactsPage() {
  await i18n.init();

  const mapContainer = document.getElementById('contacts-map');
  if (!mapContainer) {
    return;
  }

  observeSiteTheme(mapContainer);

  document.addEventListener('languageChanged', () => {
    updatePlacemarkContent();

    if (iframeMode) {
      const addressEl = mapContainer.querySelector('.contacts-map__caption-address');
      if (addressEl) {
        addressEl.innerHTML = getAddressHtml();
      }
      const iframe = mapContainer.querySelector('iframe[data-contacts-map]');
      if (iframe) {
        iframe.title = `Pascal Vent — ${getAddressPlain()}`;
      }
    }
  });

  try {
    await loadYandexMapsScript();
    initYandexMap(mapContainer);

    window.setTimeout(() => {
      if (iframeMode || !mapInstance) {
        return;
      }

      if (!tilesSeemLoaded(mapContainer)) {
        try {
          mapInstance.destroy();
        } catch {
          // ignore
        }
        mapInstance = null;
        placemarkInstance = null;
        renderLockedIframe(mapContainer, getSiteTheme());
      }
    }, 2800);
  } catch {
    renderLockedIframe(mapContainer, getSiteTheme());
  }
}

initContactsPage();
