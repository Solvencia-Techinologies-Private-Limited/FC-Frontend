import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection, provideAppInitializer } from '@angular/core';
import { provideRouter } from '@angular/router';
import { HttpClient, provideHttpClient, HTTP_INTERCEPTORS, withInterceptorsFromDi, HttpBackend } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { APP_BASE_HREF } from '@angular/common';

import { routes } from './app.routes';
import { OverlayContainer } from '@angular/cdk/overlay';

import { getMfeContext, SharedModule, ENVIRONMENT , ENV_SERVICE, MfeOverlayContainer } from '../../../shared-lib/src/lib';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
    { provide: OverlayContainer, useClass: MfeOverlayContainer },
    importProvidersFrom(
      SharedModule
    )
  ]
};