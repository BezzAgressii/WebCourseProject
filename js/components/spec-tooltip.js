const SHOW_DELAY_MS = 400;

const TOOLTIP_ARIA = {
  ru: 'Пояснение к характеристике',
  be: 'Тлумачэнне да характарыстыкі',
  en: 'Characteristic explanation'
};

const SPEC_TOOLTIPS = {
  ru: {
    maximumStaticPressure:
      'Показывает, насколько сильно установка может «продавить» воздух по воздуховодам. Чем выше значение, тем длиннее и сложнее может быть сеть каналов.',
    recuperatorType:
      'Рекуператор возвращает тепло из удаляемого воздуха приточному. Пластинчатый энтальпийный также помогает сохранять влажность, роторный обычно эффективнее по теплу.',
    recoveryEfficiency:
      'Доля тепла, которую система возвращает из вытяжного воздуха. Чем выше процент, тем меньше расходы на подогрев притока.',
    heaterPower:
      'Мощность встроенного нагревателя для догрева приточного воздуха в холодный период.',
    nominalCurrent:
      'Ток, который оборудование потребляет в штатном режиме. Важен для подбора автомата защиты и сечения кабеля.',
    maxPower:
      'Максимальная электрическая мощность, которую устройство может потреблять при пиковой нагрузке.',
    inverterTechnology:
      'Инвертор плавно регулирует мощность компрессора: точнее держит температуру, работает тише и обычно расходует меньше электроэнергии.',
    refrigerant:
      'Рабочее вещество в контуре кондиционера. От типа фреона зависят эффективность, экологичность и требования к обслуживанию.',
    coolingPower:
      'Холодопроизводительность — сколько холода кондиционер отдаёт в помещение. Это не потребление электричества.',
    heatingPower:
      'Теплопроизводительность — сколько тепла кондиционер отдаёт в режиме обогрева.',
    minimumHeatingTemp:
      'Нижний предел уличной температуры, при которой режим обогрева ещё работает стабильно.',
    minimumCoolingTemp:
      'Нижний предел уличной температуры для стабильной работы режима охлаждения.',
    maximumAirflow:
      'Объём воздуха, который установка обрабатывает за час. Влияет на скорость обновления воздуха в помещении.',
    airflow:
      'Объём воздуха, который устройство обрабатывает за час. Влияет на скорость осушения и циркуляции.',
    moistureRemoval:
      'Сколько влаги осушитель удаляет за сутки. Чем выше значение, тем быстрее снижается влажность.',
    protectionClass:
      'Степень защиты корпуса от пыли и влаги (IP). Для влажных зон важны более высокие классы защиты.',
    drainPump:
      'Автоматически откачивает конденсат, если нельзя организовать самотёчный слив.',
    chassis:
      'Наличие колёс для перемещения. Удобно, если оборудование нужно иногда передвигать.'
  },
  be: {
    maximumStaticPressure:
      'Паказвае, наколькі моцна ўстаноўка можа «прадавіць» паветра па паветраводам. Чым вышэй значэнне, тым даўжэйшай і складанейшай можа быць сетка каналаў.',
    recuperatorType:
      'Рэкуператар вяртае цяпло з выдаляемага паветра прытокаваму. Пласціністы энтальпійны таксама дапамагае захоўваць вільготнасць, ротарны звычайна эфектыўнейшы па цяпле.',
    recoveryEfficiency:
      'Доля цяпла, якую сістэма вяртае з выцяжнога паветра. Чым вышэй адсотак, тым менш затраты на падагрэў прытоку.',
    heaterPower:
      'Магутнасць убудаванага награвальніка для даграву прытокавага паветра ў халодны перыяд.',
    nominalCurrent:
      'Ток, які абсталяванне спажывае ў штатным рэжыме. Важны для падбору аўтамата абароны і сячэння кабеля.',
    maxPower:
      'Максімальная электрычная магутнасць, якую прылада можа спажываць пры пікавай нагрузцы.',
    inverterTechnology:
      'Інвертар плаўна рэгулюе магутнасць кампрэсара: дакладней трымае тэмпературу, працуе цішэй і звычайна расходвае менш электраэнергіі.',
    refrigerant:
      'Працоўны рэчыва ў контуры кандцыянера. Ад тыпу фрэону залежаць эфектыўнасць, экалагічнасць і патрабаванні да абслугоўвання.',
    coolingPower:
      'Халодапрадукцыйнасць — колькі холаду кандцыянер аддае ў памяшканне. Гэта не спажыванне электрычнасці.',
    heatingPower:
      'Цеплапрадукцыйнасць — колькі цяпла кандцыянер аддае ў рэжыме абагрэву.',
    minimumHeatingTemp:
      'Ніжні ліміт вулічнай тэмпературы, пры якой рэжым абагрэву яшчэ працуе стабільна.',
    minimumCoolingTemp:
      'Ніжні ліміт вулічнай тэмпературы для стабільнай працы рэжыму ахалоджвання.',
    maximumAirflow:
      'Аб’ём паветра, які ўстаноўка апрацоўвае за гадзіну. Уплывае на хуткасць абнаўлення паветра ў памяшканні.',
    airflow:
      'Аб’ём паветра, які прылада апрацоўвае за гадзіну. Уплывае на хуткасць асушэння і цыркуляцыі.',
    moistureRemoval:
      'Колькі вільгаці асушальнік выдаляе за суткі. Чым вышэй значэнне, тым хутчэй зніжаецца вільготнасць.',
    protectionClass:
      'Ступень абароны корпуса ад пылу і вільгаці (IP). Для вільготных зон важныя больш высокія класы абароны.',
    drainPump:
      'Аўтаматычна адпампоўвае кандэнсат, калі нельга арганізаваць самацёчны зліў.',
    chassis:
      'Наяўнасць колаў для перамяшчэння. Зручна, калі абсталяванне трэба часам перасоўваць.'
  },
  en: {
    maximumStaticPressure:
      'How strongly the unit can push air through ducts. Higher values allow longer and more complex duct networks.',
    recuperatorType:
      'A recuperator returns heat from exhaust air to supply air. An enthalpy plate type also helps retain humidity; a rotary type is usually more efficient for heat.',
    recoveryEfficiency:
      'The share of heat recovered from exhaust air. A higher percentage means lower costs to warm the supply air.',
    heaterPower:
      'Power of the built-in heater used to warm supply air in cold weather.',
    nominalCurrent:
      'Current drawn in normal operation. Important for choosing a circuit breaker and cable size.',
    maxPower:
      'Maximum electrical power the unit may consume under peak load.',
    inverterTechnology:
      'An inverter smoothly adjusts compressor power for more stable temperature, quieter operation, and usually lower energy use.',
    refrigerant:
      'The working fluid in the air-conditioner circuit. The freon type affects efficiency, environmental impact, and service requirements.',
    coolingPower:
      'Cooling capacity — how much cooling the unit delivers to the room. This is not electrical power consumption.',
    heatingPower:
      'Heating capacity — how much heat the unit delivers in heating mode.',
    minimumHeatingTemp:
      'Lowest outdoor temperature at which heating mode still works reliably.',
    minimumCoolingTemp:
      'Lowest outdoor temperature for stable cooling operation.',
    maximumAirflow:
      'Air volume processed per hour. Affects how quickly room air is refreshed.',
    airflow:
      'Air volume processed per hour. Affects dehumidification and circulation speed.',
    moistureRemoval:
      'How much moisture the dehumidifier removes per day. Higher values reduce humidity faster.',
    protectionClass:
      'Ingress protection (IP) against dust and moisture. Higher classes are important in humid areas.',
    drainPump:
      'Automatically pumps out condensate when gravity drainage is not possible.',
    chassis:
      'Wheels for moving the unit when it needs to be relocated from time to time.'
  }
};

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function prefersHover() {
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
}

