/**
 * Legal API Route Handler
 * Provides endpoints for legal searches using the smart provider system
 */

import { NextRequest, NextResponse } from 'next/server';
import { getLegalApiManager, ApiProvider } from '@/services/legal-api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;
    
    const apiManager = getLegalApiManager();
    
    switch (action) {
      case 'searchProcess': {
        const { processNumber, preferredProvider, maxCost } = data;
        const result = await apiManager.searchProcess(processNumber, {
          preferredProvider: preferredProvider as ApiProvider,
          maxCost,
          fallbackEnabled: true,
          cacheEnabled: true,
        });
        
        return NextResponse.json({
          success: true,
          data: result,
        });
      }
      
      case 'searchPerson': {
        const { document, preferredProvider, maxCost } = data;
        const result = await apiManager.searchPerson(document, {
          preferredProvider: preferredProvider as ApiProvider,
          maxCost,
          fallbackEnabled: true,
          cacheEnabled: true,
          cacheDuration: 86400, // 24 hours for person searches
        });
        
        return NextResponse.json({
          success: true,
          data: result,
        });
      }
      
      case 'trackMovements': {
        const { processId, since } = data;
        const result = await apiManager.trackMovements(
          processId,
          since ? new Date(since) : undefined
        );
        
        return NextResponse.json({
          success: true,
          data: result,
        });
      }
      
      case 'getDocument': {
        const { documentId } = data;
        const result = await apiManager.getDocument(documentId, {
          cacheEnabled: true,
          cacheDuration: 604800, // 7 days for documents
        });
        
        return NextResponse.json({
          success: true,
          data: result,
        });
      }
      
      case 'getProviderStatus': {
        const statuses = await apiManager.getHealthStatus();
        
        return NextResponse.json({
          success: true,
          data: statuses,
        });
      }
      
      case 'getCostSummary': {
        const { period = 'day' } = data;
        const summary = await apiManager.getCostSummary(period);
        
        return NextResponse.json({
          success: true,
          data: summary,
        });
      }
      
      case 'getMetrics': {
        const { since } = data;
        const metrics = await apiManager.getUsageMetrics(
          since ? new Date(since) : undefined
        );
        
        return NextResponse.json({
          success: true,
          data: metrics,
        });
      }
      
      default:
        return NextResponse.json(
          {
            success: false,
            error: `Unknown action: ${action}`,
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Legal API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'An error occurred',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const apiManager = getLegalApiManager();
    
    // Return provider health status for monitoring
    const statuses = await apiManager.getHealthStatus();
    const costSummary = await apiManager.getCostSummary('hour');
    
    return NextResponse.json({
      success: true,
      providers: statuses,
      costs: {
        lastHour: costSummary.total,
        alerts: costSummary.alerts,
      },
      recommendation: getProviderRecommendation(statuses),
    });
  } catch (error) {
    console.error('Legal API status error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get API status',
      },
      { status: 500 }
    );
  }
}

function getProviderRecommendation(statuses: any[]): string {
  const healthy = statuses.filter(s => s.isHealthy);
  
  if (healthy.length === 0) {
    return 'No providers currently available. Please check API credentials.';
  }
  
  const solucionare = healthy.find(s => s.provider === ApiProvider.SOLUCIONARE);
  const escavador = healthy.find(s => s.provider === ApiProvider.ESCAVADOR);
  
  if (solucionare && escavador) {
    return 'Both providers available. Using Solucionare for better pricing.';
  } else if (solucionare) {
    return 'Using Solucionare (preferred provider).';
  } else if (escavador) {
    return 'Using Escavador (Solucionare unavailable).';
  }
  
  return 'System ready.';
}