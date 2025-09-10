'use client'

import { SWRConfig } from 'swr'
import { ReactNode } from 'react'

interface SWRProviderProps {
  children: ReactNode
}

export function SWRProvider({ children }: SWRProviderProps) {
  return (
    <SWRConfig
      value={{
        // Global configuration
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        shouldRetryOnError: true,
        errorRetryCount: 3,
        errorRetryInterval: 5000,
        dedupingInterval: 2000,
        
        // Global fetcher
        fetcher: async (url: string) => {
          const res = await fetch(url, {
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
          })

          if (!res.ok) {
            const error = new Error('An error occurred while fetching the data.')
            const data = await res.json().catch(() => ({}))
            // @ts-ignore
            error.info = data
            // @ts-ignore
            error.status = res.status
            throw error
          }

          return res.json()
        },
        
        // Provider configuration
        provider: () => new Map(),
        isOnline() {
          return navigator.onLine
        },
        isVisible() {
          return document.visibilityState === 'visible'
        },
        initFocus(callback) {
          let appState = 'active'

          const onAppStateChange = () => {
            if (appState === 'background' && document.visibilityState === 'visible') {
              callback()
            }
            appState = document.visibilityState === 'visible' ? 'active' : 'background'
          }

          // Subscribe to visibility change
          document.addEventListener('visibilitychange', onAppStateChange, false)

          return () => {
            document.removeEventListener('visibilitychange', onAppStateChange)
          }
        },
        initReconnect(callback) {
          let previousOnline = navigator.onLine

          const onOnline = () => {
            if (!previousOnline) {
              previousOnline = true
              callback()
            }
          }

          const onOffline = () => {
            previousOnline = false
          }

          window.addEventListener('online', onOnline)
          window.addEventListener('offline', onOffline)

          return () => {
            window.removeEventListener('online', onOnline)
            window.removeEventListener('offline', onOffline)
          }
        },
      }}
    >
      {children}
    </SWRConfig>
  )
}