function getTooltipText(key, lang = 'ru') {
  return SPEC_TOOLTIPS[lang]?.[key] || SPEC_TOOLTIPS.ru[key] || '';
}

export function hasSpecTooltip(key) {
  return Boolean(SPEC_TOOLTIPS.ru[key]);
}

export function renderSpecTooltipTrigger(key, lang = 'ru') {
  const text = getTooltipText(key, lang);

  if (!text) {
    return '';
  }

  const aria = TOOLTIP_ARIA[lang] || TOOLTIP_ARIA.ru;

  return `
    <button type="button" class="spec-tooltip" data-spec-tooltip aria-label="${escapeHtml(aria)}">
      <span class="spec-tooltip__icon" aria-hidden="true">
        <svg class="spec-tooltip__svg" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="10" cy="10" r="8.25" stroke="currentColor" stroke-width="1.5"/>
          <path d="M10 9v4.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
          <circle cx="10" cy="6.4" r="1.05" fill="currentColor"/>
        </svg>
      </span>
      <span class="spec-tooltip__bubble" role="tooltip">${escapeHtml(text)}</span>
    </button>
  `;
}

export function initSpecTooltips(root) {
  if (!root || root.dataset.specTooltipsReady === 'true') {
    return;
  }

  root.dataset.specTooltipsReady = 'true';

  let showTimer = null;
  let openTooltipEl = null;

  const openTooltip = (tooltip) => {
    if (openTooltipEl && openTooltipEl !== tooltip) {
      openTooltipEl.classList.remove('is-open');
    }

    tooltip.classList.add('is-open');
    openTooltipEl = tooltip;
  };

  const closeTooltip = (tooltip) => {
    tooltip?.classList.remove('is-open');

    if (openTooltipEl === tooltip) {
      openTooltipEl = null;
    }
  };

  const closeAll = () => {
    window.clearTimeout(showTimer);
    showTimer = null;

    if (openTooltipEl) {
      closeTooltip(openTooltipEl);
    }
  };

  root.addEventListener('mouseover', (event) => {
    if (!prefersHover()) {
      return;
    }

    const tooltip = event.target.closest('.spec-tooltip');

    if (!tooltip || !root.contains(tooltip)) {
      return;
    }

    if (event.relatedTarget && tooltip.contains(event.relatedTarget)) {
      return;
    }

    if (openTooltipEl === tooltip) {
      return;
    }

    window.clearTimeout(showTimer);
    showTimer = window.setTimeout(() => openTooltip(tooltip), SHOW_DELAY_MS);
  });

  root.addEventListener('mouseout', (event) => {
    if (!prefersHover()) {
      return;
    }

    const tooltip = event.target.closest('.spec-tooltip');

    if (!tooltip || !root.contains(tooltip)) {
      return;
    }

    if (tooltip.contains(event.relatedTarget)) {
      return;
    }

    window.clearTimeout(showTimer);
    showTimer = null;
    closeTooltip(tooltip);
  });

  root.addEventListener('click', (event) => {
    const tooltip = event.target.closest('.spec-tooltip');

    if (tooltip && root.contains(tooltip)) {
      event.preventDefault();
      event.stopPropagation();

      if (openTooltipEl === tooltip) {
        closeTooltip(tooltip);
      } else {
        window.clearTimeout(showTimer);
        openTooltip(tooltip);
      }

      return;
    }

    closeAll();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeAll();
    }
  });
}
