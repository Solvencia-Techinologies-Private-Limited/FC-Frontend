import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from './product-modal.model';
import { ProductSelectionModal } from './product-selection-modal/product-selection-modal';
import { FitsetDrawerComponent } from './fitset-drawer/fitset-drawer';
import { ProductService } from './product-services';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, ProductSelectionModal],
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
      .filter((p: Product & { brandName?: string }) => !!p.brandName)
      .map((p: Product & { brandName?: string }) => ({
        ...p,
        brandName: p.brandName ?? ''
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
      error: (err) => {
        console.error('Failed to load products:', err);
        this.errorSign.set('Failed to load products.');
        this.loadingSign.set(false);
      }
    });
  }

  getImagePath(fileName: string, useFallback = false): string {
    return `/Packshots/${fileName}`;
  }

  trackByBrand(_: number, p: Product): string {
    return (p as Product & { brandName?: string }).brandName ?? '';
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

    this.closeProductModal();
  }

  // --- added ---
  onFitSetBack(): void {
    this.showFitSetDrawer = false;
  }

}