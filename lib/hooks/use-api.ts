/**
 * Custom hooks for API data fetching with SWR
 * Provides caching, revalidation, and optimistic updates
 */

import useSWR, { SWRConfiguration, mutate } from 'swr'
import { toast } from 'sonner'

// Default fetcher with error handling
const fetcher = async (url: string) => {
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
}

// SWR configuration with smart defaults
const defaultConfig: SWRConfiguration = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  shouldRetryOnError: true,
  errorRetryCount: 3,
  errorRetryInterval: 5000,
  dedupingInterval: 2000,
  onError: (error) => {
    console.error('SWR Error:', error)
    if (error.status !== 404 && error.status !== 401) {
      toast.error('Erro ao carregar dados. Tentando novamente...')
    }
  },
}

// Documents Hook
export function useDocuments(page = 1, limit = 10, search = '') {
  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(search && { search }),
  })

  return useSWR(
    `/api/documents/list?${queryParams}`,
    fetcher,
    {
      ...defaultConfig,
      refreshInterval: 30000, // Refresh every 30 seconds
    }
  )
}

// Contacts Hook
export function useContacts(tipo?: string) {
  const queryParams = tipo ? `?tipo=${tipo}` : ''
  
  return useSWR(
    `/api/contacts${queryParams}`,
    fetcher,
    {
      ...defaultConfig,
      refreshInterval: 60000, // Refresh every minute
    }
  )
}

// Processes Hook
export function useProcesses(tribunal?: string, incluirMovimentacoes = false) {
  const queryParams = new URLSearchParams()
  if (tribunal) queryParams.append('tribunal', tribunal)
  if (incluirMovimentacoes) queryParams.append('incluir_movimentacoes', 'true')
  
  const url = queryParams.toString() 
    ? `/api/processes?${queryParams}`
    : '/api/processes'

  return useSWR(url, fetcher, {
    ...defaultConfig,
    refreshInterval: 120000, // Refresh every 2 minutes
  })
}

// Publications Hook
export function usePublications(startDate?: string, endDate?: string) {
  const queryParams = new URLSearchParams()
  if (startDate) queryParams.append('data_inicio', startDate)
  if (endDate) queryParams.append('data_fim', endDate)
  
  const url = queryParams.toString()
    ? `/api/publications?${queryParams}`
    : '/api/publications'

  return useSWR(url, fetcher, {
    ...defaultConfig,
    refreshInterval: 180000, // Refresh every 3 minutes
  })
}

// Dashboard Stats Hook
export function useDashboardStats(period = 30) {
  return useSWR(
    `/api/dashboard/stats?period=${period}`,
    fetcher,
    {
      ...defaultConfig,
      refreshInterval: 60000, // Refresh every minute
      revalidateOnFocus: true, // Revalidate when window gets focus
    }
  )
}

// Health Status Hook
export function useHealthStatus() {
  return useSWR('/api/health', fetcher, {
    ...defaultConfig,
    refreshInterval: 10000, // Check health every 10 seconds
    revalidateOnFocus: true,
  })
}

// Chat History Hook
export function useChatHistory(chatId?: string) {
  const url = chatId ? `/api/chat/history/${chatId}` : '/api/chat/history'
  
  return useSWR(url, fetcher, {
    ...defaultConfig,
    refreshInterval: 0, // No auto refresh for chat history
  })
}

// Office Style Hook
export function useOfficeStyle() {
  return useSWR('/api/office-style', fetcher, {
    ...defaultConfig,
    refreshInterval: 0, // No auto refresh, style doesn't change often
    revalidateOnMount: true,
  })
}

// Mutation helpers
export const apiMutate = {
  // Optimistic update for contacts
  async createContact(data: any) {
    const optimisticData = { ...data, id: Date.now(), createdAt: new Date() }
    
    try {
      await mutate(
        '/api/contacts',
        async (contacts: any) => [...(contacts || []), optimisticData],
        false
      )
      
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      
      if (!res.ok) throw new Error('Failed to create contact')
      
      const newContact = await res.json()
      mutate('/api/contacts') // Revalidate
      toast.success('Contato criado com sucesso!')
      return newContact
    } catch (error) {
      mutate('/api/contacts') // Rollback
      toast.error('Erro ao criar contato')
      throw error
    }
  },

  // Optimistic update for documents
  async updateDocument(id: string, data: any) {
    const url = `/api/documents/${id}`
    
    try {
      await mutate(
        '/api/documents/list',
        async (documents: any) => {
          if (!documents?.data) return documents
          return {
            ...documents,
            data: documents.data.map((doc: any) =>
              doc.id === id ? { ...doc, ...data } : doc
            ),
          }
        },
        false
      )
      
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      
      if (!res.ok) throw new Error('Failed to update document')
      
      mutate('/api/documents/list')
      toast.success('Documento atualizado!')
      return res.json()
    } catch (error) {
      mutate('/api/documents/list') // Rollback
      toast.error('Erro ao atualizar documento')
      throw error
    }
  },

  // Force refresh specific endpoints
  refresh: {
    documents: () => mutate('/api/documents/list'),
    contacts: () => mutate('/api/contacts'),
    processes: () => mutate('/api/processes'),
    publications: () => mutate('/api/publications'),
    dashboard: () => mutate('/api/dashboard/stats'),
    health: () => mutate('/api/health'),
  },

  // Clear all cache
  clearAll: () => mutate(() => true, undefined, { revalidate: false }),
}

// Prefetch helpers for better UX
export const prefetch = {
  documents: () => mutate('/api/documents/list', fetcher('/api/documents/list')),
  contacts: () => mutate('/api/contacts', fetcher('/api/contacts')),
  dashboard: () => mutate('/api/dashboard/stats', fetcher('/api/dashboard/stats?period=30')),
}