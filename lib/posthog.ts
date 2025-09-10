import posthog from 'posthog-js'

export function initPostHog() {
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
      
      // Configurações de captura
      capture_pageview: true,
      capture_pageleave: true,
      
      // Configurações de persistência
      persistence: 'localStorage',
      
      // Configurações de privacidade
      respect_dnt: true,
      mask_all_text: process.env.NODE_ENV === 'production',
      mask_all_element_attributes: process.env.NODE_ENV === 'production',
      
      // Configurações de debugging
      debug: process.env.NODE_ENV === 'development',
      
      // Configurações de sessão
      session_recording: {
        maskAllInputs: true,
        maskInputOptions: {
          password: true,
          email: false,
          color: false
        }
      },
      
      // Configurações de feature flags
      bootstrap: {
        featureFlags: {}
      },
      
      // Configurações de autocapture
      autocapture: {
        dom_event_allowlist: ['click', 'submit', 'change'],
        url_allowlist: [window.location.origin],
        element_allowlist: ['button', 'a', 'form'] as any
      }
    })
    
    // Configurar propriedades globais
    posthog.register({
      app_version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV
    })
  }
}

export { posthog }

// Eventos específicos da aplicação
export const analytics = {
  // Eventos de autenticação
  login: (userType: 'office' | 'provider', method: string = 'email') => {
    posthog.capture('user_login', {
      user_type: userType,
      login_method: method
    })
  },

  logout: () => {
    posthog.capture('user_logout')
  },

  register: (userType: 'office' | 'provider') => {
    posthog.capture('user_register_started', {
      user_type: userType
    })
  },

  // Eventos de prestador
  providerApplicationSubmitted: (providerId: string) => {
    posthog.capture('provider_application_submitted', {
      provider_id: providerId
    })
  },

  providerDocumentUploaded: (documentType: string) => {
    posthog.capture('provider_document_uploaded', {
      document_type: documentType
    })
  },

  providerTestSubmitted: (testType: string) => {
    posthog.capture('provider_test_submitted', {
      test_type: testType
    })
  },

  // Eventos de delegação
  delegationCreated: (delegationId: string, serviceType: string, legalArea: string) => {
    posthog.capture('delegation_created', {
      delegation_id: delegationId,
      service_type: serviceType,
      legal_area: legalArea
    })
  },

  delegationViewed: (delegationId: string) => {
    posthog.capture('delegation_viewed', {
      delegation_id: delegationId
    })
  },

  delegationResponse: (delegationId: string, response: 'accepted' | 'rejected') => {
    posthog.capture('delegation_response', {
      delegation_id: delegationId,
      response
    })
  },

  // Eventos de chat
  chatOpened: (delegationId: string) => {
    posthog.capture('chat_opened', {
      delegation_id: delegationId
    })
  },

  chatMessageSent: (delegationId: string, messageType: 'text' | 'audio' | 'file') => {
    posthog.capture('chat_message_sent', {
      delegation_id: delegationId,
      message_type: messageType
    })
  },

  audioRecorded: (duration: number) => {
    posthog.capture('audio_recorded', {
      duration_seconds: duration
    })
  },

  audioTranscribed: (confidence: number) => {
    posthog.capture('audio_transcribed', {
      transcription_confidence: confidence
    })
  },

  // Eventos de documento
  documentVersionCreated: (delegationId: string, versionNumber: number) => {
    posthog.capture('document_version_created', {
      delegation_id: delegationId,
      version_number: versionNumber
    })
  },

  documentShared: (delegationId: string, shareMethod: string) => {
    posthog.capture('document_shared', {
      delegation_id: delegationId,
      share_method: shareMethod
    })
  },

  // Eventos de busca e navegação
  searchPerformed: (query: string, filters?: Record<string, any>) => {
    posthog.capture('search_performed', {
      search_query: query,
      search_filters: filters
    })
  },

  pageViewed: (pageName: string, properties?: Record<string, any>) => {
    posthog.capture('page_viewed', {
      page_name: pageName,
      ...properties
    })
  },

  // Eventos de erro
  errorOccurred: (errorType: string, errorMessage: string, context?: Record<string, any>) => {
    posthog.capture('error_occurred', {
      error_type: errorType,
      error_message: errorMessage,
      error_context: context
    })
  },

  // Feature flags e experimentação
  featureFlagChecked: (flagName: string, value: boolean) => {
    posthog.capture('feature_flag_checked', {
      flag_name: flagName,
      flag_value: value
    })
  },

  // Eventos de performance
  performanceMetric: (metricName: string, value: number, unit: string = 'ms') => {
    posthog.capture('performance_metric', {
      metric_name: metricName,
      metric_value: value,
      metric_unit: unit
    })
  }
}

// Helper para identificar usuário
export const identifyUser = (
  userId: string, 
  userType: 'office' | 'provider', 
  properties?: Record<string, any>
) => {
  posthog.identify(userId, {
    user_type: userType,
    ...properties
  })
}

// Helper para resetar usuário
export const resetUser = () => {
  posthog.reset()
}

// Helper para capturar evento customizado
export const trackCustomEvent = (
  eventName: string, 
  properties?: Record<string, any>
) => {
  posthog.capture(eventName, properties)
}


