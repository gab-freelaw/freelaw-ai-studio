/**
 * Feature Flags System
 * Centralized feature management for the application
 * 
 * Usage:
 * import { features, isFeatureEnabled } from '@/lib/features'
 * 
 * if (isFeatureEnabled('CHAT_STREAMING')) {
 *   // Use streaming chat
 * }
 */

export interface FeatureFlag {
  name: string
  description: string
  enabled: boolean
  rolloutPercentage?: number
  enabledForUsers?: string[]
  metadata?: Record<string, any>
}

// Feature definitions
const featureDefinitions: Record<string, FeatureFlag> = {
  // Chat Features
  CHAT_STREAMING: {
    name: 'Chat Streaming',
    description: 'Enable streaming responses in chat',
    enabled: process.env.NEXT_PUBLIC_FEATURE_CHAT_STREAMING === 'true',
    rolloutPercentage: 100
  },
  
  CHAT_VOICE: {
    name: 'Voice Chat',
    description: 'Enable voice input/output in chat',
    enabled: process.env.NEXT_PUBLIC_FEATURE_CHAT_VOICE === 'true',
    rolloutPercentage: 0
  },
  
  // AI Features
  AI_MODEL_SELECTION: {
    name: 'AI Model Selection',
    description: 'Allow users to choose AI model',
    enabled: process.env.NEXT_PUBLIC_FEATURE_AI_MODEL_SELECTION === 'true' || true,
    rolloutPercentage: 100
  },
  
  AI_PREDICTIVE: {
    name: 'Predictive AI',
    description: 'Enable predictive success analysis',
    enabled: process.env.NEXT_PUBLIC_FEATURE_AI_PREDICTIVE === 'true',
    rolloutPercentage: 50
  },
  
  // Premium Features
  PREMIUM_TEMPLATES: {
    name: 'Premium Templates',
    description: 'Access to premium document templates',
    enabled: process.env.NEXT_PUBLIC_FEATURE_PREMIUM_TEMPLATES === 'true',
    rolloutPercentage: 100,
    metadata: {
      requiredPlan: 'pro'
    }
  },
  
  PREMIUM_SUPPORT: {
    name: 'Premium Support',
    description: 'Priority support channel',
    enabled: process.env.NEXT_PUBLIC_FEATURE_PREMIUM_SUPPORT === 'true',
    rolloutPercentage: 100,
    metadata: {
      requiredPlan: 'pro'
    }
  },
  
  // Collaboration Features
  COLLABORATION: {
    name: 'Real-time Collaboration',
    description: 'Enable real-time document collaboration',
    enabled: process.env.NEXT_PUBLIC_FEATURE_COLLABORATION === 'true',
    rolloutPercentage: 0
  },
  
  TEAM_CHAT: {
    name: 'Team Chat',
    description: 'Internal team messaging',
    enabled: process.env.NEXT_PUBLIC_FEATURE_TEAM_CHAT === 'true',
    rolloutPercentage: 25
  },
  
  // Integration Features
  TRIBUNAL_INTEGRATION: {
    name: 'Tribunal Integration',
    description: 'Direct integration with court systems',
    enabled: process.env.NEXT_PUBLIC_FEATURE_TRIBUNAL_INTEGRATION === 'true',
    rolloutPercentage: 0
  },
  
  WHATSAPP_INTEGRATION: {
    name: 'WhatsApp Integration',
    description: 'Send notifications via WhatsApp',
    enabled: process.env.NEXT_PUBLIC_FEATURE_WHATSAPP === 'true',
    rolloutPercentage: 75
  },
  
  // Experimental Features
  EXPERIMENTAL_UI: {
    name: 'Experimental UI',
    description: 'New UI components and layouts',
    enabled: process.env.NEXT_PUBLIC_FEATURE_EXPERIMENTAL_UI === 'true',
    rolloutPercentage: 10
  },
  
  DARK_MODE: {
    name: 'Dark Mode',
    description: 'Dark theme support',
    enabled: process.env.NEXT_PUBLIC_FEATURE_DARK_MODE === 'true' || true,
    rolloutPercentage: 100
  },
  
  // Mobile Features
  MOBILE_APP: {
    name: 'Mobile App',
    description: 'Mobile application support',
    enabled: process.env.NEXT_PUBLIC_FEATURE_MOBILE_APP === 'true',
    rolloutPercentage: 0
  },
  
  OFFLINE_MODE: {
    name: 'Offline Mode',
    description: 'Work offline with sync',
    enabled: process.env.NEXT_PUBLIC_FEATURE_OFFLINE_MODE === 'true',
    rolloutPercentage: 0
  },
  
  // Analytics Features
  ANALYTICS_DASHBOARD: {
    name: 'Analytics Dashboard',
    description: 'Advanced analytics and insights',
    enabled: process.env.NEXT_PUBLIC_FEATURE_ANALYTICS === 'true',
    rolloutPercentage: 50
  },
  
  USAGE_TRACKING: {
    name: 'Usage Tracking',
    description: 'Track feature usage and performance',
    enabled: process.env.NEXT_PUBLIC_FEATURE_USAGE_TRACKING === 'true' || true,
    rolloutPercentage: 100
  },
  
  // Security Features
  TWO_FACTOR_AUTH: {
    name: 'Two Factor Authentication',
    description: 'Enhanced security with 2FA',
    enabled: process.env.NEXT_PUBLIC_FEATURE_2FA === 'true',
    rolloutPercentage: 100
  },
  
  IP_RESTRICTION: {
    name: 'IP Restriction',
    description: 'Restrict access by IP address',
    enabled: process.env.NEXT_PUBLIC_FEATURE_IP_RESTRICTION === 'true',
    rolloutPercentage: 100,
    metadata: {
      requiredPlan: 'enterprise'
    }
  },
  
  // Automation Features
  AUTO_SAVE: {
    name: 'Auto Save',
    description: 'Automatically save work',
    enabled: process.env.NEXT_PUBLIC_FEATURE_AUTO_SAVE === 'true' || true,
    rolloutPercentage: 100
  },
  
  WORKFLOW_AUTOMATION: {
    name: 'Workflow Automation',
    description: 'Automated workflow triggers',
    enabled: process.env.NEXT_PUBLIC_FEATURE_WORKFLOW_AUTOMATION === 'true',
    rolloutPercentage: 25
  }
}

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(
  featureName: keyof typeof featureDefinitions,
  userId?: string
): boolean {
  const feature = featureDefinitions[featureName]
  
  if (!feature) {
    console.warn(`Feature ${featureName} not found`)
    return false
  }
  
  // Check if feature is globally disabled
  if (!feature.enabled) {
    return false
  }
  
  // Check if user is in the enabled list
  if (feature.enabledForUsers && userId) {
    return feature.enabledForUsers.includes(userId)
  }
  
  // Check rollout percentage
  if (feature.rolloutPercentage !== undefined && feature.rolloutPercentage < 100) {
    // Use a deterministic hash based on userId if available
    if (userId) {
      const hash = hashCode(userId + featureName)
      const percentage = Math.abs(hash) % 100
      return percentage < feature.rolloutPercentage
    }
    // Random rollout if no userId
    return Math.random() * 100 < feature.rolloutPercentage
  }
  
  return true
}

