import { Component,Input,Output,EventEmitter,OnInit,OnDestroy,signal,computed,Inject} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

interface Contact {
  [key: string]: any;
}

// 'cell'  = a real cell position
// 'gap'   = a column-gap / text column slot
// 'blank' = a cell position with no contact (short last row)
type SlotKind = 'cell' | 'gap' | 'blank';

interface Slot {
  kind: SlotKind;
  contact: Contact;
  empty: boolean;   // contact exists but has no data -> disabled
  text: string;     // text shown in gap slots (ColumnRowTexts / ColumnGapTexts)
}

interface RenderRow {
  kind: 'cells' | 'gap';
  slots: Slot[];
  height: number;   // px, only used by gap rows
}

interface ColSlot {
  kind: 'cell' | 'gap';
  cellIndex: number; // valid when kind === 'cell'
  px: number;        // valid when kind === 'gap'
}

// { outerKey: { innerKey: text } }
type TextMap = { [outer: string]: { [inner: string]: string } };

interface DrawerSection {
  index: number;
  header: string;
  colorClass: string;
  gridTemplate: string; // CSS grid-template-columns shared by every row
  rows: RenderRow[];
  allContacts: Contact[];
  expanded: boolean;
}

interface FitSetRef {
  productName: string;
  fitSetName: string;
  label: string;
}

@Component({
  selector: 'app-fitset-drawer',
  standalone: true,
  imports: [],
  templateUrl: './fitset-drawer.html',
  styleUrl: './fitset-drawer.css'
})
export class FitsetDrawerComponent implements OnInit, OnDestroy {

  @Input() productNameInput: string = '';
  @Input() fitSetName: string = '';
  @Input() productImageUrl: string = '';

  @Output() back = new EventEmitter<void>();

  // ---------------- reactive state ----------------

  loading = signal<boolean>(true);
  errorMessage = signal<string>('');

  productFitSets = signal<FitSetRef[]>([]);
  productName = signal<string>('');
  selectedFitSetName = signal<string>('');
  selectedFitSet = signal<any>(null);

  numberOfItemsPerRow = signal<number>(3);
  trialSize = signal<any>('');

  useCompactCells = signal<boolean>(false);
  useDrawerLayout = signal<boolean>(false);

  drawers = signal<DrawerSection[]>([]);

  selectedQuantities = signal<Map<Contact, number>>(new Map());

  selectedItemCount = computed(() => {
    let total = 0;
    for (const qty of this.selectedQuantities().values()) total += qty;
    return total;
  });

  private cachedData: any = null;
  private hasInitialized = false;
  private pendingRequest: Subscription | null = null;

  
  private readonly JSON_URL = '/fitset-catalog/FitSets-GB.json';
  // private readonly JSON_URL = '/fitset-catalog/FitSets-US.json';

  // ---------------- layout constants (px) ----------------

  private readonly ROW_GAP_PX = 6;        // vertical space between normal rows
  private readonly CELL_GAP_PX = 4;       // horizontal space between tracks (matches CSS column-gap)
  private readonly GAP_UNIT_PX = 12;      // one JSON gap "unit"
  private readonly MIN_TEXT_GAP_PX = 18;  // minimum height of a row gap that holds text
  private readonly MIN_TEXT_COL_PX = 44;  // minimum width of a column that holds text
  private readonly TEXT_CHAR_PX = 7.5;    // approx width of one character of gap text
  private readonly MAX_SLOTS = 200;       // safety cap for text-only extra rows/columns

  constructor(private http: HttpClient,
   private readonly dialogRef: MatDialogRef<FitsetDrawerComponent>,
   @Inject(MAT_DIALOG_DATA) public data: { brandId: string }
  ) {}

  ngOnInit(): void {
    if (this.hasInitialized) return;
    this.hasInitialized = true;
    this.withData(data => this.initForProduct(data));
    this.productNameInput = this.data.brandId;
    this.fitSetName = '';
  }


  ngOnDestroy(): void {
    this.pendingRequest?.unsubscribe();
  }

  onBack(): void {
    this.back.emit();
  }


