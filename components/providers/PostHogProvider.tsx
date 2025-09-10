'use client'

import { useEffect } from 'react'
// import { useUser } from '@supabase/auth-helpers-react'
import { initPostHog, identifyUser, resetUser } from '@/lib/posthog'

interface PostHogProviderProps {
  children: React.ReactNode
}

export function PostHogProvider({ children }: PostHogProviderProps) {
  // const user = useUser()

  useEffect(() => {
    // Inicializar PostHog apenas no cliente
    if (typeof window !== 'undefined') {
      initPostHog()
    }
  }, [])

  // useEffect(() => {
  //   if (user) {
  //     // Identificar usuário quando fazer login
  //     const userType = user.user_metadata?.user_type || 'office'
  //     identifyUser(user.id, userType, {
  //       email: user.email,
  //       created_at: user.created_at,
  //       organization_id: user.user_metadata?.organization_id
  //     })
  //   } else {
  //     // Reset quando fazer logout
  //     resetUser()
  //   }
  // }, [user])

  return <>{children}</>
}


