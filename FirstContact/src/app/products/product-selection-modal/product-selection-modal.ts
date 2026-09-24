import { Component, EventEmitter, Input, Output } from '@angular/core';
export type ContactSelectionMechanism = 'ContactPicker' | 'ClassicContactPicker' | 'FitSet';
import { Product } from '../product-modal.model';

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
  @Output() mechanismSelected = new EventEmitter<ContactSelectionMechanism>();

  onClose(): void {
    this.closeModal.emit();
  }

  onSelect(mechanism: ContactSelectionMechanism): void {
    this.mechanismSelected.emit(mechanism);
  }

  onImageError(event: Event): void {
    (event.target as HTMLImageElement).src = '/assets/images/products/placeholder.jpg';
  }
}
