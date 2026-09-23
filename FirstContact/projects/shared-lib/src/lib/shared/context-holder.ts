/**
 * Represents the configuration and runtime context shared from the shell to the micro-frontends.
 * Exposes core fields and a listener callback to allow micro-frontends to reactively update.
 */
export interface MfeContext {
  tenantId: string | null;
  locationId: string | null;
  locationName: string | null;
  locationBPN: string | null;
  locale: string;
  countryCode: string;
  orientation: string;
  getToken: () => string | null;
  env: any;
  userProfile: any;
  onUpdate: (listener: (updatedContext: Partial<MfeContext>) => void) => () => void;
}

/**
 * Module-private reference holding the in-memory context.
 * Kept private to enforce a security boundary, preventing arbitrary window scripts 
 * from accessing credentials or mutating state.
 */
let currentContext: MfeContext | null = null;

/**
 * Registers the injected context reference from the host shell.
 * This should only be called once per remote during the bootstrap phase.
 * Storing this as a reference allows the remote MFE to retrieve updated values 
 * automatically due to JavaScript object reference pointer propagation.
 *
 * @param ctx The context object supplied by the Vue host shell.
 */
export const setMfeContext = (ctx: MfeContext) => {
  currentContext = ctx;
};

/**
 * Retrieves the currently active micro-frontend context.
 * Used by configuration files, interceptors, and services to pull configuration dynamically.
 * Throws a runtime error if accessed before bootstrapping is complete to prevent configuration initialization race conditions.
 *
 * @returns The active MfeContext object.
 */
export const getMfeContext = (): MfeContext => {
  if (!currentContext) {
    throw new Error('[MfeContextHolder] Context has not been initialized. Ensure bootstrap(context) has been called.');
  }
  return currentContext;
};

