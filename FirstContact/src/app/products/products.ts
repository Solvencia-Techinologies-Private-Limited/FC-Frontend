import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService } from './product-services';
import { Product } from './product-modal.model';
import { ProductSelectionModal } from './product-selection-modal/product-selection-modal';
import { FitsetDrawerComponent } from './fitset-drawer/fitset-drawer';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, ProductSelectionModal, FitsetDrawerComponent],
  templateUrl: './products.html',
  styleUrls: ['./products.css'],
})
export class Products implements OnInit {
  private productsSign = signal<Product[]>([]);
  private loadingSign = signal<boolean>(true);
  private errorSign = signal<string | null>(null);
  private selectedProductSign = signal<Product | null>(null);

  filteredProductsSign = computed(() =>
    this.productsSign()
      .filter(p => !!p['brandId'])
      .map(p => ({
        ...p,
        brandId: this.removeTrailingNumber(p['brandId'])
      }))
  );
  loading = this.loadingSign.asReadonly();
  error = this.errorSign.asReadonly();
  selectedProduct = this.selectedProductSign.asReadonly();

  // --- added ---
  showFitSetDrawer = false;
  fitSetProductName = '';
  fitSetProductImageUrl = '';
  // -------------

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    this.productService.getProducts().subscribe({
      next: (data) => {
        this.productsSign.set(data);
        this.loadingSign.set(false);
      },
      error: () => {
        this.errorSign.set('Failed to load products.');
        this.loadingSign.set(false);
      }
    });
  }

  getImagePath(fileName: string): string {
    return `/UK%20Packshots/${fileName}`;
  }

  trackByBrand(_: number, p: Product): string {
    return p['brandId'];
  }

  openProductModal(product: Product): void {
    this.selectedProductSign.set(product);
  }

  closeProductModal(): void {
    this.selectedProductSign.set(null);
  }

  onSelectMechanism(mechanism: string): void {
    const product = this.selectedProductSign();
    if (!product) return;

    console.log(`Selected "${mechanism}" for`, product['brandId']);

    if (mechanism === 'FitSet') {
      this.fitSetProductName = product['brandId'];
      this.fitSetProductImageUrl = this.getImagePath(product['Image']);
      this.closeProductModal();
      this.showFitSetDrawer = true;
      return;
    }
    this.closeProductModal();
  }

  // --- added ---
  onFitSetBack(): void {
    this.showFitSetDrawer = false;
  }
  // -------------

  removeTrailingNumber(name: string): string {
    return name.replace(/\s+\d+$/, '').trim();
  }
}