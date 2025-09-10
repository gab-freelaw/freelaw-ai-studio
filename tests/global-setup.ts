import { FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  // Set environment variables for tests
  process.env.NEXT_PUBLIC_E2E = 'true';
  process.env.NODE_ENV = 'test';
  
  console.log('🔧 Global setup: Test environment variables set');
}

export default globalSetup;




