export const UNIT_LABEL = {
  KILOGRAM: 'KG',
  GRAM: 'G',
  LITER: 'L',
  MILLILITER: 'ML',
  NOS: 'NOS',
  BUNDLE: 'BUNDLE',
  PACKET: 'PACKET',
};

const WEIGHT_UNITS = ['KILOGRAM', 'GRAM'];
const VOLUME_UNITS = ['LITER', 'MILLILITER'];

// Count units: sold by count (1.5 NOS, 2 BUNDLE, 2.5 PACKET), never converted to another unit
export const COUNT_UNITS = ['NOS', 'BUNDLE', 'PACKET'];
export const isCountUnit = (unit) => COUNT_UNITS.includes(unit);

// Product categories and the packing units each one may use (same rules as the backend)
export const CATEGORY_OPTIONS = [
  { value: 'SOLID', label: 'Solid' },
  { value: 'LIQUID', label: 'Liquid' },
  { value: 'NOS', label: 'NOS (Numbers)' },
  { value: 'BUNDLE', label: 'Bundle' },
  { value: 'PACKET', label: 'Packet' },
];

export const CATEGORY_UNITS = {
  SOLID: WEIGHT_UNITS,
  LIQUID: VOLUME_UNITS,
  NOS: ['NOS'],
  BUNDLE: ['BUNDLE'],
  PACKET: ['PACKET'],
};

// Units a quantity can be entered in for a product / packing
export const unitsFor = (category, currentUnit) => {
  if (isCountUnit(currentUnit)) return [currentUnit];
  if (CATEGORY_UNITS[category]) return CATEGORY_UNITS[category];
  if (WEIGHT_UNITS.includes(currentUnit)) return WEIGHT_UNITS;
  if (VOLUME_UNITS.includes(currentUnit)) return VOLUME_UNITS;
  return [...WEIGHT_UNITS, ...VOLUME_UNITS];
};

// What one packing is called: bags (solid), bottles (liquid), packs (count units)
export const containerLabel = (packingUnit) => {
  if (VOLUME_UNITS.includes(packingUnit)) return 'bottles';
  if (isCountUnit(packingUnit)) return 'packs';
  return 'bags';
};

// Convert between KG/G and L/ML; other combinations (incl. count units) are returned unchanged
export const convertUnit = (value, fromUnit, toUnit) => {
  const qty = parseFloat(value) || 0;
  if (!fromUnit || !toUnit || fromUnit === toUnit) return qty;
  if ((fromUnit === 'GRAM' && toUnit === 'KILOGRAM') || (fromUnit === 'MILLILITER' && toUnit === 'LITER')) return qty / 1000;
  if ((fromUnit === 'KILOGRAM' && toUnit === 'GRAM') || (fromUnit === 'LITER' && toUnit === 'MILLILITER')) return qty * 1000;
  return qty;
};

// All quantities use max 3 decimal places (fixes values like 0.30000000000000027)
export const round3 = (value) => {
  const number = Number(value);
  if (value === null || value === undefined || value === '' || Number.isNaN(number)) return 0;
  return Math.round((number + Number.EPSILON) * 1000) / 1000;
};

export const formatQuantity = (quantity, unit) =>
  `${round3(quantity)} ${UNIT_LABEL[unit] || unit || ''}`.trim();
