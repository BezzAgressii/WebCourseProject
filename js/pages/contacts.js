import i18n from '../common/i18n.js';

const MAP_COORDS = [53.901212, 30.335829];
const MAP_LON_LAT = [30.335829, 53.901212];
const DARK_MAP_TYPE = 'pascal#dark';

let mapInstance = null;
let placemarkInstance = null;
let iframeMode = false;

function getAddressPlain() {
  return String(i18n.t('footer.address.full') || '')
    .replace(/<br\s*\/?>/gi, ', ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getBalloonHtml() {
  const address = i18n.t('footer.address.full') || '';
  return `
    <strong>Pascal Vent</strong><br>
    ${address}
  `;
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
    theme: theme === 'dark' ? 'dark' : 'light'
  });

  return `https://yandex.ru/map-widget/v1/?${params.toString()}`;
}

function renderIframeFallback(container, theme = getSiteTheme()) {
  iframeMode = true;
  mapInstance = null;
  placemarkInstance = null;

  container.innerHTML = `
    <iframe
      title="Pascal Vent — ${getAddressPlain()}"
      src="${buildIframeSrc(theme)}"
      loading="lazy"
      allowfullscreen
      referrerpolicy="no-referrer-when-downgrade"
    ></iframe>
  `;
}

function ensureDarkMapType() {
  if (!window.ymaps || window.ymaps.mapType.storage.get(DARK_MAP_TYPE)) {
    return;
  }

  const darkLayer = new window.ymaps.Layer(
    'https://core-renderer-tiles.maps.yandex.net/tiles?l=map&theme=dark&x=%x&y=%y&z=%z&scale=%s&lang=ru_RU',
    {
      projection: window.ymaps.projection.sphericalMercator
    }
  );

  window.ymaps.mapType.storage.add(
    DARK_MAP_TYPE,
    new window.ymaps.MapType('Dark', [darkLayer])
  );
}

function applyMapTheme(theme) {
  const next = theme === 'dark' ? 'dark' : 'light';
  const container = document.getElementById('contacts-map');

  if (!container) {
    return;
  }

  if (iframeMode) {
    const iframe = container.querySelector('iframe');
    const nextSrc = buildIframeSrc(next);

    if (iframe) {
      const current = iframe.getAttribute('src') || '';
      if (!current.includes(`theme=${next}`)) {
        iframe.src = nextSrc;
      }
    } else {
      renderIframeFallback(container, next);
    }
    return;
  }

  if (!mapInstance || !window.ymaps) {
    return;
  }

  ensureDarkMapType();
  mapInstance.setType(next === 'dark' ? DARK_MAP_TYPE : 'yandex#map');
}

function initYandexMap(container) {
  if (typeof window.ymaps === 'undefined') {
    renderIframeFallback(container);
    return;
  }

  window.ymaps.ready(() => {
    iframeMode = false;
    ensureDarkMapType();

    const theme = getSiteTheme();

    mapInstance = new window.ymaps.Map(container, {
      center: MAP_COORDS,
      zoom: 17,
      type: theme === 'dark' ? DARK_MAP_TYPE : 'yandex#map',
      controls: ['zoomControl', 'geolocationControl', 'fullscreenControl']
    }, {
      suppressMapOpenBlock: true
    });

    placemarkInstance = new window.ymaps.Placemark(MAP_COORDS, {
      balloonContentHeader: 'Pascal Vent',
      balloonContentBody: getBalloonHtml(),
      hintContent: getAddressPlain()
    }, {
      preset: 'islands#darkGreenDotIcon',
      openBalloonOnClick: true
    });

    mapInstance.geoObjects.add(placemarkInstance);
    placemarkInstance.balloon.open();

    document.addEventListener('languageChanged', () => {
      if (!placemarkInstance) {
        return;
      }

      placemarkInstance.properties.set({
        balloonContentBody: getBalloonHtml(),
        hintContent: getAddressPlain()
      });
    });
  });
}

function observeSiteTheme() {
  const observer = new MutationObserver(() => {
    applyMapTheme(getSiteTheme());
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

async function initContactsPage() {
  await i18n.init();

  const mapContainer = document.getElementById('contacts-map');
  if (!mapContainer) {
    return;
  }

  observeSiteTheme();

  try {
    await loadYandexMapsScript();
    initYandexMap(mapContainer);
  } catch {
    renderIframeFallback(mapContainer);
  }
}

initContactsPage();
