import * as Sentry from '@sentry/nextjs';

export async function register() {
  // Disable Sentry entirely in E2E/CI test mode
  if (process.env.NEXT_PUBLIC_E2E === 'true' || process.env.NODE_ENV === 'test') {
    return;
  }
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Configuração do servidor
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      debug: process.env.NODE_ENV === 'development',
      release: process.env.APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV,
      integrations: [
        // ProfilingIntegration desabilitado para testes
        // new Sentry.ProfilingIntegration(),
      ],
      // profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      beforeSend(event) {
        if (process.env.NODE_ENV === 'development' && event.level === 'info') {
          return null;
        }
        
        if (event.request?.headers?.['x-user-id']) {
          event.user = {
            id: event.request.headers['x-user-id']
          };
        }
        
        return event;
      },
      initialScope: {
        tags: {
          component: 'freelaw-server'
        }
      }
    });
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    // Configuração para edge runtime
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      tracesSampleRate: 1.0,
      debug: false,
      release: process.env.APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV,
      initialScope: {
        tags: {
          component: 'freelaw-edge'
        }
      }
    });
  }
}

// Required hooks for Next.js
export const onRequestError = Sentry.captureRequestError;
