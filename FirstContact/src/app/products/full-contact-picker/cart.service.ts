import { Injectable, signal } from '@angular/core';
import { CartItem } from '../product-modal.model';

const STORAGE_KEY = 'cart';

/**
 * Stand-in for CVCartContentsViewController (the old `delegate`).
 * Replace with your real cart service if you already have one; the selector
 * only needs addCartItem() and saveCart().
 */
@Injectable({ providedIn: 'root' })
export class CartService {
  readonly items = signal<CartItem[]>(this.load());

  /** Adds an item; if the same brand + description is already in the cart, increases its quantity. */
  addCartItem(item: CartItem): void {
    this.items.update((list) => {
      const index = list.findIndex(
        (existing) => existing.brand === item.brand && existing.desc === item.desc
      );

      if (index === -1) {
        return [...list, item];
      }

      return list.map((existing, i) =>
        i === index
          ? { ...existing, quantity: existing.quantity + item.quantity }
          : existing
      );
    });
  }

  saveCart(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items()));
    } catch {
      /* storage unavailable */
    }
  }

  private load(): CartItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
}