  private withData(action: (data: any) => void): void {
    if (this.cachedData) {
      this.loading.set(false);
      action(this.cachedData);
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');
    this.pendingRequest?.unsubscribe();

    this.pendingRequest = this.http.get<any>(this.JSON_URL).subscribe({
      next: (data) => {
        this.cachedData = data;
        action(data);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set(`Could not load ${this.JSON_URL}.`);
        this.loading.set(false);
      }
    });
  }

  private resetSelection(): void {
    this.errorMessage.set('');
    this.productName.set('');
    this.selectedFitSetName.set('');
    this.selectedFitSet.set(null);
    this.productFitSets.set([]);
    this.drawers.set([]);
    this.useDrawerLayout.set(false);
    this.selectedQuantities.set(new Map());
  }

  private showNotAvailable(name: string): void {
    this.productName.set(name);
    this.selectedFitSet.set(null);
    this.selectedFitSetName.set('');
    this.productFitSets.set([]);
    this.drawers.set([]);
    this.errorMessage.set(name ? `FitSet not available for "${name}".` : 'FitSet not available.');
  }


  private initForProduct(data: any): void {
    this.resetSelection();

    const wantedFitSet = (this.fitSetName ?? '').trim();
    const wantedProduct = (this.productNameInput ?? '').trim();

    if (wantedFitSet) {
      const owner = this.findProductOfFitSet(data, wantedFitSet);
      if (owner) {
        this.buildFitSetList(data, owner);
        this.selectFitSet(data, wantedFitSet, owner);
      } else {
        this.showNotAvailable(wantedFitSet);
      }
      return;
    }

    if (!wantedProduct) {
      this.showNotAvailable('');
      return;
    }

    const matched = this.matchProductName(data, wantedProduct);
    if (!matched) {
      this.showNotAvailable(wantedProduct);
      return;
    }

    this.buildFitSetList(data, matched);

    const first = this.productFitSets()[0];
    if (!first) {
      this.showNotAvailable(wantedProduct);
      return;
    }

    this.selectFitSet(data, first.fitSetName, matched);
  }

  private normalizeName(s: string): string {
    return String(s ?? '').toLowerCase().replace(/\s+/g, ' ').trim();
  }

  private matchProductName(data: any, displayName: string): string | null {
    if (!data || typeof data !== 'object') return null;

    const target = this.normalizeName(displayName);

    for (const pn of Object.keys(data)) {
      if (!data[pn]?.FitSets) continue;   // skips keys like "version"
      if (this.normalizeName(pn) === target) return pn;
    }

    return null;
  }

  private findProductOfFitSet(data: any, fitSetName: string): string | null {
    if (!data || typeof data !== 'object') return null;

    for (const pn of Object.keys(data)) {
      if (data[pn]?.FitSets?.[fitSetName]) return pn;
    }

    return null;
  }

  private buildFitSetList(data: any, productName: string): void {
    const fitSets = data?.[productName]?.FitSets;

    if (!fitSets || typeof fitSets !== 'object') {
      this.productFitSets.set([]);
      return;
    }

    this.productFitSets.set(
      Object.keys(fitSets).map(fsName => ({
        productName,
        fitSetName: fsName,
        label: this.extractFitSetLabel(fsName, productName)
      }))
    );
  }

  private extractFitSetLabel(fitSetName: string, productName: string): string {
    let rest = fitSetName.trim().replace(/\s*fit\s*set\s*$/i, '').trim();

    const prefix = productName.trim();
    if (prefix && rest.toLowerCase().startsWith(prefix.toLowerCase())) {
      rest = rest.slice(prefix.length).trim();
    } else {
      const m = rest.match(
        /((?:\([^)]*\)\s*)?[+-]?\d+(?:\.\d+)?(?:\s*\([^)]*\))?)\s*$/
      );
      if (m) rest = m[1].trim();
    }

    const label = rest.replace(/[()]/g, '').replace(/\s+/g, ' ').trim();

