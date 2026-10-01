import { Component, Inject, OnInit, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ProductService } from '../product-services';
import { Product } from '../product-modal.model';

@Component({
  selector: 'app-brand-selector',
  standalone: true,
  templateUrl: './brand-selector.component.html',
  styleUrls: ['./brand-selector.component.scss']
})
export class BrandSelectorComponent implements OnInit {

  productName = '';
  loading = false;
  error = '';

  readonly product = signal<Product | null>(null);
  readonly displayName = signal('');
  readonly imageUrl = signal('');

  selectedValues: Record<string, string> = {};
  powerQuantities: Record<string, number> = {};

  expandedBc: string | null = null;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: { brandId: string },
    public readonly productService: ProductService,
    private readonly dialogRef: MatDialogRef<BrandSelectorComponent>
  ) {}

  ngOnInit(): void {
    this.productName = this.data?.brandId ?? '';

    if (!this.productName) {
      this.error = 'Product name is required.';
      return;
    }

    this.loadProduct(this.productName);
  }

  retry(): void {
    if (!this.productName) {
      return;
    }

    this.loadProduct(this.productName);
  }

  private normalizeProductName(
    value: string | null | undefined
  ): string {
    return (value ?? '')
      .trim()
      .toLowerCase()
      .replace(/[™®©]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private loadProduct(productName: string): void {
  this.loading = true;
  this.error = '';

  this.productService.getProducts().subscribe({
    next: (response: any) => {

      const products = Array.isArray(response)
        ? response
        : response?.products ?? response?.data ?? [];

      if (!Array.isArray(products)) {
        this.error = 'Invalid product response.';
        this.loading = false;
        return;
      }

      const productData = products.find(
        (item: any) =>
          this.normalizeProductName(item.brandName) ===
          this.normalizeProductName(productName)
      );

      if (!productData) {
        this.error = `Product "${productName}" was not found.`;
        this.loading = false;
        return;
      }

      this.product.set(productData);

      this.displayName.set(
        productData.brandName ?? productName
      );

      this.imageUrl.set(
        productData.imageFileName
          ? `/Packshots/${productData.imageFileName}`
          : ''
      );

      const availableBc =
        productData.baseCurve?.length > 1
          ? productData.baseCurve.slice(1)
          : productData.baseCurve ?? [];

      if (availableBc.length) {
        this.selectedValues = {
          ...this.selectedValues,
          baseCurve: availableBc[0]
        };

        this.expandedBc = availableBc[0];
      }

      this.loading = false;
    },

    error: (err) => {
      console.error(err);

      this.error =
        'Unable to load product configuration.';

      this.loading = false;
    }
  });
}

  get baseCurves(): string[] {

  const curves =
    this.product()?.baseCurve ?? [];

  if (!curves.length) {
    return [];
  }

  return curves.length > 1
    ? curves.slice(1)
    : curves;
}

  get powers(): string[] {

  const sphere =
    this.product()?.sphere;

  if (
    !sphere ||
    !sphere.length ||
    !Array.isArray(sphere[0])
  ) {
    return [];
  }

  return sphere[0].length > 1
    ? sphere[0].slice(1)
    : sphere[0];
}

  get selectedBaseCurve(): string {
    return this.selectedValues['baseCurve'] ?? '';
  }

  selectParameterValue(
  parameterName: string,
  value: string | number
): void {

  const bc = String(value);

  this.selectedValues = {
    ...this.selectedValues,
    [parameterName]: bc
  };

  this.expandedBc =
    this.expandedBc === bc
      ? null
      : bc;
}

  private getKey(
    bc: string,
    power: string
  ): string {
    return `${bc}|${power}`;
  }

  increasePower(
    bc: string,
    power: string
  ): void {

    const key = this.getKey(
      bc,
      power
    );

    this.powerQuantities[key] =
      (this.powerQuantities[key] ?? 0) + 1;
  }

  decreasePower(
    bc: string,
    power: string
  ): void {

    const key = this.getKey(
      bc,
      power
    );

    const current =
      this.powerQuantities[key] ?? 0;

    if (current > 0) {
      this.powerQuantities[key] = current - 1;
    }
  }

  getPowerQty(
    bc: string,
    power: string
  ): number {

    return this.powerQuantities[
      this.getKey(bc, power)
    ] ?? 0;
  }

  getBcQty(
    bc: string
  ): number {

    return Object.entries(
      this.powerQuantities
    )
      .filter(([key]) =>
        key.startsWith(`${bc}|`)
      )
      .reduce(
        (sum, [, qty]) => sum + qty,
        0
      );
  }

  atLeastOneItemSelected(): boolean {
    return Object.values(
      this.powerQuantities
    ).some(qty => qty > 0);
  }

  get totalQuantity(): number {
    return Object.values(
      this.powerQuantities
    ).reduce(
      (sum, qty) => sum + qty,
      0
    );
  }

  addToCart(): void {

    const product = this.product();

    if (!product) {
      return;
    }

    const items = Object.entries(
      this.powerQuantities
    )
      .filter(([, qty]) => qty > 0)
      .map(([key, qty]) => {

        const [bc, power] =
          key.split('|');

        return {
          baseCurve: bc,
          power,
          quantity: qty
        };
      });

    if (!items.length) {
      return;
    }

    this.dialogRef.close({
      brandName: product.brandName,
      imageFileName: product.imageFileName,
      wearingSchedule:
        product.wearingSchedule,
      trialUnitCount:
        product.trialUnitCount,
      items
    });
  }

  close(): void {
    this.dialogRef.close();
  }
}