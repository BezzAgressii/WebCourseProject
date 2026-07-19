import FILTER_CONFIG from './filter-config.js';

export const SUBCATEGORIES = {
  ventilation: [
    { value: 'supply-exhaust', label: 'Приточно-вытяжные установки' },
    { value: 'high-filtration', label: 'Системы высокой фильтрации' },
    { value: 'humidifiers', label: 'Увлажнители' }
  ],
  conditioning: [
    { value: 'nastennye', label: 'Настенные' },
    { value: 'kanalnye', label: 'Канальные' },
    { value: 'kassetnye', label: 'Кассетные' }
  ],
  pools: [
    { value: 'osushiteli', label: 'Осушители' }
  ]
};

export const CATEGORY_LABELS = {
  ventilation: 'Вентиляция',
  conditioning: 'Кондиционирование',
  pools: 'Бассейны'
};

export const INSTALL_TYPE_BY_SUBCATEGORY = {
  nastennye: 'wall',
  kanalnye: 'duct',
  kassetnye: 'cassette'
};

export const SUBCATEGORY_BY_INSTALL_TYPE = {
  wall: 'nastennye',
  duct: 'kanalnye',
  cassette: 'kassetnye'
};

const FIELD_LABELS = {
  price: 'Цена',
  performance: 'Производительность, м³/ч',
  area: 'Площадь, м²',
  maxPower: 'Макс. мощность, кВт',
  equipmentType: 'Тип оборудования',
  winterTemp: 'Зимняя температура, °C',
  heaterType: 'Тип нагревателя',
  recuperatorType: 'Тип рекуператора',
  powerType: 'Напряжение, В',
  bodyMaterial: 'Материал корпуса',
  brand: 'Бренд',
  installType: 'Тип установки',
  isInverter: 'Инвертор',
  color: 'Цвет',
  hasWifi: 'Wi-Fi',
  hasSmartHome: 'Умный дом',
  coolingPower: 'Мощность охлаждения, кВт',
  heatingPower: 'Мощность обогрева, кВт',
  heatingTemp: 'Работа на обогрев до, °C',
  moistureRemoval: 'Влагоудаление, л/сут',
  mountType: 'Тип монтажа',
  hasChassis: 'Шасси',
  roomVolume: 'Объём помещения, м³',
  hasDrainPump: 'Дренажный насос',
  noiseLevel: 'Уровень шума, дБ',
  inStock: 'В наличии'
};

const OPTION_LABELS = {
  compact: 'Компактная',
  central: 'Центральная',
  '-25': '−25 °C',
  '-32': '−32 °C',
  '-35': '−35 °C',
  '-45': '−45 °C',
  electric: 'Электрический',
  liquid: 'Водяной',
  plate: 'Пластинчатый',
  rotary: 'Роторный',
  '220': '220 В',
  '380': '380 В',
  'galvanized-steel': 'Оцинкованная сталь',
  polypropylene: 'Полипропилен',
  wall: 'Настенный',
  duct: 'Канальный',
  cassette: 'Кассетный',
  floor: 'Напольный',
  white: 'Белый',
  'matte-white': 'Матовый белый',
  'graphite-black': 'Графитовый чёрный',
  gold: 'Золотой',
  true: 'Да',
  false: 'Нет'
};

const SKIP_IN_ATTRS = new Set(['price', 'inStock', 'brand']);

const NUMBER_FIELDS = new Set([
  'price',
  'performance',
  'area',
  'maxPower',
  'winterTemp',
  'coolingPower',
  'heatingPower',
  'heatingTemp',
  'moistureRemoval',
  'roomVolume',
  'noiseLevel'
]);

const BOOLEAN_FIELDS = new Set([
  'inStock',
  'isInverter',
  'hasWifi',
  'hasSmartHome',
  'hasChassis',
  'hasDrainPump'
]);

