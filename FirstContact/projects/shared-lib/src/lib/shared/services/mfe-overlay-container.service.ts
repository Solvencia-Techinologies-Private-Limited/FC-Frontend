import { Injectable, OnDestroy, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
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
  /**
   * Resolves the overlay host element. Modal-host custom elements (shell side panels)
   * must win over route-level MFE tags still mounted in the DOM — document.querySelector
   * with a comma list returns the first node in tree order, not the most specific host.
   */
  /** Shell modal-host tags must be visible; hidden/stale hosts are ignored. */
  private _isVisibleHost(host: Element): boolean {
    if (!host.isConnected) {
      return false;
    }
    const rect = host.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  /** Prefer the route MFE that matches the current shell URL. */
  /**
 * Resolves the active route MFE using the current shell URL.
 *
 * During cross-MFE navigation and modal flows, multiple route MFEs may
 * still exist in the DOM. Attaching overlays to the wrong host can cause
 * z-index issues, incorrect positioning, or overlays appearing behind
 * active content. This method ensures overlays are attached to the MFE
 * associated with the current route (Orders, Patients, Settings, etc.).
 */
  private _resolveRouteMfeHost(connectedRouteMfes: Element[]): Element | null {
    const path = this._document.defaultView?.location?.pathname ?? '';
    const pathToTag: Array<[string, string]> = [
      //['/app/ecp/patients', 'cvpro-patients-mfe'],
      //['/app/ecp/products', 'cvpro-orders-mfe'],
      //['/app/ecp/orders', 'cvpro-orders-mfe'],
      //['/app/ecp/settings', 'cvpro-settings-mfe'],
      //['/app/ecp/resources', 'cvpro-resources-mfe'],
      ['/projects/orders', 'fc-orders-mfe'],
    ];

    for (const [segment, tagName] of pathToTag) {
      if (path.includes(segment)) {
        const match = connectedRouteMfes.filter(
          (el) => el.tagName.toLowerCase() === tagName
        );
        if (match.length > 0) {
          return match[match.length - 1];
        }
      }
    }

    return connectedRouteMfes.length > 0
      ? connectedRouteMfes[connectedRouteMfes.length - 1]
      : null;
  }

  private _resolveOverlayHost(): Element | null {
    const modalHostSelector =
      'fc-orders-modal-host';
    const routeMfeSelector =
      'fc-orders-mfe';

    const connectedModalHosts = Array.from(this._document.querySelectorAll(modalHostSelector)).filter(
      (el) => el.isConnected && this._isVisibleHost(el)
    );
    if (connectedModalHosts.length > 0) {
      return connectedModalHosts[connectedModalHosts.length - 1];
    }

    const connectedRouteMfes = Array.from(this._document.querySelectorAll(routeMfeSelector)).filter(
      (el) => el.isConnected
    );
    const routeHost = this._resolveRouteMfeHost(connectedRouteMfes);
    if (routeHost) {
      return routeHost;
    }

    return this._document.querySelector('app-root');
  }

  protected override _createContainer(): void {
    const container = this._document.createElement('div');
    container.classList.add('cdk-overlay-container');

    const hostElement = this._resolveOverlayHost();
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

  /**
   * Overridden to ensure we re-create the container if the current one 
   * has been detached (e.g. when the host modal was closed).
   */
  override getContainerElement(): HTMLElement {
    // If we have a container, check if it's still connected to the document
    if (this._containerElement && !this._containerElement.isConnected) {
      // If it's not connected, it's a "ghost" container from a previous MFE mount
      this._containerElement = undefined;
    }

    if (this._containerElement?.isConnected) {
      const expectedHost = this._resolveOverlayHost();
      const root = this._containerElement.getRootNode() as ShadowRoot | Document;
      const currentHost = root && 'host' in root ? (root as ShadowRoot).host : null;
      if (expectedHost && currentHost && currentHost !== expectedHost) {
        this._containerElement.remove();
        this._containerElement = undefined;
      }
    }

    if (!this._containerElement) {
      this._createContainer();
    }

    if (!this._containerElement) {
      this._containerElement = this._document.createElement('div');
      this._containerElement.classList.add('cdk-overlay-container');
      this._document.body.appendChild(this._containerElement);
    }

    return this._containerElement;
  }


  override ngOnDestroy() {
    super.ngOnDestroy();
  }
}