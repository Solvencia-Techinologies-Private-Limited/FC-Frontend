import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ProductService } from '../product-services';
import { Product } from '../product-modal.model';
import { ProductParameter } from '../product-modal.model';

@Component({
  selector: 'app-classic-contact-picker',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './classic-contact-picker.html',
  styleUrl: './classic-contact-picker.css'
})

export class ClassicContactPicker implements OnInit {
  productName = '';
  product: Product | null = null;
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

    this.productService.getProducts().subscribe({
      next: products => {
        const productData = products.find(
          item =>
            this.normalizeProductName(item.brandName) ===
            this.normalizeProductName(productName)
        );

        if (!productData) {
          this.error = `Product "${productName}" was not found.`;
          this.loading = false;
          return;
        }

        this.product = productData;

        const firstParameter =
          this.selectableParameters.find(
            p => !this.isFixedParameter(p.name)
          );

        this.selectedParameter = firstParameter?.name ?? '';

        this.loading = false;
        this.changeDetectorRef.detectChanges();
      },
      error: () => {
        this.error = 'Unable to load product configuration.';
        this.loading = false;
        this.changeDetectorRef.detectChanges();
      }
    });
  }

  private normalizeProductName(value: string): string {
    return (value ?? '').trim().toLowerCase().replace(/[™®©]/g, '').replace(/\s*\([^)]*\)\s*$/, '').replace(/\s+/g, ' ').trim();
  }

  private isFixedParameter(name: string): boolean {
    return [
      'baseCurve',
      'diameter',
    ].includes(name);
  }

  get baseCurve(): string {
    return this.product?.baseCurve?.[1] ?? '';
  }
  get wearingSchedule(): string {
    return this.product?.wearingSchedule ?? '';
  }

  get selectableParameters(): ProductParameter[] {
    if (!this.product) {
      return [];
    }

    const parameters: ProductParameter[] = [];

    const addParameter = (
      name: string,
      label: string,
      values: string[]
    ) => {
      if (values.length > 0) {
        parameters.push({
          name,
          label,
          values
        });
      }
    };

    // BC
    addParameter(
      'baseCurve',
      'BC',
      this.product.baseCurve?.slice(1) ?? []
    );

    // Schedule
    addParameter(
      'wearingSchedule',
      'Schedule',
      this.product.wearingSchedule
        ? [this.product.wearingSchedule]
        : []
    );

    // Trial Unit Count
    addParameter(
      'trialUnitCount',
      'Trial Qty',
      this.product.trialUnitCount != null
        ? [String(this.product.trialUnitCount)]
        : []
    );

    // Power
    addParameter(
      'power',
      'Power',
      this.product.sphere?.[0]?.slice(1) ?? []
    );

    // Cylinder
    addParameter(
      'cylinder',
      'Cylinder',
      this.product.cylinder?.[0]?.slice(1) ?? []
    );

    // Axis
    addParameter(
      'axis',
      'Axis',
      this.product.axis?.[0]?.slice(1) ?? []
    );

    return parameters;
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
      brandName: this.product.brandName,

      selections: {
        ...this.selectedValues
      },

      quantity: this.quantity,

      baseCurve: this.product.baseCurve?.[1],

      wearingSchedule:
        this.product.wearingSchedule,

      imageFileName:
        this.product.imageFileName
    };

    console.log(selectedProduct);

    this.dialogRef.close(selectedProduct);
  }

  get selectionText(): string {
    if (!this.product) {
      return 'Selection: - none -';
    }

    const values = this.selectableParameters
      .map(p => this.selectedValues[p.name])
      .filter(Boolean);

    if (!values.length) {
      return 'Selection: - none -';
    }

    return `Selection: ${values.join(' ')}`;
  }

  get imageUrl(): string {
    return this.product?.imageFileName
      ? `/Packshots/${this.product.imageFileName}`
      : '';
  }

  close(): void {
    this.dialogRef.close();
  }

  toPascalCase(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }
}