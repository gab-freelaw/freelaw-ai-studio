/**
 * Legal Search Component
 * Example implementation using the smart API provider system
 */

'use client';

import { useState } from 'react';
import { Search, User, FileText, TrendingUp, AlertCircle, DollarSign } from 'lucide-react';
import { useLegalApi, useLegalApiStatus } from '@/hooks/use-legal-api';
import { ApiProvider } from '@/services/legal-api/types';

export function LegalSearch() {
  const [searchType, setSearchType] = useState<'process' | 'person'>('process');
  const [searchValue, setSearchValue] = useState('');
  const [result, setResult] = useState<any>(null);
  
  const { searchProcess, searchPerson, loading, error } = useLegalApi({
    preferredProvider: ApiProvider.SOLUCIONARE, // Prefer cheaper provider
    maxCost: 1.00, // Maximum R$ 1.00 per search
    onError: (err) => console.error('Search error:', err),
  });
  
  const { status, fetchStatus } = useLegalApiStatus();
  
  const handleSearch = async () => {
    if (!searchValue) return;
    
    try {
      let searchResult;
      if (searchType === 'process') {
        searchResult = await searchProcess(searchValue);
      } else {
        searchResult = await searchPerson(searchValue);
      }
      setResult(searchResult);
    } catch (err) {
      console.error('Search failed:', err);
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Provider Status Bar */}
      <div className="bg-muted rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">API Provider Status</h3>
          <button
            onClick={fetchStatus}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Refresh
          </button>
        </div>
        
        {status && (
          <div className="space-y-2">
            <div className="flex gap-4">
              {status.providers.map((provider) => (
                <div
                  key={provider.provider}
                  className="flex items-center gap-2"
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      provider.isHealthy ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  />
                  <span className="text-sm">
                    {provider.provider}: {provider.successRate.toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                <span>Last hour: R$ {status.costs.lastHour.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                <span>{status.recommendation}</span>
              </div>
            </div>
            
            {status.costs.alerts.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-orange-600">
                <AlertCircle className="w-4 h-4" />
                <span>{status.costs.alerts[0]}</span>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Search Interface */}
      <div className="space-y-4">
        <div className="flex gap-2">
          <button
            onClick={() => setSearchType('process')}
            className={`px-4 py-2 rounded-md ${
              searchType === 'process'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted'
            }`}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            Process Search
          </button>
          <button
            onClick={() => setSearchType('person')}
            className={`px-4 py-2 rounded-md ${
              searchType === 'person'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted'
            }`}
          >
            <User className="w-4 h-4 inline mr-2" />
            Person Search
          </button>
        </div>
        
        <div className="flex gap-2">
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder={
              searchType === 'process'
                ? 'Enter process number'
                : 'Enter CPF or CNPJ'
            }
            className="flex-1 px-4 py-2 border rounded-md"
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button
            onClick={handleSearch}
            disabled={loading || !searchValue}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-md disabled:opacity-50"
          >
            {loading ? (
              <span className="animate-pulse">Searching...</span>
            ) : (
              <>
                <Search className="w-4 h-4 inline mr-2" />
                Search
              </>
            )}
          </button>
        </div>
        
        {error && (
          <div className="p-4 bg-destructive/10 text-destructive rounded-md">
            <AlertCircle className="w-4 h-4 inline mr-2" />
            {error.message}
          </div>
        )}
      </div>
      
      {/* Search Results */}
      {result && (
        <div className="border rounded-lg p-6 space-y-4">
          <h3 className="text-lg font-semibold">Search Results</h3>
          
          {searchType === 'process' ? (
            <div className="space-y-2">
              <div>
                <span className="font-medium">Process Number:</span>{' '}
                {result.number}
              </div>
              <div>
                <span className="font-medium">Court:</span> {result.court}
              </div>
              <div>
                <span className="font-medium">Status:</span>{' '}
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    result.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {result.status}
                </span>
              </div>
              <div>
                <span className="font-medium">Plaintiffs:</span>{' '}
                {result.parties.plaintiff.join(', ')}
              </div>
              <div>
                <span className="font-medium">Defendants:</span>{' '}
                {result.parties.defendant.join(', ')}
              </div>
              {result.value && (
                <div>
                  <span className="font-medium">Value:</span> R${' '}
                  {result.value.toLocaleString('pt-BR')}
                </div>
              )}
              <div>
                <span className="font-medium">Last Update:</span>{' '}
                {new Date(result.lastUpdate).toLocaleDateString('pt-BR')}
              </div>
              {result.movements.length > 0 && (
                <div>
                  <span className="font-medium">Recent Movements:</span>
                  <div className="mt-2 space-y-1">
                    {result.movements.slice(0, 3).map((mov: any) => (
                      <div
                        key={mov.id}
                        className="text-sm text-muted-foreground"
                      >
                        {new Date(mov.date).toLocaleDateString('pt-BR')} -{' '}
                        {mov.description}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <div>
                <span className="font-medium">Name:</span> {result.name}
              </div>
              <div>
                <span className="font-medium">Document:</span> {result.document}{' '}
                ({result.documentType})
              </div>
              <div>
                <span className="font-medium">Processes:</span>{' '}
                {result.processes.length} found
              </div>
              {result.processes.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h4 className="font-medium">Process List:</h4>
                  {result.processes.slice(0, 5).map((proc: any) => (
                    <div
                      key={proc.id}
                      className="p-3 bg-muted rounded-md text-sm"
                    >
                      <div>{proc.number}</div>
                      <div className="text-muted-foreground">
                        {proc.court} - Role: {proc.role}
                      </div>
                    </div>
                  ))}
                  {result.processes.length > 5 && (
                    <div className="text-sm text-muted-foreground">
                      ... and {result.processes.length - 5} more
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}