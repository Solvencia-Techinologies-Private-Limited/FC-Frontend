import { Injectable, OnDestroy, Inject, DOCUMENT, inject } from '@angular/core';

import { OverlayContainer } from '@angular/cdk/overlay';
import { Platform } from '@angular/cdk/platform';

@Injectable()
export class MfeOverlayContainer extends OverlayContainer implements OnDestroy {

  constructor() {
    super(inject(DOCUMENT), inject(Platform));
  }

  /**
   * This overridden method finds the MFE's root element (`<app-root>`)
   * and appends the overlay container inside it, rather than to the document body.
   */
  protected override _createContainer(): void {
    const container = this._document.createElement('div');
    container.classList.add('cdk-overlay-container');

    const hostElement = this._document.querySelector('app-root');

    if (hostElement) {
      if (hostElement.shadowRoot) {
        hostElement?.shadowRoot?.appendChild(container);
      } else {
        hostElement?.appendChild(container);
      }
      this._containerElement = container;
    } else {
      super._createContainer();
    }
  }


  override ngOnDestroy() {
    super.ngOnDestroy();
  }
}