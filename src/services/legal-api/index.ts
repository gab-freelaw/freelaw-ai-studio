/**
 * Legal API Service - Intelligent Multi-Provider Integration
 */

export * from './types';
export * from './config';
export * from './provider-manager';
export * from './cache-manager';
export * from './metrics-collector';
export { EscavadorProvider } from './providers/escavador-provider';
export { SolucionareProvider } from './providers/solucionare-provider';

// Main export - ready to use provider manager
import { LegalApiProviderManager } from './provider-manager';

// Singleton instance
let providerManager: LegalApiProviderManager | null = null;

/**
 * Get or create the Legal API Provider Manager instance
 */
export function getLegalApiManager(): LegalApiProviderManager {
  if (!providerManager) {
    providerManager = new LegalApiProviderManager();
  }
  return providerManager;
}

/**
 * Reset the provider manager (useful for testing)
 */
export async function resetLegalApiManager(): Promise<void> {
  if (providerManager) {
    await providerManager.cleanup();
    providerManager = null;
  }
}