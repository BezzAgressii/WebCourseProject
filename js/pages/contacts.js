import i18n from '../common/i18n.js';

const MAP_COORDS = [53.901212, 30.335829];
const MAP_LON_LAT = [30.335829, 53.901212];

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

function renderIframeFallback(container) {
  const [lon, lat] = MAP_LON_LAT;
  const src = `https://yandex.ru/map-widget/v1/?ll=${encodeURIComponent(`${lon},${lat}`)}&z=17&pt=${encodeURIComponent(`${lon},${lat}`)},pm2rdm&l=map`;

  container.innerHTML = `
    <iframe
      title="Pascal Vent — ${getAddressPlain()}"
      src="${src}"
      loading="lazy"
      allowfullscreen
      referrerpolicy="no-referrer-when-downgrade"
    ></iframe>
  `;
}

function initYandexMap(container) {
  if (typeof window.ymaps === 'undefined') {
    renderIframeFallback(container);
    return;
  }

  window.ymaps.ready(() => {
    const map = new window.ymaps.Map(container, {
      center: MAP_COORDS,
      zoom: 17,
      controls: ['zoomControl', 'geolocationControl', 'fullscreenControl']
    }, {
      suppressMapOpenBlock: true
    });

    const placemark = new window.ymaps.Placemark(MAP_COORDS, {
      balloonContentHeader: 'Pascal Vent',
      balloonContentBody: getBalloonHtml(),
      hintContent: getAddressPlain()
    }, {
      preset: 'islands#darkGreenDotIcon',
      openBalloonOnClick: true
    });

    map.geoObjects.add(placemark);
    placemark.balloon.open();

    document.addEventListener('languageChanged', () => {
      placemark.properties.set({
        balloonContentBody: getBalloonHtml(),
        hintContent: getAddressPlain()
      });
    });
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

  try {
    await loadYandexMapsScript();
    initYandexMap(mapContainer);
  } catch {
    renderIframeFallback(mapContainer);
  }
}

initContactsPage();
