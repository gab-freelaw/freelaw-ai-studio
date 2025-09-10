/**
 * React Hook for Legal API Integration
 */

import { useState, useCallback } from 'react';
import { 
  ProcessSearchResult, 
  PersonSearchResult, 
  ProcessMovement,
  LegalDocument,
  ProviderHealthStatus,
  ApiProvider 
} from '@/services/legal-api/types';

interface UseLegalApiOptions {
  preferredProvider?: ApiProvider;
  maxCost?: number;
  onError?: (error: Error) => void;
}

export function useLegalApi(options: UseLegalApiOptions = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const makeRequest = useCallback(async (action: string, data: any) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/legal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          data: {
            ...data,
            preferredProvider: options.preferredProvider,
            maxCost: options.maxCost,
          },
        }),
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Request failed');
      }
      
      return result.data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      options.onError?.(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [options]);
  
  const searchProcess = useCallback(async (processNumber: string): Promise<ProcessSearchResult> => {
    return makeRequest('searchProcess', { processNumber });
  }, [makeRequest]);
  
  const searchPerson = useCallback(async (document: string): Promise<PersonSearchResult> => {
    return makeRequest('searchPerson', { document });
  }, [makeRequest]);
  
  const trackMovements = useCallback(async (
    processId: string, 
    since?: Date
  ): Promise<ProcessMovement[]> => {
    return makeRequest('trackMovements', { processId, since: since?.toISOString() });
  }, [makeRequest]);
  
  const getDocument = useCallback(async (documentId: string): Promise<LegalDocument> => {
    return makeRequest('getDocument', { documentId });
  }, [makeRequest]);
  
  const getProviderStatus = useCallback(async (): Promise<ProviderHealthStatus[]> => {
    return makeRequest('getProviderStatus', {});
  }, [makeRequest]);
  
  const getCostSummary = useCallback(async (
    period: 'hour' | 'day' | 'week' | 'month' = 'day'
  ) => {
    return makeRequest('getCostSummary', { period });
  }, [makeRequest]);
  
  const getMetrics = useCallback(async (since?: Date) => {
    return makeRequest('getMetrics', { since: since?.toISOString() });
  }, [makeRequest]);
  
  return {
    // State
    loading,
    error,
    
    // Core methods
    searchProcess,
    searchPerson,
    trackMovements,
    getDocument,
    
    // Monitoring methods
    getProviderStatus,
    getCostSummary,
    getMetrics,
  };
}

// Hook for provider status monitoring
export function useLegalApiStatus() {
  const [status, setStatus] = useState<{
    providers: ProviderHealthStatus[];
    costs: {
      lastHour: number;
      alerts: string[];
    };
    recommendation: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const fetchStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/legal');
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to get status');
      }
      
      setStatus(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);
  
  return {
    status,
    loading,
    error,
    fetchStatus,
  };
}