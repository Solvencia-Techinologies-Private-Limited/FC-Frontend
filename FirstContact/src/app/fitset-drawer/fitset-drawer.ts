import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  signal,
  computed
} from '@angular/core';

import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';

interface Contact {
  [key: string]: any;
}

interface CellGroup {
  cells: Contact[];
  gapAfter: number; // extra px gap after this group (from ColumnGaps)
}

interface CellRow {
  groups: CellGroup[];
  gapBelow: number; // total bottom gap for this row in px (base + extra from RowGaps)
}

interface DrawerSection {
  index: number;
  header: string;
  colorClass: string;
  cellRows: CellRow[];
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
export class FitsetDrawerComponent implements OnInit, OnDestroy, OnChanges {

  @Input() productNameInput: string = '';
  @Input() fitSetName: string = '';
  @Input() productImageUrl: string = '';

  @Output() back = new EventEmitter<void>();

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
  cylValues = signal<string[]>([]);
  selectedCyl = signal<string>('');

  selectedQuantities = signal<Map<Contact, number>>(new Map());

  selectedItemCount = computed(() => {
    let total = 0;
    for (const qty of this.selectedQuantities().values()) total += qty;
    return total;
  });

  private cachedData: any = null;
  private hasInitialized = false;
  private pendingRequest: Subscription | null = null;

