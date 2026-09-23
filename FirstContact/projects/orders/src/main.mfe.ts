import { createApplication } from '@angular/platform-browser';
import { createCustomElement } from '@angular/elements';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
import { Router } from '@angular/router';
import { setMfeContext } from '../../shared-lib/src/lib';

/**
 * Bootstraps the Reports Micro-Frontend.
 *
 * Exposes the main bootstrap hook called by the host Vue shell via Webpack Module Federation.
 *
 * Design choices:
 * 1. Context registration (`setMfeContext(context)`) runs synchronously before the Angular application is built,
 *    guaranteeing that translation file loaders and resource configs resolve setting scopes immediately.
 * 2. Initial navigation is manually triggered to avoid routing resolving races before the custom element tags are active.
 * 3. The Reports element is registered as a Custom Element (Web Component) to isolate context boundaries.
 *
 * @param context The shared closure-scoped context bridge from the Vue shell.
 * @returns A promise resolving to the Angular ApplicationRef instance.
 */
export default function bootstrap(context: any) {
  setMfeContext(context);

  return createApplication(appConfig).then(appRef => {
    const injector = appRef.injector;

    // Manually trigger initial navigation
    const router = injector.get(Router);
    router.initialNavigation();

    const OrdersElement = createCustomElement(AppComponent, { injector });

    if (!customElements.get('fc-reports-mfe')) {
      customElements.define('fc-reports-mfe', OrdersElement);
    }

    return appRef;
  });
}