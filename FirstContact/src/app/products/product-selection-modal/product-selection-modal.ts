import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Product } from '../product-modal.model';
import { ClassicContactPicker } from '../classic-contact-picker/classic-contact-picker';
import { FitsetDrawerComponent } from '../fitset-drawer/fitset-drawer';
import { MatDialog } from '@angular/material/dialog';
import { BrandSelectorComponent } from '../full-contact-picker/brand-selector.component';

@Component({
  selector: 'app-product-selection-modal',
  imports: [],
  templateUrl: './product-selection-modal.html',
  styleUrl: './product-selection-modal.css',
})
export class ProductSelectionModal {
  @Input({ required: true }) product!: Product;
  @Input() getImagePath!: (fileName: string) => string;

  @Output() closeModal = new EventEmitter<void>();
  isContactPickerOpen = false;

  constructor(private dialog: MatDialog) {}

  onClose(): void {
    this.closeModal.emit();
  }

  onImageError(event: Event): void {
    (event.target as HTMLImageElement).src = '/assets/images/products/placeholder.jpg';
  }  

  onSelect(option: string): void {
    if (option === 'ContactPicker') {
      this.isContactPickerOpen = true;
    }
  }
  
  openClassicContactPicker(product: any): void {
    this.dialog.open(ClassicContactPicker, {
      width: '100vw',
      height: '100vh',
      maxWidth: '100vw',
      maxHeight: '100vh',
      data: {
        brandId: product
      }
    });
  }

  openFullContactPicker(product: any): void {
    this.dialog.open(BrandSelectorComponent, {
      width: '100vw',
      height: '100vh',
      maxWidth: '100vw',
      maxHeight: '100vh',
      data: {
        brandId: product
      }
    });
  }

  openFitSetPicker(product: any): void {
    const imageFileName = this.product['imageFileName'] ?? '';

    this.dialog.open(FitsetDrawerComponent, {
      width: '100vw',
      height: '100vh',
      maxWidth: '100vw',
      maxHeight: '100vh',
      data: {
        brandId: product,
        Image: this.getImagePath(imageFileName)
      }
    });
  }
}