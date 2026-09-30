export interface ProductPower {
  Power: string[];
}

export interface Product {
  ProductParameters: any;
  'brandId': string;
  'brandDescription': string;
  'trialBrandId': string;
  'trialBrandDescription': string;
  'Image': string;
}

export interface ContactProduct {
  brandName: string;
  diameter?: string;
  imageFileName?: string;
  wearingSchedule?: string;
  parameters: ProductParameter[];
}

const toArray = <T>(v: T | T[] | undefined | null): T[] =>
  v == null ? [] : Array.isArray(v) ? v : [v];

export function parseProducts(json: any): ContactProduct[] {
  const dicts = toArray<any>(json?.data?.array?.dict);

  return dicts.map((d) => {
    const strings = toArray<string>(d.string);

    const imageFileName = strings.find((s) => /\.(jpe?g|png|webp)$/i.test(s));
    const diameter = strings.find((s, i) => i > 0 && /^\d+(\.\d+)?$/.test(s));
    const rest = strings.filter(
      (s, i) => i > 0 && s !== imageFileName && s !== diameter
    );

    // Each array item is either { string: [...] } or { array: { string: [...] } }
    const parameters: ProductParameter[] = toArray<any>(d.array)
      .map((item) => toArray<string>((item.array ?? item).string))
      .filter((list) => list.length > 1)
      .map(([label, ...values]) => ({ name: label, label, values }));

    return {
      brandName: strings[0],
      diameter,
      imageFileName,
      wearingSchedule: rest[rest.length - 1],
      parameters,
    };
  });
}
export interface ProductResponse {
  itemId: string;
  name: string;
  displayName: string;
  manufacturerName: string;
  modality: string;
  packSize: number;
  distributor: string[];
  status: string;
  buyingProduct: string;
  buyingProductCode: string;
  trial: boolean;
  trialReference: string | null;
  privateLabel: boolean;
  metadata: ProductMetadata;
  active: boolean;
  imageName: string;
  type: string;
  isSpeciality: boolean;
  hasProducts: boolean;
  deleted: boolean;
  sub_Item: string | null;
  sortOrder: number;
  multiplierQty: number | null;
  trialMultiplierQty: number | null;
  promotionsCount: number | null;
  seriesType: string;

  imagePath: ProductImagePath;

  parameters: ProductParameter;

  isFavourite: boolean;

  brandName: string;
  brandImageName: string;
  familyName: string | null;
  familyImageName: string | null;
  brandAlias: string | null;

  baseCurve: number | null;
  diameter: number | null;
  power: number | null;
  addPower: number | null;
  powerType: string | null;
  zone: number | null;
  sag: number | null;
  axis: number | null;
  baseAxis: number | null;
  color: string | null;
  addition: number | null;
  ct: number | null;
  cylinder: number | null;
  flex3Option: string | null;
  lcz: number | null;
  lczFlat: number | null;
  lczSteep: number | null;
  pccz: number | null;
  shmfvProfile: string | null;
  skirt: number | null;
  design: string | null;
  slz: number | null;
  rzd1: number | null;
  lza1: number | null;
  lza2: number | null;
  rzd2: number | null;
  lza: number | null;
  rzd: number | null;
  icdff_lczsteep: number | null;
  bc2: number | null;
  d2: number | null;
  d3: number | null;
  d4: number | null;
  dt: number | null;
  r2: number | null;
  r3: number | null;
  r4: number | null;
  r5: number | null;
  edgeLift: number | null;
  material: string | null;
  oz: number | null;
  pefa: number | null;

  id: string;
  createdAt: string;
  updatedAt: string | null;
  _etag: string | null;
  createdBy: string | null;
  updatedBy: string | null;
}

export interface ProductMetadata {
  EDIName: string;
}

export interface ProductImagePath {
  small: string | null;
  medium: string | null;
  large: string | null;
}
export interface ProductParameter {
  name: string;
  values: (string | number)[];
  label?: string;
}

export interface Contact {
  [key: string]: any;
}

export interface CellGroup {
  cells: Contact[];
  gapAfter: number; // extra px gap after this group (from ColumnGaps)
}

export interface CellRow {
  groups: CellGroup[];
  gapBelow: number; // total bottom gap for this row in px (base + extra from RowGaps)
}

export interface DrawerSection {
  index: number;
  header: string;
  colorClass: string;
  cellRows: CellRow[];
  allContacts: Contact[];
  expanded: boolean;
}

export interface FitSetRef {
  productName: string;
  fitSetName: string;
  label: string;
}
