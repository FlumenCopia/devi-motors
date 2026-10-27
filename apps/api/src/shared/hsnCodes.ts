import { LineItem } from './types';
import { roundToTwoDecimals } from './calculations';

export interface HsnCodeItem {
  code: string;
  category: 'service' | 'goods';
  type?: string;
  isPrimary?: boolean;
  title: string;
  shortLabel: string;
  label?: string;
  description: string;
  defaultGstRate: number; // e.g. 18 or 28
}

/**
 * Common GST HSN & SAC codes for Automotive Body Repair, Painting, Detailing & Spare Parts
 */
export const AUTOMOTIVE_HSN_CODES: HsnCodeItem[] = [
  {
    code: '998714',
    category: 'service',
    type: 'Service',
    isPrimary: true,
    title: 'Maintenance & Repair Services of Motor Vehicles',
    shortLabel: 'SAC 998714 — Maintenance & Repair / Painting / Polishing',
    label: 'Maintenance & Repair / Painting / Polishing',
    description: 'Car body repair, denting, painting, mirror polishing, detailing & general maintenance services',
    defaultGstRate: 18
  },
  {
    code: '8708',
    category: 'goods',
    type: 'Goods',
    isPrimary: true,
    title: 'Parts & Accessories of Motor Vehicles',
    shortLabel: 'HSN 8708 — Motor Vehicle Parts & Accessories',
    label: 'Motor Vehicle Parts & Accessories (Spare Parts)',
    description: 'Automotive replacement spare parts, body panels, bumpers, mirrors, grills & mechanical components',
    defaultGstRate: 18
  },
  {
    code: '8512',
    category: 'goods',
    type: 'Goods',
    isPrimary: false,
    title: 'Electrical Lighting or Signaling Equipment',
    shortLabel: 'HSN 8512 — Headlights, Tail Lamps & Lighting Equipment',
    label: 'Headlights, Tail Lamps & Lighting Equipment',
    description: 'Headlamp units, tail lights, fog lamps, indicators, horn & automotive electrical equipment',
    defaultGstRate: 18
  },
  {
    code: '3208',
    category: 'goods',
    type: 'Goods',
    isPrimary: false,
    title: 'Paints, Enamels & Varnishes',
    shortLabel: 'HSN 3208 — Automotive Paints, Clear Coats & Thinners',
    label: 'Automotive Paints, Clear Coats & Thinners',
    description: 'Paints, base coats, 2K clear coats, primers, lacquers & paint thinners for bodywork',
    defaultGstRate: 18
  },
  {
    code: '3405',
    category: 'goods',
    type: 'Goods',
    isPrimary: false,
    title: 'Polishes, Creams & Detailing Compounds',
    shortLabel: 'HSN 3405 — Rubbing Compounds, Wax & Detailing Products',
    label: 'Rubbing Compounds, Wax & Detailing Products',
    description: 'Polishing paste, rubbing compound, ceramic coating, carnauba wax & detailing glaze',
    defaultGstRate: 18
  },
  {
    code: '998719',
    category: 'service',
    type: 'Service',
    isPrimary: false,
    title: 'Other Maintenance & Repair Services',
    shortLabel: 'SAC 998719 — Other Motor Vehicle Services & Inspections',
    label: 'Other Motor Vehicle Services & Inspections',
    description: 'Chassis alignment, specialized detailing, interior deep cleaning & inspection',
    defaultGstRate: 18
  }
];

export const STANDARD_GST_RATES = [
  { rate: 0, label: '0% (Exempt / Tax Free / Nil-Rated)' },
  { rate: 5, label: '5% (Concessional)' },
  { rate: 12, label: '12% (Standard Low)' },
  { rate: 18, label: '18% (Standard Rate)' },
  { rate: 28, label: '28% (Luxury / Specific Auto Goods)' }
];

export function findHsnCode(code?: string): HsnCodeItem | undefined {
  if (!code) return undefined;
  const clean = code.trim();
  return AUTOMOTIVE_HSN_CODES.find((item) => item.code === clean);
}

export function formatHsnDisplay(code?: string): string {
  if (!code) return '998714';
  const found = findHsnCode(code);
  if (found) {
    return `${found.code} (${found.category === 'service' ? 'Service' : 'Parts'})`;
  }
  return code;
}

