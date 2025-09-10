/**
 * Legal API Usage Examples
 */

import { getLegalApiManager, ApiProvider, SearchOptions } from './index';

async function runExamples() {
  console.log('🚀 Freelaw Legal API Provider System - Examples\n');
  console.log('=' .repeat(60));
  
  const apiManager = getLegalApiManager();
  
  // Example 1: Basic process search (automatic provider selection)
  console.log('\n📋 Example 1: Process Search with Automatic Provider Selection');
  try {
    const processResult = await apiManager.searchProcess('0000000-00.2024.8.26.0100');
    console.log('✅ Process found:', {
      number: processResult.number,
      court: processResult.court,
      status: processResult.status,
      parties: processResult.parties,
    });
  } catch (error) {
    console.error('❌ Process search failed:', error);
  }
  
  // Example 2: Person search with preferred provider
  console.log('\n👤 Example 2: Person Search with Preferred Provider');
  try {
    const options: SearchOptions = {
      preferredProvider: ApiProvider.SOLUCIONARE, // Prefer Solucionare (cheaper)
      cacheEnabled: true,
      cacheDuration: 86400, // Cache for 24 hours
    };
    
    const personResult = await apiManager.searchPerson('12345678900', options);
    console.log('✅ Person found:', {
      name: personResult.name,
      document: personResult.document,
      processCount: personResult.processes.length,
    });
  } catch (error) {
    console.error('❌ Person search failed:', error);
  }
  
  // Example 3: Search with cost limit
  console.log('\n💰 Example 3: Search with Cost Limit');
  try {
    const options: SearchOptions = {
      maxCost: 0.30, // Maximum R$ 0.30 per search
      fallbackEnabled: true, // Enable fallback to other providers
    };
    
    const result = await apiManager.searchProcess('1234567-89.2024.8.26.0100', options);
    console.log('✅ Process found within cost limit');
  } catch (error) {
    console.error('❌ Search failed:', error);
  }
  
  // Example 4: Get provider health status
  console.log('\n🏥 Example 4: Provider Health Status');
  const healthStatuses = await apiManager.getHealthStatus();
  
  for (const status of healthStatuses) {
    const icon = status.isHealthy ? '✅' : '❌';
    console.log(`${icon} ${status.provider}:`, {
      healthy: status.isHealthy,
      successRate: `${status.successRate.toFixed(1)}%`,
      avgResponseTime: `${status.averageResponseTime}ms`,
      credits: status.currentCredits,
    });
  }
  
  // Example 5: Get cost summary
  console.log('\n📊 Example 5: Cost Summary (Last Hour)');
  const costSummary = await apiManager.getCostSummary('hour');
  
  console.log('Total cost:', `R$ ${costSummary.total.toFixed(2)}`);
  console.log('By provider:');
  for (const [provider, cost] of Object.entries(costSummary.byProvider)) {
    console.log(`  - ${provider}: R$ ${cost.toFixed(2)}`);
  }
  console.log('By operation:');
  for (const [operation, cost] of Object.entries(costSummary.byOperation)) {
    console.log(`  - ${operation}: R$ ${cost.toFixed(2)}`);
  }
  
  if (costSummary.alerts.length > 0) {
    console.log('⚠️  Alerts:');
    for (const alert of costSummary.alerts) {
      console.log(`  - ${alert}`);
    }
  }
  
  // Example 6: Track movements with webhook support
  console.log('\n🔄 Example 6: Movement Tracking');
  try {
    const movements = await apiManager.trackMovements(
      'process-id-123',
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
    );
    
    console.log(`Found ${movements.length} movements in the last 7 days`);
    if (movements.length > 0) {
      console.log('Latest movement:', {
        date: movements[0].date,
        type: movements[0].type,
        description: movements[0].description,
      });
    }
  } catch (error) {
    console.error('❌ Movement tracking failed:', error);
  }
  
  // Example 7: Get usage metrics
  console.log('\n📈 Example 7: Usage Metrics');
  const metrics = await apiManager.getUsageMetrics(
    new Date(Date.now() - 60 * 60 * 1000) // Last hour
  );
  
  const successCount = metrics.filter(m => m.success).length;
  const totalCount = metrics.length;
  const totalCost = metrics.reduce((sum, m) => sum + m.cost, 0);
  const avgResponseTime = metrics.reduce((sum, m) => sum + m.responseTime, 0) / (totalCount || 1);
  
  console.log('Metrics (last hour):');
  console.log(`  - Total API calls: ${totalCount}`);
  console.log(`  - Success rate: ${totalCount > 0 ? (successCount / totalCount * 100).toFixed(1) : 0}%`);
  console.log(`  - Total cost: R$ ${totalCost.toFixed(2)}`);
  console.log(`  - Avg response time: ${avgResponseTime.toFixed(0)}ms`);
  
  // Cleanup
  await apiManager.cleanup();
  console.log('\n✅ Examples completed and resources cleaned up');
}

// Run examples if this file is executed directly
if (require.main === module) {
  runExamples()
    .then(() => {
      console.log('\n🎉 All examples completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Examples failed:', error);
      process.exit(1);
    });
}

export { runExamples };