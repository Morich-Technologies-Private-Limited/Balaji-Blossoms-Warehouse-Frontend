export const UNIT_LABEL = {
  KILOGRAM: 'KG',
  GRAM: 'G',
  LITER: 'L',
  MILLILITER: 'ML',
  NOS: 'NOS',
  BUNDLE: 'BUNDLE',
  PACKET: 'PACKET',
  BOX: 'BOX',
};

const WEIGHT_UNITS = ['KILOGRAM', 'GRAM'];
const VOLUME_UNITS = ['LITER', 'MILLILITER'];

// Count units: sold by count (1.5 NOS, 2 BUNDLE, 2.5 PACKET, 2.5 BOX), never converted to another unit
export const COUNT_UNITS = ['NOS', 'BUNDLE', 'PACKET', 'BOX'];
export const isCountUnit = (unit) => COUNT_UNITS.includes(unit);

// NOS: only one packing, always size 1.
// BUNDLE / PACKET / BOX: several packings allowed. Packing size = pieces in one packet (25 PACKET = 25 pens).
export const SINGLE_PACKING_UNITS = ['NOS'];
export const hasSinglePacking = (unit) => SINGLE_PACKING_UNITS.includes(unit);

/*
 * Count units have nothing to do with KG / G / L / ML. Their stock is kept in PACKETS (not pieces):
 *   - packets entered directly: 2.5 packets          -> 2.5 PACKET
 *   - loose pieces (direct quantity): 20 pens of a 25 packet -> 20 / 25 = 0.8 PACKET (0.2 left)
 * KG / L stock is the opposite: bags x packing size.
 */
export const PIECES_LABEL = 'PCS';

// loose pieces only exist when one packet holds more than one piece
export const hasLoosePieces = (packingUnit, packingSize) => isCountUnit(packingUnit) && Number(packingSize) > 1;

// bags / bottles / packets -> stock quantity
export const packsToStock = (packs, packingUnit, packingSize) =>
  (isCountUnit(packingUnit) ? Number(packs) || 0 : (Number(packs) || 0) * Number(packingSize));

// stock quantity -> bags / bottles / packets
export const stockToPacks = (quantity, packingUnit, packingSize) =>
  (isCountUnit(packingUnit) || !Number(packingSize) ? Number(quantity) || 0 : (Number(quantity) || 0) / Number(packingSize));

// loose pieces of a count unit -> stock quantity (in packets)
export const piecesToStock = (pieces, packingSize) => (Number(pieces) || 0) / (Number(packingSize) || 1);

// Product categories and the packing units each one may use (same rules as the backend)
export const CATEGORY_OPTIONS = [
  { value: 'SOLID', label: 'Solid' },
  { value: 'LIQUID', label: 'Liquid' },
  { value: 'NOS', label: 'NOS (Numbers)' },
  { value: 'BUNDLE', label: 'Bundle' },
  { value: 'PACKET', label: 'Packet' },
  { value: 'BOX', label: 'Box' },
];

export const CATEGORY_UNITS = {
  SOLID: WEIGHT_UNITS,
  LIQUID: VOLUME_UNITS,
  NOS: ['NOS'],
  BUNDLE: ['BUNDLE'],
  PACKET: ['PACKET'],
  BOX: ['BOX'],
};

// Units a quantity can be entered in for a product / packing
export const unitsFor = (category, currentUnit) => {
  if (isCountUnit(currentUnit)) return [currentUnit];
  if (CATEGORY_UNITS[category]) return CATEGORY_UNITS[category];
  if (WEIGHT_UNITS.includes(currentUnit)) return WEIGHT_UNITS;
  if (VOLUME_UNITS.includes(currentUnit)) return VOLUME_UNITS;
  return [...WEIGHT_UNITS, ...VOLUME_UNITS];
};

// What one packing is called: bags (solid), bottles (liquid), or the count unit itself (packets, bundles ...)
const PACK_NAMES = { NOS: 'Nos', BUNDLE: 'Bundles', PACKET: 'Packets', BOX: 'Boxes' };
export const packName = (packingUnit) => {
  if (isCountUnit(packingUnit)) return PACK_NAMES[packingUnit];
  return VOLUME_UNITS.includes(packingUnit) ? 'Bottles' : 'Bags';
};
export const containerLabel = (packingUnit) => packName(packingUnit).toLowerCase();

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
