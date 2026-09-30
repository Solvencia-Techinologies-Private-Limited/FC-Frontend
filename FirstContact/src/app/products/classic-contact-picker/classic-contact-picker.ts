import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ProductService } from '../product-services';
import { ProductResponse, ProductParameter } from '../product-modal.model';

@Component({
  selector: 'app-classic-contact-picker',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './classic-contact-picker.html',
  styleUrl: './classic-contact-picker.css'
})

export class ClassicContactPicker implements OnInit {
  productName = '';
  product: ProductResponse | null = null;
  selectedParameter = '';
  selectedValues: Record<string, string> = {};
  quantity = 0;
  loading = false;
  error = '';

  constructor(@Inject(MAT_DIALOG_DATA)
  public data: { brandId: string },
    private readonly dialogRef: MatDialogRef<ClassicContactPicker>,
    private readonly changeDetectorRef: ChangeDetectorRef,
    public readonly productService: ProductService
  ) { }

  ngOnInit(): void {
    const productName = this.data?.brandId;
    if (!productName) {
      this.error = 'Product name is required.';
      return;
    }

    this.productName = productName;
    this.loadProduct(productName);
  }

  private loadProduct(productName: string): void {
    this.loading = true;
    this.error = '';
    this.selectedParameter = '';
    this.selectedValues = {};
    this.quantity = 0;

    this.productService.getSeriesList().subscribe({
      next: products => {

        const productData = products?.data?.find(
          (item: ProductResponse) =>
            this.normalizeProductName(item.displayName) ===
            this.normalizeProductName(productName)
        );

        if (!productData) {
          this.error = `Product "${productName}" was not found.`;
          this.loading = false;
          return;
        }

        this.product = productData;

        const selectableParameter =
          this.selectableParameters.find(parameter => !this.isFixedParameter(parameter.name));
        this.selectedParameter = selectableParameter?.name ?? '';
        this.loading = false;
        this.changeDetectorRef.detectChanges();
      },

      error: error => {
        this.error = 'Unable to load product configuration.';
        this.loading = false;
        this.changeDetectorRef.detectChanges();
      }
    });
  }

  private normalizeProductName(value: string): string {
    return (value ?? '').trim().toLowerCase().replace(/[™®©]/g, '').replace(/\s*\([^)]*\)\s*$/, '').replace(/\s+/g, ' ').trim();
  }

  get parameters(): ProductParameter[] {
    if (!this.product?.parameters) {
      return [];
    }

    return Object.entries(this.product.parameters).filter(([, values]) => Array.isArray(values) && values.length > 0).map(([name, values]) => ({ name, values: values as (string | number)[] }));
  }


  private isFixedParameter(name: string): boolean {
    return [
      'baseCurve',
      'diameter',
      'packSize'
    ].includes(name);
  }

  get selectableParameters(): ProductParameter[] {
    return this.parameters;
  }

  get currentParameter(): ProductParameter | null {
    if (!this.selectedParameter) {
      return null;
    }

    return (
      this.selectableParameters.find(
        parameter => parameter.name === this.selectedParameter
      ) ?? null
    );
  }


  selectParameter(parameter: string): void {
    this.selectedParameter = parameter;
  }

  selectParameterValue(
    parameterName: string,
    value: string | number
  ): void {
    this.selectedValues = {
      ...this.selectedValues,
      [parameterName]: value.toString()
    };
  }

  selectValue(value: string | number): void {
    if (!this.selectedParameter) {
      return;
    }

    this.selectedValues = {
      ...this.selectedValues,
      [this.selectedParameter]: value.toString()
    };
  }

  get selectedValue(): string {
    if (!this.selectedParameter) {
      return '';
    }

    return this.selectedValues[this.selectedParameter] ?? '';
  }

  increaseQuantity(): void {
    this.quantity++;
  }

  decreaseQuantity(): void {
    if (this.quantity > 0) {
      this.quantity--;
    }
  }

  addToCart(): void {
    if (!this.product || this.quantity === 0) {
      return;
    }

    const selectedProduct = {
      itemId: this.product.itemId,

      productName: this.product.displayName,

      brandName: this.product.brandName,

      selections: {
        ...this.selectedValues
      },

      quantity: this.quantity,

      diameter: this.product.diameter,

      baseCurve: this.product.baseCurve,

      packSize: this.product.packSize,

      imagePath: this.product.imagePath,


      wearingSchedule: this.product.modality,


      buyingProduct: this.product.buyingProduct,

      buyingProductCode:
        this.product.buyingProductCode,

      trial: this.product.trial,

      trialReference:
        this.product.trialReference
    };

  }

  get selectionText(): string {
    if (!this.product) {
      return 'Selection: - none -';
    }

    const parameters =
      this.selectableParameters;

    const parts = parameters.map(parameter => {
      const selectedValue = this.selectedValues[parameter.name];

      if (selectedValue != null && selectedValue !== '') {
        return selectedValue;
      }

      const values = parameter.values;

      if (Array.isArray(values)) {
        return values[0]?.toString() ?? '';
      }

      return String(values ?? '');
    });

    const allSelected = parts.every(
      value => value !== ''
    );

    if (!allSelected) {
      return 'Selection: - none -';
    }

    return `Selection: ${parts.join(' ')}`;
  }

  get imageUrl(): string {
    return (
      this.product?.imagePath?.medium ??
      ''
    );
  }

  close(): void {
    this.dialogRef.close();
  }

  toPascalCase(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }
}