    return label || fitSetName;
  }

  selectFitSet(data: any, fitSetName: string, productName: string): void {
    const fitSet = data?.[productName]?.FitSets?.[fitSetName];

    if (!fitSet) {
      this.showNotAvailable(this.productNameInput || productName);
      return;
    }

    this.errorMessage.set('');
    this.productName.set(productName);
    this.selectedFitSetName.set(fitSetName);
    this.selectedFitSet.set(fitSet);

    const itemsPerRow = Number(this.cfg(fitSet, 'NumberOfItemsPerRow') ?? 0) || 3;
    this.numberOfItemsPerRow.set(itemsPerRow);
    this.trialSize.set(this.cfg(fitSet, 'TrialSize') ?? '');
    this.useCompactCells.set(itemsPerRow > 3);

    this.selectedQuantities.set(new Map());

    this.buildDrawers(fitSet, itemsPerRow);
  }

  changeFitSet(fitSetName: string): void {
    if (this.selectedFitSetName() === fitSetName) return;

    this.errorMessage.set('');
    this.withData(data => this.selectFitSet(data, fitSetName, this.productName()));
  }

  private cfg(fitSet: any, name: string): any {
    if (!fitSet || typeof fitSet !== 'object') return undefined;
    if (fitSet[name] !== undefined) return fitSet[name];

    const wanted = name.trim().toLowerCase();
    for (const key of Object.keys(fitSet)) {
      if (key.trim().toLowerCase() === wanted) return fitSet[key];
    }
    return undefined;
  }


  private parseGapConfig(config: any, sectionIndex: number): Map<number, number> {
    const map = new Map<number, number>();
    if (!Array.isArray(config) || config.length === 0) return map;

    const entry = config[sectionIndex] ?? config[0] ?? {};

    for (const [key, value] of Object.entries(entry)) {
      const k = Number(String(key).trim());
      const v = Number(value);
      if (!isNaN(k) && k > 0 && !isNaN(v) && v > 0) {
        map.set(k, v);
      }
    }

    return map;
  }

  // ColumnRowTexts / ColumnGapTexts
  // Format: array of objects (one per section):
  //   [{ "outerKey": { "innerKey": "text", ... }, ... }]
  //
  //   ColumnRowTexts: outerKey = ROW slot,    innerKey = COLUMN slot
  //   ColumnGapTexts: outerKey = COLUMN slot, innerKey = ROW slot
  //
  // Slots count cells AND gaps (see buildColumnSlots / buildRows).
  private parseTexts(config: any, sectionIndex: number): TextMap {
    const out: TextMap = {};
    if (!Array.isArray(config) || config.length === 0) return out;

    const entry = config[sectionIndex] ?? config[0] ?? {};

    for (const [outerKey, inner] of Object.entries(entry)) {
      if (!inner || typeof inner !== 'object') continue;

      const o = String(outerKey).trim();
      out[o] = out[o] ?? {};

      for (const [innerKey, text] of Object.entries(inner as object)) {
        out[o][String(innerKey).trim()] = String(text ?? '');
      }
    }

    return out;
  }

  // Text for the intersection of a row slot and a column slot.
  private textAt(rowSlot: number, colSlot: number, rowTexts: TextMap, colTexts: TextMap): string {
    const fromRowTexts = rowTexts[String(rowSlot)]?.[String(colSlot)];
    if (fromRowTexts !== undefined && fromRowTexts !== '') return fromRowTexts;

    return colTexts[String(colSlot)]?.[String(rowSlot)] ?? '';
  }

  private maxIntKey(keys: string[]): number {
    let max = -1;
    for (const k of keys) {
      const n = Number(k);
      if (Number.isInteger(n) && n > max) max = n;
    }
    return max;
  }

  // ============================================================
  // GRID CONSTRUCTION
  // ============================================================

  // Ordered column slots for one row.
  //   ColumnGaps {"3": 2}, 6 cells  ->  cell cell cell GAP cell cell cell
  // If any text refers to a column slot past the end, extra text-only
  // columns are added on the right (this is how key "7" in ColumnGapTexts works).
  private buildColumnSlots(itemsPerRow: number, colGapUnits: Map<number, number>, rowTexts: TextMap,colTexts: TextMap): ColSlot[] {
    const slots: ColSlot[] = [];

    const gapPx = (units: number) =>
      Math.max(0, this.ROW_GAP_PX + units * this.GAP_UNIT_PX - 2 * this.CELL_GAP_PX);

    for (let c = 0; c <= itemsPerRow; c++) {
      const units = colGapUnits.get(c);
      if (units) slots.push({ kind: 'gap', cellIndex: -1, px: gapPx(units) });
      if (c < itemsPerRow) slots.push({ kind: 'cell', cellIndex: c, px: 0 });
    }

    let maxRef = this.maxIntKey(Object.keys(colTexts));
    for (const inner of Object.values(rowTexts)) {
      maxRef = Math.max(maxRef, this.maxIntKey(Object.keys(inner)));
    }

    while (slots.length <= maxRef && slots.length < this.MAX_SLOTS) {
      slots.push({ kind: 'gap', cellIndex: -1, px: 0 });
    }

    slots.forEach((slot, i) => {
      if (slot.kind !== 'gap') return;

      const longest = this.longestTextForColumn(i, rowTexts, colTexts);
      if (longest > 0) {
        const textPx = Math.max(
          this.MIN_TEXT_COL_PX,
          Math.ceil(longest * this.TEXT_CHAR_PX) + 8
        );
        slot.px = Math.max(slot.px, textPx);
      }
    });

    return slots;
  }

  private longestTextForColumn(slotIndex: number, rowTexts: TextMap, colTexts: TextMap): number {
    let longest = 0;

    const own = colTexts[String(slotIndex)];
    if (own) {
      for (const t of Object.values(own)) longest = Math.max(longest, String(t).length);
    }

    for (const inner of Object.values(rowTexts)) {
      const t = inner[String(slotIndex)];
      if (t !== undefined) longest = Math.max(longest, String(t).length);
    }

    return longest;
  }

  // Builds every row of a section: cell rows and gap rows, in order.
  // Row slots count rows AND gap rows.
  //   RowGaps {"7":2,"12":2,"18":1}, 18 rows -> rows 0-6, GAP 7, rows 8-12, GAP 13, rows 14-19, GAP 20
  // If any text refers to a row slot past the end, extra text rows are added.
  private buildRows(
    flat: Contact[],
    itemsPerRow: number,
    colSlots: ColSlot[],
    rowGapUnits: Map<number, number>,
    rowTexts: TextMap,
    colTexts: TextMap
  ): RenderRow[] {

    const totalRows = Math.ceil(flat.length / itemsPerRow);

    type Desc =
      | { kind: 'cells'; rowIndex: number }
      | { kind: 'gap'; units: number };

    const descs: Desc[] = [];

    for (let r = 0; r <= totalRows; r++) {
      const units = rowGapUnits.get(r);
      if (units) descs.push({ kind: 'gap', units });
      if (r < totalRows) descs.push({ kind: 'cells', rowIndex: r });
    }

    // Extra text-only rows after the last slot
    let maxRef = this.maxIntKey(Object.keys(rowTexts));
    for (const inner of Object.values(colTexts)) {
      maxRef = Math.max(maxRef, this.maxIntKey(Object.keys(inner)));
    }

    while (descs.length <= maxRef && descs.length < this.MAX_SLOTS) {
      descs.push({ kind: 'gap', units: 0 });
    }

    return descs.map((d, rowSlot): RenderRow => {

      if (d.kind === 'gap') {
        const slots: Slot[] = colSlots.map((cs, colSlot): Slot => ({
          kind: cs.kind,
          contact: {},
          empty: false,
          text: this.textAt(rowSlot, colSlot, rowTexts, colTexts)
        }));

        // Total visual gap = ROW_GAP_PX + units * GAP_UNIT_PX.
        // The rows container already adds ROW_GAP_PX above and below.
        let height = Math.max(0, d.units * this.GAP_UNIT_PX - this.ROW_GAP_PX);
        if (slots.some(s => s.text !== '')) {
          height = Math.max(height, this.MIN_TEXT_GAP_PX);
        }

        return { kind: 'gap', height, slots };
      }

      const rowContacts = flat.slice(
        d.rowIndex * itemsPerRow,
        (d.rowIndex + 1) * itemsPerRow
      );

      const slots: Slot[] = colSlots.map((cs, colSlot): Slot => {

        // gap column inside a cell row -> may hold ColumnGapTexts text
        if (cs.kind === 'gap') {
          return {
            kind: 'gap',
            contact: {},
            empty: false,
            text: this.textAt(rowSlot, colSlot, rowTexts, colTexts)
          };
        }

        const contact = rowContacts[cs.cellIndex];

        // short last row -> invisible placeholder
        if (contact === undefined) {
          return { kind: 'blank', contact: {}, empty: false, text: '' };
        }

        return {
          kind: 'cell',
          contact,
          empty: this.isEmptyContact(contact),
          text: ''
        };
      });

      return { kind: 'cells', height: 0, slots };
    });
  }

  private buildDrawers(fitSet: any, itemsPerRow: number): void {
    const contacts = this.cfg(fitSet, 'Contacts');

    if (!Array.isArray(contacts)) {
      this.drawers.set([]);
      this.useDrawerLayout.set(false);
      return;
    }

    const multiDrawer = contacts.length > 1;
    this.useDrawerLayout.set(multiDrawer);

    const headersCfg = this.cfg(fitSet, 'SectionHeaders');
    const colorsCfg = this.cfg(fitSet, 'SectionHeaderColors');
    const headers: string[] = Array.isArray(headersCfg) ? headersCfg : [];
    const headerColors: string[] = Array.isArray(colorsCfg) ? colorsCfg : [];

    const rowGapsCfg = this.cfg(fitSet, 'RowGaps');
    const colGapsCfg = this.cfg(fitSet, 'ColumnGaps');
    const rowTextsCfg = this.cfg(fitSet, 'ColumnRowTexts');
    const colTextsCfg = this.cfg(fitSet, 'ColumnGapTexts');

    const built: DrawerSection[] = contacts.map((sectionContacts: any, index: number) => {

      const flat: Contact[] = (
        Array.isArray(sectionContacts) ? sectionContacts.flat(Infinity) : []
      ).map((c: any) => c ?? {}) as Contact[];

      const rowGapUnits = this.parseGapConfig(rowGapsCfg, index);
      const colGapUnits = this.parseGapConfig(colGapsCfg, index);
      const rowTexts = this.parseTexts(rowTextsCfg, index);
      const colTexts = this.parseTexts(colTextsCfg, index);

      const colSlots = this.buildColumnSlots(itemsPerRow, colGapUnits, rowTexts, colTexts);

      // Same column tracks for every row, so cells, gaps and texts line up.
      const gridTemplate = colSlots
        .map(cs => (cs.kind === 'gap' ? `${cs.px}px` : 'minmax(0, 1fr)'))
        .join(' ');

      const rows = this.buildRows(flat, itemsPerRow, colSlots, rowGapUnits, rowTexts, colTexts);

      return {
        index: index + 1,
        header: headers[index] ?? `Drawer ${index + 1}`,
        colorClass: this.getColorClass(headerColors[index]),
        gridTemplate,
        rows,
        allContacts: flat.filter(c => !this.isEmptyContact(c)),
        expanded: index === 0
      };
    });

    this.drawers.set(built);
  }

  private getColorClass(colorValue: string): string {
    switch (colorValue) {
      case '1': return 'color-a';
      case '2': return 'color-b';
      case '3': return 'color-c';
      default: return 'color-default';
    }
  }

  toggleDrawer(index: number): void {
    this.drawers.update(list =>
      list.map((d, i) => (i === index ? { ...d, expanded: !d.expanded } : d))
    );
  }

  getDrawerSelectedCount(drawer: DrawerSection): number {
    return drawer.allContacts.filter(c => this.isSelected(c)).length;
  }

  // ============================================================
  // CELL CONTENT HELPERS
  // ============================================================

  // A contact is "empty" when it is missing or every field is blank.
  isEmptyContact(contact: Contact): boolean {
    if (!contact) return true;
    return Object.values(contact).every(
      v => v === null || v === undefined || String(v).trim() === ''
    );
  }

  hasCyl(contact: Contact): boolean { return !!contact?.['Cyl']; }
  hasAxis(contact: Contact): boolean { return !!contact?.['Axis']; }

  getAdd(contact: Contact): string { return String(contact?.['Add'] ?? ''); }

  getDN(contact: Contact): string {
    if (contact?.['D'] !== undefined) return 'D';
    if (contact?.['N'] !== undefined) return 'N';
    return String(contact?.['Type'] ?? '');
  }

  getContactValue(contact: Contact, key: string): string {
    return String(contact?.[key] ?? '');
  }

  // ============================================================
  // SELECTION / QUANTITY
  // ============================================================

  isSelected(contact: Contact): boolean {
    return this.selectedQuantities().has(contact);
  }

  toggleContact(contact: Contact): void {
    // Empty cells can never be selected
    if (this.isEmptyContact(contact)) return;

    this.selectedQuantities.update(map => {
      const next = new Map(map);
      if (next.has(contact)) {
        next.delete(contact);
      } else {
        next.set(contact, 1);
      }
      return next;
    });
  }

  getQuantity(contact: Contact): number {
    return this.selectedQuantities().get(contact) ?? 0;
  }

  increaseQuantity(contact: Contact): void {
    this.selectedQuantities.update(map => {
      const next = new Map(map);
      next.set(contact, (next.get(contact) ?? 0) + 1);
      return next;
    });
  }

  decreaseQuantity(contact: Contact): void {
    this.selectedQuantities.update(map => {
      const next = new Map(map);
      const qty = next.get(contact) ?? 0;
      if (qty <= 1) {
        next.delete(contact);
      } else {
        next.set(contact, qty - 1);
      }
      return next;
    });
  }

  addTrialItemsToCart(): void {
    const selectedItems = Array.from(this.selectedQuantities().entries()).map(
      ([contact, quantity]) => ({
        product: this.productName(),
        fitSet: this.selectedFitSetName(),
        quantity,
        ...contact
      })
    );
    console.log('Selected trial items:', selectedItems);
    console.table(selectedItems);
  }

  close(): void {
    this.dialogRef.close();
  }
}