import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Configurações de performance
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Configurações de debugging
  debug: process.env.NODE_ENV === 'development',
  
  // Configurações de release
  release: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  environment: process.env.NODE_ENV,
  
  // Simplified integrations - remove problematic imports
  integrations: [
    // Removed BrowserTracing and Replay to fix import errors
  ],
  
  // Configurações de replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  
  // Filtros de erro para reduzir ruído
  beforeSend(event) {
    // Skip sending events in test mode
    if (process.env.NEXT_PUBLIC_E2E === 'true' || process.env.NODE_ENV === 'test') {
      return null;
    }
    
    // Filtrar erros conhecidos/irrelevantes
    if (event.exception) {
      const error = event.exception.values?.[0];
      
      // Filtrar erros de rede comuns
      if (error?.type === 'NetworkError' || error?.type === 'ChunkLoadError') {
        return null;
      }
      
      // Filtrar erros de browser extensions
      if (error?.stacktrace?.frames?.some(frame => 
        frame.filename?.includes('extension://') || 
        frame.filename?.includes('chrome-extension://')
      )) {
        return null;
      }
    }
    
    return event;
  },
  
  // Configuração de tags padrão
  initialScope: {
    tags: {
      component: 'freelaw-client'
    }
  }
});

// Required hooks for Next.js
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
