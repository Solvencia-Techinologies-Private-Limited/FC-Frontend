import { Injectable, Injector, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http'; // Kept for reference/types if needed, but unused for fetching
import { environment } from './environment';
import { APP_CONFIG } from './environment-token';

interface EnvironmentConfig {
  ENV: string;
  SHOW_TRANSLATION_KEYS: string;
  SERVER_URL: string;
  AUTH0_LOGIN: string;
  BUILD_NUMBER: string;
  BUILD_HASH: string;
  BUILD_BRANCH: string;
  PLATFORM_VERSION: string;
  REGION: string;
  DATADOG_SITE: string;
  DATADOG_CLIENT_ID: string;
  DATADOG_CLIENT_TOKEN: string;
  STRIPE_PK: string;
  AUTH0_SCOPE: string;
  PATIENT_SIDE: boolean;
  DOMAIN_SCRIPT: string;
  SCANDIT_KEY: string;
  SSO_CONNECTION?: string;
  SSO_ENABLED: boolean;
  SSO_LOGOUT_URL?: string;
  UCOMMFE_HOST?: boolean;
  UCOM_ENABLED?: boolean;
  WEB_HOST?: string;
  UCOM_LANDING_PAGE_URL?: string;
}

export type CacheLocation = 'memory' | 'localstorage';
interface AuthConfig {
  authConfig: string;
  platform: string;
  iosWebView: string;
  webAuthFlow: string;
  implicitLogin: string;
  discoveryUrl?: string;
  logLevel?: string;
  logoutUrl?: string;
  domain: string;
  clientId: string;
  skipRedirectCallback?: boolean;
  errorPath?: string;
  authorizeTimeoutInSeconds?: number;
  useRefreshTokens?: boolean;
  useRefreshTokensFallback?: boolean;
  cacheLocation?: CacheLocation;
  authorizationParams: {
    audience: string;
    scope: string;
    redirect_uri: string;
    patientSide: boolean;
  };
}

@Injectable({
  providedIn: 'root'
})
export class EnvironmentService {
  private envData: any;
  //private config: AuthClientConfig;
  private UcomClaims: any;
  public authConfig: AuthConfig = {
    authConfig: 'auth0',
    platform: 'web',
    iosWebView: 'private',
    webAuthFlow: 'PKCE',
    implicitLogin: 'CURRENT',
    domain: '',
    clientId: '',
    skipRedirectCallback: true, // Disable automatic callback handling,
    errorPath: ``,
    authorizeTimeoutInSeconds: 5,
    useRefreshTokens: true,
    cacheLocation: 'localstorage',
    authorizationParams: {
      audience: '',
      scope: 'openid offline_access email role:guardian role:guest role:patient',
      redirect_uri: ``,
      patientSide: false
    }
  };

  private injector = inject(Injector);
  private preloadedConfigPromise = inject(APP_CONFIG);

  constructor() {
  }

  async load(): Promise<AuthConfig> {
    //const config = this.injector.get(AuthClientConfig);

    const mfeClaims = localStorage.getItem('unifiedecom-claims');
    const localClaims = JSON.parse(mfeClaims as string) || [];
    this.UcomClaims = this.transformClaims(localClaims);



    // Await the promise initiated in bootstrap
    const env = await this.preloadedConfigPromise || {};

    // verify we have gotten config data in proper format. don't let production use local config
    // verify that env contains data and that ENV in config data is set (e.g. dev, stg, etc)
    if (!environment.production && (Object.keys(env).length === 0 || !env.ENV)) {
      // for local only, use config files from repo
      this.setLocalEnvironment();
      //config.set(this.authConfig);
      return Promise.resolve(this.authConfig);
    } else {
      // for remote, use config data from env.json
      this.setRemoteEnvironment(env);
      //config.set(this.authConfig);
      return Promise.resolve(this.authConfig);
    }
  }

  /**
 * Sets the local environment configuration for the application.
 *
 * This method initializes the environment data and authentication configuration
 * based on the provided environment settings. It configures the client ID, discovery URL,
 * redirect URI, scope, audience, log level, and logout URL for the authentication process.
 *
 * @private
 */
  private setLocalEnvironment(): void {
    this.envData = environment;
    this.authConfig.domain = environment.auth0_login;
    this.authConfig.clientId = environment.auth0_client_id;
    this.authConfig.discoveryUrl = `${environment.auth0_login}/.well-known/openid-configuration`;
    this.authConfig.skipRedirectCallback = true;
    this.authConfig.errorPath = `${environment.auth0_web_host}/access-denied`;
    this.authConfig.authorizeTimeoutInSeconds = 5;
    this.authConfig.useRefreshTokens = true;
    this.authConfig.useRefreshTokensFallback = true;
    this.authConfig.authorizationParams = {
      audience: environment.auth0_audience,
      scope: environment.auth0_scope,
      redirect_uri: `${environment.auth0_web_host}/authorize`,
      patientSide: true,
    };
    this.authConfig.logLevel = environment.env === 'production' ? 'ERROR' : 'DEBUG';
    this.authConfig.logoutUrl = `${environment.auth0_web_host}/logout`;
  }

  /**
   * Sets the remote environment configuration for the application.
   *
   * This method extracts the top-level domain (TLD) from the window location origin,
   * retrieves the corresponding country-specific options from the environment JSON,
   * and sets various environment-related properties and authentication configurations.
   *
   * The environment data includes:
   * - General environment settings (e.g., environment type, server URL, build information)
   * - Country-specific settings (e.g., Stripe keys, SMS enablement, country code)
   * - Authentication configuration (e.g., client ID, discovery URL, redirect URI, scope, audience, log level, logout URL)
   *
   * @private
   */
  private setRemoteEnvironment(env: any): void {
    const mfeCountryCode = this.UcomClaims?.country;
    let tld = '';

    let countryOpts = env[tld] || {};
    let hostSubdomain = '';

    switch (env.ENV) {
      case 'sandbox':
        hostSubdomain = 'sandbox';
        break;
      case 'development':
        hostSubdomain = 'dev';
        break;
      case 'staging':
        hostSubdomain = 'stage';
        break;
      case 'loadtest':
        hostSubdomain = 'loadtest';
        break;
      case 'qa':
        hostSubdomain = 'qa';
        break;
      case 'sit':
        hostSubdomain = 'sit';
        break;
      case 'uat':
        hostSubdomain = 'uat';
        break;
      default:
        hostSubdomain = ''; // Default to Production if no match
        break;
    }

    if (localStorage.getItem('unifiedecom-mfe-hosts')) {

      switch (mfeCountryCode) {
        case 'US':
          tld = [hostSubdomain, 'coopervisionpro.com'].filter(Boolean).join('.');
          break;
        case 'NZ':
          tld = [hostSubdomain, 'coopervisionpro.co.nz'].filter(Boolean).join('.');
          break;
        case 'AU':
          tld = [hostSubdomain, 'coopervisionpro.com.au'].filter(Boolean).join('.');
          break;
        case 'CA':
          tld = [hostSubdomain, 'coopervisionpro.ca'].filter(Boolean).join('.');
          break;
        case 'GB':
          tld = [hostSubdomain, 'coopervisionpro.co.uk'].filter(Boolean).join('.');
          break;
        case 'IE':
          tld = [hostSubdomain, 'coopervisionpro.ie'].filter(Boolean).join('.');
          break;
        case 'ZA':
          tld = [hostSubdomain, 'coopervisionpro.co.za'].filter(Boolean).join('.');
          break;
        case 'PL':
          tld = [hostSubdomain, 'coopervisionpro.pl'].filter(Boolean).join('.');
          break;
        case 'NL':
          tld = [hostSubdomain, 'coopervisionpro.nl'].filter(Boolean).join('.');
          break;
        case 'SK':
          tld = [hostSubdomain, 'coopervisionpro.sk'].filter(Boolean).join('.');
          break;
        case 'SI':
          tld = [hostSubdomain, 'coopervisionpro.si'].filter(Boolean).join('.');
          break;
        case 'IT':
          tld = [hostSubdomain, 'coopervisionpro.it'].filter(Boolean).join('.');
          break;
        case 'BE':
          tld = [hostSubdomain, 'coopervisionpro.be'].filter(Boolean).join('.');
          break;
        case 'HU':
          tld = [hostSubdomain, 'coopervisionpro.hu'].filter(Boolean).join('.');
          break;
        case 'CZ':
          tld = [hostSubdomain, 'coopervisionpro.cz'].filter(Boolean).join('.');
          break;
        case 'FR':
          tld = [hostSubdomain, 'coopervisionpro.fr'].filter(Boolean).join('.');
          break;
        case 'FI':
          tld = [hostSubdomain, 'coopervisionpro.fi'].filter(Boolean).join('.');
          break;
        case 'DK':
          tld = [hostSubdomain, 'coopervisionpro.dk'].filter(Boolean).join('.');
          break;
        case 'AT':
          tld = [hostSubdomain, 'coopervisionpro.at'].filter(Boolean).join('.');
          break;
        case 'SE':
          tld = [hostSubdomain, 'coopervisionpro.se'].filter(Boolean).join('.');
          break;
        case 'NO':
          tld = [hostSubdomain, 'coopervisionpro.no'].filter(Boolean).join('.');
          break;
        case 'DE':
          tld = [hostSubdomain, 'coopervisionpro.de'].filter(Boolean).join('.');
          break;
        case 'MY':
          tld = [hostSubdomain, 'coopervisionpro.my'].filter(Boolean).join('.');
          break;
        case 'MX':
          tld = [hostSubdomain, 'coopervisionpro.com.mx'].filter(Boolean).join('.');
          break;
        case 'CH':
          tld = [hostSubdomain, 'coopervisionpro.ch'].filter(Boolean).join('.');
          break;
        default:
      }
      // If running in a remote environment with MFE hosts, use the sandbox configuration
      // console.log('envService setRemoteEnvironment(): Using current configuration', tld);
      const UcomTld = localStorage.getItem('unifiedecom-mfe-hosts') ? '' : '';
      // console.log('envService setRemoteEnvironment(): UcomTld', UcomTld);
      // console.log('[EnvService] Resolved TLD (MFE logic):', tld);
      countryOpts = env[tld];
    }

    if (!countryOpts) {
      console.error(`[EnvService] No configuration found for TLD: ${tld}. available keys:`, Object.keys(env));
      this.envData = {};
      return;
    }
    console.log('[EnvService] Found countryOpts for:', tld);

    // Region + region-scoped URLs. Prefer explicit top-level config (the
    // per-region standalone files keep SERVER_URL/AUTH0_LOGIN/REGION); fall back
    // to deriving from the country block so the single-origin merged MFE config
    // (which omits those top-level keys) resolves the same values. Region is
    // encoded in PRODUCT_EDITION_CODE (CPX<REGION>_...); the two URLs follow
    // {hostSubdomain}.api.{region} / {hostSubdomain}.provider.login.{region}.
    const region =
      env.REGION ||
      (countryOpts.PRODUCT_EDITION_CODE || '').match(/^CPX([A-Z]{2})_/)?.[1]?.toLowerCase();
    if (!region) {
      throw new Error(
        `[EnvService] Could not resolve region for TLD "${tld}": no env.REGION and ` +
        `PRODUCT_EDITION_CODE ("${countryOpts.PRODUCT_EDITION_CODE}") did not match CPX<REGION>_`
      );
    }
    const apiRegion = (hostSubdomain === 'sandbox' || env.ENV === 'sandbox') ? 'eu' : region;
    const apiBase =
      env.SERVER_URL ||
      `https://${[hostSubdomain, 'api', apiRegion, 'coopervisionpro.com'].filter(Boolean).join('.')}/`;
    const auth0Login =
      env.AUTH0_LOGIN ||
      `https://${[hostSubdomain, 'provider', 'login', region, 'coopervisionpro.com'].filter(Boolean).join('.')}`;

    this.authConfig.domain = auth0Login;
    this.authConfig.clientId = countryOpts.CLIENT_ID;
    this.authConfig.skipRedirectCallback = true;
    this.authConfig.errorPath = `${countryOpts.WEB_HOST}/access-denied`;
    this.authConfig.authorizeTimeoutInSeconds = 5;
    this.authConfig.useRefreshTokens = true;
    this.authConfig.useRefreshTokensFallback = true;
    this.authConfig.authorizationParams = {
      audience: apiBase,
      scope: env.AUTH0_SCOPE,
      redirect_uri: `${countryOpts.WEB_HOST}/authorize`,
      patientSide: true,
    };
    this.authConfig.discoveryUrl = `${auth0Login}/.well-known/openid-configuration`;
    this.authConfig.logLevel = env.ENV === 'production' ? 'ERROR' : 'DEBUG';
    this.authConfig.logoutUrl = countryOpts.SSO_LOGOUT_URL
      ? `${countryOpts.SSO_LOGOUT_URL}?CookieBypass=1&post_logout_redirect_uri=${countryOpts.WEB_HOST}/logout`
      : `${countryOpts.WEB_HOST}/logout`;

    this.envData = {
      env: env.ENV,
      showTranslationKeys: env.SHOW_TRANSLATION_KEYS,
      serverUrl: apiBase,
      auth0_audience: apiBase,
      auth0_login: auth0Login,
      build_number: env.BUILD_NUMBER,
      build_hash: env.BUILD_HASH,
      build_branch: env.BUILD_BRANCH,
      platform_version: String(env.PLATFORM_VERSION).split('.r').shift(),
      region: region,
      datadogSite: env.DATADOG_SITE,
      datadogClientId: env.DATADOG_CLIENT_ID,
      datadogClientToken: env.DATADOG_CLIENT_TOKEN,
      datadogService: env.DATADOG_SERVICE,
      datadogProxyUrl: `${apiBase}status/rum`,
      // Stripe: prefer the top-level key (legacy per-region standalone configs set
      // it); fall back to the country block so the merged single-origin config
      // (per-host keys, no top-level STRIPE_PK) bills each country's own account.
      STRIPE_PK: env.STRIPE_PK || countryOpts.STRIPE_PK,
      STRIPE_PK_TEST: env.STRIPE_PK_TEST || countryOpts.STRIPE_PK_TEST,
      smsEnabled: countryOpts.SMS_ENABLED,
      countryCode: countryOpts.COUNTRY_CODE,
      productEditionCode: countryOpts.PRODUCT_EDITION_CODE,
      EXTERNAL_LANDING_PAGE: countryOpts.EXTERNAL_LANDING_PAGE,
      patientSide: env.PATIENT_SIDE,
      DOMAIN_SCRIPT: countryOpts.DOMAIN_SCRIPT,
      inactivityTimeout: countryOpts.INACTIVITY_TIMEOUT,
      SCANDIT_KEY: countryOpts.SCANDIT_KEY,
      SSO_CONNECTION: countryOpts.SSO_CONNECTION,
      SSO_ENABLED: countryOpts.SSO_ENABLED,
      UCOM_ENABLED: countryOpts?.UCOM_ENABLED,
      UCOM_LANDING_PAGE_URL: countryOpts?.UCOM_LANDING_PAGE_URL,
      WEB_HOST: countryOpts?.WEB_HOST,
      UCOMMFE_HOST: localStorage.getItem('unifiedecom-mfe-hosts') !== null ? true : false,
      isMfe: localStorage.getItem('unifiedecom-mfe-hosts') !== null ? true : false,
    };

  }

  transformClaims(arr: any[]) {
    const result = {
      culture: "",
      country: "",

    };

    if (!Array.isArray(arr)) {
      console.error("Input is not an array");
      return result;
    }

    for (const item of arr) {
      const key = item.key;
      const value = item.value;

      switch (key) {

        case "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/country":
          result.country = value;
          break;
        case "Culture":
          result.culture = value;
          break;
      }
    }

    return result;
  }

  get environment(): any {
    return this.envData || {};
  }

  get authentication(): AuthConfig {
    return this.authConfig;
  }
}