function resolveConfigKey(category, subcategory) {
  if (!category) {
    return '';
  }

  if (category === 'conditioning') {
    return 'conditioning_all';
  }

  if (category === 'pools') {
    return 'pools_osushiteli';
  }

  if (!subcategory) {
    return '';
  }

  return `${category}_${subcategory}`;
}

function optionLabel(option) {
  if (option.label) {
    return option.label;
  }

  return OPTION_LABELS[option.value] || FIELD_LABELS[option.value] || String(option.value);
}

function fieldLabel(field, fallbackKey) {
  return FIELD_LABELS[field] || fallbackKey || field;
}

function isYesNoOptions(options) {
  if (!Array.isArray(options) || !options.length) {
    return false;
  }

  return options.every((option) => {
    const value = String(option.value);
    return value === 'true' || value === 'false';
  });
}

function normalizeFilterToAdminField(filter) {
  if (!filter?.field || SKIP_IN_ATTRS.has(filter.field)) {
    return null;
  }

  const base = {
    field: filter.field,
    label: fieldLabel(filter.field, filter.labelKey)
  };

  if (Array.isArray(filter.options) && filter.options.length) {
    if (isYesNoOptions(filter.options) || BOOLEAN_FIELDS.has(filter.field)) {
      return {
        ...base,
        input: 'boolean'
      };
    }

    return {
      ...base,
      input: 'select',
      options: filter.options.map((option) => ({
        value: String(option.value),
        label: optionLabel(option)
      }))
    };
  }

  if (filter.type === 'boolean' || BOOLEAN_FIELDS.has(filter.field)) {
    return {
      ...base,
      input: 'boolean'
    };
  }

  if (filter.type === 'range' || NUMBER_FIELDS.has(filter.field)) {
    return {
      ...base,
      input: 'number',
      min: filter.min,
      max: filter.max,
      step: filter.step ?? (NUMBER_FIELDS.has(filter.field) ? 0.1 : 1)
    };
  }

  return {
    ...base,
    input: 'text'
  };
}

function extraFieldsForCategory(category) {
  if (category === 'pools') {
    return [
      {
        field: 'roomVolume',
        label: FIELD_LABELS.roomVolume,
        input: 'number',
        min: 0,
        step: 1
      },
      {
        field: 'hasDrainPump',
        label: FIELD_LABELS.hasDrainPump,
        input: 'boolean'
      },
      {
        field: 'noiseLevel',
        label: FIELD_LABELS.noiseLevel,
        input: 'number',
        min: 0,
        step: 1
      }
    ];
  }

  return [];
}

/**
 * Dynamic attribute fields for admin product form by category + subcategory.
 */
export function getAdminAttributeFields(category, subcategory) {
  const key = resolveConfigKey(category, subcategory);
  const filters = FILTER_CONFIG[key] || [];
  const fromConfig = filters
    .map(normalizeFilterToAdminField)
    .filter(Boolean);

  const extras = extraFieldsForCategory(category);
  const seen = new Set(fromConfig.map((item) => item.field));

  extras.forEach((field) => {
    if (!seen.has(field.field)) {
      fromConfig.push(field);
    }
  });

  return fromConfig;
}

export function coerceAttrValue(field, rawValue) {
  if (rawValue === '' || rawValue == null) {
    return null;
  }

  if (BOOLEAN_FIELDS.has(field)) {
    if (rawValue === true || rawValue === 'true') {
      return true;
    }
    if (rawValue === false || rawValue === 'false') {
      return false;
    }
    return Boolean(rawValue);
  }

  if (NUMBER_FIELDS.has(field)) {
    const number = Number(rawValue);
    return Number.isFinite(number) ? number : null;
  }

  return String(rawValue);
}

export function formatAttrValueForInput(field, value) {
  if (value == null || value === '') {
    return '';
  }

  if (BOOLEAN_FIELDS.has(field)) {
    return value === true || value === 'true' ? 'true' : 'false';
  }

  if (field === 'winterTemp') {
    return String(value);
  }

  return String(value);
}

export { FIELD_LABELS, OPTION_LABELS, NUMBER_FIELDS, BOOLEAN_FIELDS };
