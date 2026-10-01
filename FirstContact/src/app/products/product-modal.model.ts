export interface ProductPower {
  Power: string[];
}


export interface ContactProduct {
  brandName: string;
  diameter?: string;
  imageFileName?: string;
  wearingSchedule?: string;
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

export interface ProductParameter {
name: string;
label: string;
values: string[];
}
 
export interface Product {
brandName: string;
baseCurve?: string[];
sphere?: string[][];
cylinder?: string[][];
axis?: string[][];
imageFileName?: string;
wearingSchedule?: string;
trialUnitCount?: number;
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

export type SlotKind = 'cell' | 'gap' | 'blank';

export interface Slot {
  kind: SlotKind;
  contact: Contact;
  empty: boolean;   // contact exists but has no data -> disabled
  text: string;     // text shown in gap slots (ColumnRowTexts / ColumnGapTexts)
}

export interface RenderRow {
  kind: 'cells' | 'gap';
  slots: Slot[];
  height: number;   // px, only used by gap rows
}

export interface ColSlot {
  kind: 'cell' | 'gap';
  cellIndex: number; // valid when kind === 'cell'
  px: number;        // valid when kind === 'gap'
}

// { outerKey: { innerKey: text } }
export type TextMap = { [outer: string]: { [inner: string]: string } };


export interface DrawerSection {
  index: number;
  header: string;
  colorClass: string;
  gridTemplate: string;
  rows: RenderRow[];
  allContacts: Contact[];
  expanded: boolean;
}

export interface FitSetRef {
  productName: string;
  fitSetName: string;
  label: string;
}


/** Mirrors CVCartItem. */
export interface CartItem {
  brand: string;
  desc: string;
  quantity: number;
  packCount: number;
  prodNum: string;
  bar1: string;
  bar2: string;
  flags: number;
  otherParameters: Record<string, string>;
  /** Legacy field; kept optional so existing code still compiles. */
  otherParams?: Record<string, string>;
}

export const CART_ITEM_NO_FLAG = 0;

export interface DialogButton {
  label: string;
  action: () => void;
}

export interface DialogState {
  title: string;
  message: string;
  buttons: DialogButton[];
}
