const VENTILATION_COMMON = [
  { type: 'range', field: 'price', labelKey: 'category.price', min: 0, max: 15000, step: 100 },
  { type: 'range', field: 'performance', labelKey: 'category.performance', min: 0, max: 2000, step: 50 },
  { type: 'range', field: 'area', labelKey: 'category.area', min: 0, max: 250, step: 5 },
  {
    type: 'checkbox',
    field: 'equipmentType',
    labelKey: 'category.equipmentType',
    options: [
      { value: 'compact', labelKey: 'category.equipment.compact' },
      { value: 'central', labelKey: 'category.equipment.central' }
    ]
  },
  {
    type: 'checkbox',
    field: 'winterTemp',
    labelKey: 'category.winterTemp',
    options: [
      { value: '-25', labelKey: 'category.winter.-25' },
      { value: '-32', labelKey: 'category.winter.-32' },
      { value: '-35', labelKey: 'category.winter.-35' },
      { value: '-45', labelKey: 'category.winter.-45' }
    ]
  },
  {
    type: 'radio',
    field: 'heaterType',
    labelKey: 'category.heaterType',
    options: [
      { value: 'electric', labelKey: 'category.heater.electric' },
      { value: 'liquid', labelKey: 'category.heater.liquid' }
    ]
  },
  { type: 'range', field: 'maxPower', labelKey: 'category.maxPower', min: 0, max: 10, step: 0.1 },
  {
    type: 'checkbox',
    field: 'powerType',
    labelKey: 'category.powerType',
    style: 'pills',
    options: [
      { value: '220', labelKey: 'category.voltage.220' },
      { value: '380', labelKey: 'category.voltage.380' }
    ]
  },
  {
    type: 'checkbox',
    field: 'bodyMaterial',
    labelKey: 'category.bodyMaterial',
    options: [
      { value: 'galvanized-steel', labelKey: 'category.body.galvanizedSteel' },
      { value: 'polypropylene', labelKey: 'category.body.polypropylene' }
    ]
  },
  { type: 'boolean', field: 'inStock', labelKey: 'category.inStockOnly' }
];

const VENTILATION_RECUPERATOR = {
  type: 'radio',
  field: 'recuperatorType',
  labelKey: 'category.recuperatorType',
  options: [
    { value: 'plate', labelKey: 'category.recuperator.plate' },
    { value: 'rotary', labelKey: 'category.recuperator.rotary' }
  ]
};

const FILTER_CONFIG = {
  ventilation_all: [...VENTILATION_COMMON],
  ventilation_supply: [...VENTILATION_COMMON],
  ventilation_exhaust: [...VENTILATION_COMMON],
  'ventilation_supply-exhaust': [
    ...VENTILATION_COMMON.slice(0, 6),
    VENTILATION_RECUPERATOR,
    ...VENTILATION_COMMON.slice(6)
  ],
  conditioning_all: [
    { type: 'range', field: 'price', labelKey: 'category.price', min: 0, max: 15000, step: 100 },
    {
      type: 'checkbox',
      field: 'brand',
      labelKey: 'category.brand',
      style: 'brands',
      options: [
        { value: 'AUX', label: 'AUX' },
        { value: 'Ballu', label: 'Ballu' },
        { value: 'Breeon', label: 'Breeon' },
        { value: 'Chigo', label: 'Chigo' },
        { value: 'Dahatsu', label: 'Dahatsu' },
        { value: 'Daichi', label: 'Daichi' },
        { value: 'Denko', label: 'Denko' }
      ]
    },
    {
      type: 'radio',
      field: 'installType',
      labelKey: 'category.installType',
      options: [
        { value: 'wall', labelKey: 'category.install.wall' },
        { value: 'duct', labelKey: 'category.install.duct' },
        { value: 'cassette', labelKey: 'category.install.cassette' }
      ]
    },
    {
      type: 'checkbox',
      field: 'isInverter',
      labelKey: 'category.inverter',
      style: 'pills',
      options: [
        { value: 'true', labelKey: 'category.yes' },
        { value: 'false', labelKey: 'category.no' }
      ]
    },
    { type: 'range', field: 'area', labelKey: 'category.area', min: 0, max: 200, step: 5 },
    {
      type: 'checkbox',
      field: 'color',
      labelKey: 'category.color',
      options: [
        { value: 'white', labelKey: 'category.color.white' },
        { value: 'matte-white', labelKey: 'category.color.matteWhite' },
        { value: 'graphite-black', labelKey: 'category.color.graphiteBlack' },
        { value: 'gold', labelKey: 'category.color.gold' }
      ]
    },
    {
      type: 'checkbox',
      field: 'hasWifi',
      labelKey: 'category.wifi',
      style: 'pills',
      options: [
        { value: 'true', labelKey: 'category.yes' },
        { value: 'false', labelKey: 'category.no' }
      ]
    },
    {
      type: 'checkbox',
      field: 'hasSmartHome',
      labelKey: 'category.smartHome',
      style: 'pills',
      options: [
        { value: 'true', labelKey: 'category.yes' },
        { value: 'false', labelKey: 'category.no' }
      ]
    },
    { type: 'range', field: 'coolingPower', labelKey: 'category.coolingPower', min: 0, max: 15, step: 0.1 },
    { type: 'range', field: 'heatingPower', labelKey: 'category.heatingPower', min: 0, max: 15, step: 0.1 },
    { type: 'range', field: 'heatingTemp', labelKey: 'category.heatingTemp', min: -35, max: 20, step: 1 },
    { type: 'boolean', field: 'inStock', labelKey: 'category.inStockOnly' }
  ],
  pools_osushiteli: [
    { type: 'range', field: 'price', labelKey: 'category.price', min: 0, max: 15000, step: 100 },
    {
      type: 'checkbox',
      field: 'brand',
      labelKey: 'category.brand',
      options: [
        { value: 'PoolDry', label: 'PoolDry' },
        { value: 'AquaVent', label: 'AquaVent' }
      ]
    },
    { type: 'range', field: 'moistureRemoval', labelKey: 'category.moistureRemoval', min: 0, max: 250, step: 5 },
    {
      type: 'checkbox',
      field: 'powerType',
      labelKey: 'category.voltage',
      style: 'pills',
      options: [
        { value: '220', labelKey: 'category.voltage.220' },
        { value: '380', labelKey: 'category.voltage.380' }
      ]
    },
    {
      type: 'checkbox',
      field: 'mountType',
      labelKey: 'category.mountType',
      options: [
        { value: 'floor', labelKey: 'category.mount.floor' },
        { value: 'wall', labelKey: 'category.mount.wall' },
        { value: 'duct', labelKey: 'category.mount.duct' }
      ]
    },
    {
      type: 'checkbox',
      field: 'hasChassis',
      labelKey: 'category.chassis',
      style: 'pills',
      options: [
        { value: 'true', labelKey: 'category.yes' },
        { value: 'false', labelKey: 'category.no' }
      ]
    },
    { type: 'boolean', field: 'inStock', labelKey: 'category.inStockOnly' }
  ]
};

export default FILTER_CONFIG;