  // Base gap between cells in px
  private readonly BASE_GAP_PX = 6;
  // Each gap unit from JSON = this many extra px
  private readonly GAP_UNIT_PX = 12;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    if (this.hasInitialized) return;
    this.hasInitialized = true;
    this.loadFitSets();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      this.hasInitialized &&
      changes['productNameInput'] &&
      !changes['productNameInput'].firstChange &&
      this.cachedData
    ) {
      this.buildFitSetList(this.cachedData);
      this.applyInitialSelection(this.cachedData);
    }
  }

  ngOnDestroy(): void {
    this.pendingRequest?.unsubscribe();
  }

  onBack(): void { this.back.emit(); }

  loadFitSets(): void {
    if (this.cachedData) {
      this.buildFitSetList(this.cachedData);
      this.applyInitialSelection(this.cachedData);
      return;
    }
    this.loading.set(true);
    this.errorMessage.set('');
    this.pendingRequest?.unsubscribe();
    this.pendingRequest = this.http.get<any>('/fitset-catalog/FitSets-GB.json').subscribe({
      next: (data) => {
        this.cachedData = data;
        this.buildFitSetList(data);
        this.applyInitialSelection(data);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('Could not load FitSets-GB.json.');
        this.loading.set(false);
      }
    });
  }

  private applyInitialSelection(data: any): void {
    let initialFitSet = this.fitSetName;
    let matchedProduct = '';
    if (!initialFitSet && this.productNameInput) {
      const matched = this.matchProductName(data, this.productNameInput);
      if (matched) {
        matchedProduct = matched;
        const keys = Object.keys(data[matched]?.FitSets ?? {});
        if (keys.length > 0) initialFitSet = keys[0];
      } else {
        this.errorMessage.set(`No FitSet data found for "${this.productNameInput}".`);
      }
    }
    if (!initialFitSet) {
      const list = this.productFitSets();
      if (list.length > 0) initialFitSet = list[0].fitSetName;
    }
    this.selectFitSet(data, initialFitSet, matchedProduct);
  }

  private matchProductName(data: any, displayName: string): string | null {
    if (!data || typeof data !== 'object') return null;
    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
    const target = normalize(displayName);
    for (const pn of Object.keys(data)) {
      if (!data[pn]?.FitSets) continue;
      if (normalize(pn) === target) return pn;
    }
    const targetWords = target.split(/\s+/).filter(w => w.length > 1);
    for (const pn of Object.keys(data)) {
      if (!data[pn]?.FitSets) continue;
      const pnNorm = normalize(pn);
      if (targetWords.every(w => pnNorm.includes(w))) return pn;
    }
    for (const pn of Object.keys(data)) {
      if (!data[pn]?.FitSets) continue;
      const pnWords = normalize(pn).split(/\s+/).filter(w => w.length > 1);
      if (pnWords.length >= 2 && pnWords.every(w => target.includes(w))) return pn;
    }
    return null;
  }

  buildFitSetList(data: any): void {
    if (!data || typeof data !== 'object') return;
    const matchedProductName = this.productNameInput
      ? this.matchProductName(data, this.productNameInput)
      : null;
    const list: FitSetRef[] = [];
    const toScan = matchedProductName ? [matchedProductName] : Object.keys(data);
    for (const pn of toScan) {
      const product = data[pn];
      if (!product?.FitSets || typeof product.FitSets !== 'object') continue;
      for (const fsName of Object.keys(product.FitSets)) {
        list.push({
          productName: pn,
          fitSetName: fsName,
          label: this.extractFitSetLabel(fsName)
        });
      }
    }
    this.productFitSets.set(list);
  }

  // Extracts a label for the fitset pill button.
  // Priority:
  // 1. Number before FitSet + D/N suffix if present
  //    "Biofinity 309 Distance FitSet" -> "309 D"
  //    "Biofinity 309 Near FitSet"     -> "309 N"
  //    "Avaira Vitality 108 FitSet"    -> "108"
  // 2. Full name if no number found
  private extractFitSetLabel(fitSetName: string): string {
    // Check for Distance/Near qualifiers
    const distanceMatch = fitSetName.match(/\b(\d+)\s+Distance\s+FitSet\b/i);
    if (distanceMatch) return `${distanceMatch[1]} D`;

    const nearMatch = fitSetName.match(/\b(\d+)\s+Near\s+FitSet\b/i);
    if (nearMatch) return `${nearMatch[1]} N`;

    // Generic number extraction
    const numMatch = fitSetName.match(/\b(\d+)\s+FitSet\b/i);
    if (numMatch) return numMatch[1];

    return fitSetName;
  }

  selectFitSet(data: any, fitSetName: string, productName?: string): void {
    let result: { productName: string; fitSetName: string; fitSet: any } | null = null;
    if (productName && data?.[productName]?.FitSets?.[fitSetName]) {
      result = { productName, fitSetName, fitSet: data[productName].FitSets[fitSetName] };
    }
    if (!result) {
      for (const pn of Object.keys(data ?? {})) {
        const product = data[pn];
        if (!product?.FitSets) continue;
        if (product.FitSets[fitSetName]) {
          result = { productName: pn, fitSetName, fitSet: product.FitSets[fitSetName] };
          break;
        }
      }
    }
    if (!result) {
      this.errorMessage.set(`FitSet "${fitSetName}" was not found.`);
      return;
    }
    this.productName.set(result.productName);
    this.selectedFitSetName.set(result.fitSetName);
    this.selectedFitSet.set(result.fitSet);
    const itemsPerRow = Number(result.fitSet?.NumberOfItemsPerRow ?? 0) || 3;
    this.numberOfItemsPerRow.set(itemsPerRow);
    this.trialSize.set(result.fitSet?.TrialSize ?? '');
    this.useCompactCells.set(itemsPerRow > 3);
    this.selectedQuantities.set(new Map());
    this.buildCylFilter(result.fitSet);
    this.buildDrawers(result.fitSet, itemsPerRow);
  }

  changeFitSet(fitSetName: string): void {
    if (this.selectedFitSetName() === fitSetName) return;
    this.errorMessage.set('');
    if (this.cachedData) {
      this.selectFitSet(this.cachedData, fitSetName, this.productName());
      return;
    }
    this.loading.set(true);
    this.pendingRequest?.unsubscribe();
    this.pendingRequest = this.http.get<any>('/fitset-catalog/FitSets-GB.json').subscribe({
      next: (data) => {
        this.cachedData = data;
        this.buildFitSetList(data);
        this.selectFitSet(data, fitSetName, this.productName());
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('Could not load FitSet.');
        this.loading.set(false);
      }
    });
  }

  private buildCylFilter(fitSet: any): void {
    const contacts = fitSet?.Contacts;
    if (!Array.isArray(contacts) || contacts.length > 1) {
      this.cylValues.set([]);
      this.selectedCyl.set('');
      return;
    }
    const flat: Contact[] = contacts[0]?.flat(Infinity) ?? [];
    const cylSet = new Set<string>();
    flat.forEach(c => { const cyl = String(c?.['Cyl'] ?? ''); if (cyl) cylSet.add(cyl); });
    if (cylSet.size === 0) { this.cylValues.set([]); this.selectedCyl.set(''); return; }
    const itemsPerRow = Number(fitSet?.NumberOfItemsPerRow ?? 0) || 3;
    const totalRows = Math.ceil(flat.length / itemsPerRow);
    let firstCount = -1;
    let allSame = true;
    for (const cyl of cylSet) {
      const count = flat.filter(c => String(c?.['Cyl'] ?? '') === cyl).length;
      if (firstCount === -1) firstCount = count;
      if (count !== firstCount) { allSame = false; break; }
    }
    const expectedPerCyl = flat.length / cylSet.size;
    if (allSame && firstCount === expectedPerCyl && firstCount <= totalRows * cylSet.size) {
      const sorted = Array.from(cylSet).sort((a, b) => Number(a) - Number(b));
      this.cylValues.set(sorted);
      this.selectedCyl.set(sorted[0]);
    } else {
      this.cylValues.set([]);
      this.selectedCyl.set('');
    }
  }

  selectCyl(cyl: string): void {
    this.selectedCyl.set(cyl);
    if (this.selectedFitSet()) this.buildDrawers(this.selectedFitSet(), this.numberOfItemsPerRow());
  }

  // ============================================================
  // GAP PARSING
  // ============================================================
  //
  // RowGaps format: array of objects, one per section.
  // Keys are 1-based row numbers. Values are gap "units".
  // Special keys: -1 = reduce gap (we ignore/clamp), 0 = default for all rows.
  // We convert: gapPx = BASE_GAP_PX + (value * GAP_UNIT_PX)
  //
  // ColumnGaps format: array of objects, one per section.
  // Keys are 1-based column indices after which to insert extra space.
  // e.g. { "2": 2, "4": 2 } with 6 columns means:
  //   [col1 col2] --gap-- [col3 col4] --gap-- [col5 col6]
  //
  // The gap value determines the spacer div width:
  //   spacerWidth = BASE_GAP_PX + (value * GAP_UNIT_PX)
  //
  // This matches the visual in Image 1 where the column sub-groups
  // are clearly separated by a wider gap than the cell-to-cell gap.

  private parseRowGapMap(rowGapsConfig: any, sectionIndex: number): Map<number, number> {
    const map = new Map<number, number>();
    if (!Array.isArray(rowGapsConfig) || rowGapsConfig.length === 0) return map;
    const config = rowGapsConfig[sectionIndex] ?? rowGapsConfig[0] ?? {};
    for (const [key, value] of Object.entries(config)) {
      const k = Number(key);
      const v = Number(value);
      // Skip special keys -1 (reduce) and 0 (default) — handle separately if needed
      if (!isNaN(k) && k > 0 && !isNaN(v) && v > 0) {
        // Convert gap units to pixels: base + (units * GAP_UNIT_PX)
        map.set(k, this.BASE_GAP_PX + (v * this.GAP_UNIT_PX));
      }
    }
    return map;
  }

  private parseColumnGapMap(colGapsConfig: any, sectionIndex: number): Map<number, number> {
    const map = new Map<number, number>();
    if (!Array.isArray(colGapsConfig) || colGapsConfig.length === 0) return map;
    const config = colGapsConfig[sectionIndex] ?? colGapsConfig[0] ?? {};
    for (const [key, value] of Object.entries(config)) {
      const k = Number(key);
      const v = Number(value);
      if (!isNaN(k) && k > 0 && !isNaN(v) && v > 0) {
        // Spacer width = base gap + (units * GAP_UNIT_PX)
        map.set(k, this.BASE_GAP_PX + (v * this.GAP_UNIT_PX));
      }
    }
    return map;
  }

  // Splits a flat row of cells into CellGroups based on ColumnGaps break points.
  // ColumnGaps { "2": 2, "4": 2 } with 6 cells creates 3 groups:
  //   Group[0]: cells 0-1, gapAfter: 30px (6 + 2*12)
  //   Group[1]: cells 2-3, gapAfter: 30px
  //   Group[2]: cells 4-5, gapAfter: 0 (last group)
  private splitRowIntoGroups(cells: Contact[], colGapMap: Map<number, number>): CellGroup[] {
    if (colGapMap.size === 0) {
      return [{ cells, gapAfter: 0 }];
    }
    const groups: CellGroup[] = [];
    const breakPoints = Array.from(colGapMap.keys()).sort((a, b) => a - b);
    let start = 0;
    for (const bp of breakPoints) {
      if (bp > start && start < cells.length) {
        groups.push({ cells: cells.slice(start, bp), gapAfter: colGapMap.get(bp) ?? 0 });
        start = bp;
      }
    }
    if (start < cells.length) {
      groups.push({ cells: cells.slice(start), gapAfter: 0 });
    }
    return groups.length > 0 ? groups : [{ cells, gapAfter: 0 }];
  }

  // ============================================================
  // DRAWER CONSTRUCTION
  // ============================================================

  private buildDrawers(fitSet: any, itemsPerRow: number): void {
    const contacts = fitSet?.Contacts;
    if (!Array.isArray(contacts)) {
      this.drawers.set([]);
      this.useDrawerLayout.set(false);
      return;
    }
    const multiDrawer = contacts.length > 1;
    this.useDrawerLayout.set(multiDrawer);
    const headers: string[] = Array.isArray(fitSet?.SectionHeaders) ? fitSet.SectionHeaders : [];
    const headerColors: string[] = Array.isArray(fitSet?.SectionHeaderColors) ? fitSet.SectionHeaderColors : [];
    const rowGapsConfig = fitSet?.RowGaps ?? [];
    const colGapsConfig = fitSet?.ColumnGaps ?? [];
    const selectedCyl = this.selectedCyl();

    const built: DrawerSection[] = contacts.map((sectionContacts: any, index: number) => {
      let flat: Contact[] = Array.isArray(sectionContacts)
        ? (sectionContacts.flat(Infinity) as Contact[])
        : [];
      if (!multiDrawer && selectedCyl) {
        flat = flat.filter(c => String(c?.['Cyl'] ?? '') === selectedCyl);
      }

      const rowGapMap = this.parseRowGapMap(rowGapsConfig, index);
      const colGapMap = this.parseColumnGapMap(colGapsConfig, index);

      const cellRows: CellRow[] = [];
      let flatIndex = 0;
      let rowNumber = 0;

      while (flatIndex < flat.length) {
        const rowCells = flat.slice(flatIndex, flatIndex + itemsPerRow);
        rowNumber++;
        // Row gap: if this row number has an entry in RowGaps, use that;
        // otherwise use the base gap
        const gapBelow = rowGapMap.get(rowNumber) ?? this.BASE_GAP_PX;
        const groups = this.splitRowIntoGroups(rowCells, colGapMap);
        cellRows.push({ groups, gapBelow });
        flatIndex += itemsPerRow;
      }

      return {
        index: index + 1,
        header: headers[index] ?? `Drawer ${index + 1}`,
        colorClass: this.getColorClass(headerColors[index]),
        cellRows,
        allContacts: flat,
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

  hasCyl(contact: Contact): boolean { return !!contact?.['Cyl']; }
  hasAxis(contact: Contact): boolean { return !!contact?.['Axis']; }

  // Returns the Add field value if present ("Low", "High", etc.)
  getAdd(contact: Contact): string { return String(contact?.['Add'] ?? ''); }

  // Returns a D/N or Type label if present on the contact
  getDN(contact: Contact): string {
    if (contact?.['D'] !== undefined) return 'D';
    if (contact?.['N'] !== undefined) return 'N';
    const type = String(contact?.['Type'] ?? '');
    if (type) return type;
    return '';
  }

  getContactValue(contact: Contact, key: string): string {
    return String(contact?.[key] ?? '');
  }

  // ============================================================
  // SELECTION / QUANTITY
  // ============================================================

  isSelected(contact: Contact): boolean { return this.selectedQuantities().has(contact); }

  toggleContact(contact: Contact): void {
    this.selectedQuantities.update(map => {
      const next = new Map(map);
      if (next.has(contact)) { next.delete(contact); } else { next.set(contact, 1); }
      return next;
    });
  }

  getQuantity(contact: Contact): number { return this.selectedQuantities().get(contact) ?? 0; }

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
      if (qty <= 1) { next.delete(contact); } else { next.set(contact, qty - 1); }
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
}