/**
 * Get all features with their current status
 */
export function getAllFeatures(): Record<string, FeatureFlag> {
  return featureDefinitions
}

/**
 * Get enabled features for a user
 */
export function getEnabledFeatures(userId?: string): string[] {
  return Object.keys(featureDefinitions).filter(featureName => 
    isFeatureEnabled(featureName as keyof typeof featureDefinitions, userId)
  )
}

/**
 * Check if user has required plan for feature
 */
export function hasRequiredPlan(
  featureName: keyof typeof featureDefinitions,
  userPlan: string
): boolean {
  const feature = featureDefinitions[featureName]
  
  if (!feature || !feature.metadata?.requiredPlan) {
    return true
  }
  
  const planHierarchy = ['free', 'pro', 'enterprise']
  const requiredPlanIndex = planHierarchy.indexOf(feature.metadata.requiredPlan)
  const userPlanIndex = planHierarchy.indexOf(userPlan)
  
  return userPlanIndex >= requiredPlanIndex
}

/**
 * Simple hash function for deterministic rollout
 */
function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return hash
}

/**
 * Feature flags object for direct access
 * @deprecated Use isFeatureEnabled() instead
 */
export const features = Object.keys(featureDefinitions).reduce((acc, key) => {
  acc[key] = featureDefinitions[key].enabled
  return acc
}, {} as Record<string, boolean>)

/**
 * React Hook for using feature flags
 */
export function useFeature(featureName: keyof typeof featureDefinitions, userId?: string): boolean {
  return isFeatureEnabled(featureName, userId)
}

// Export type for TypeScript
export type FeatureName = keyof typeof featureDefinitions