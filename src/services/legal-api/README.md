# Legal API Provider System - Freelaw

## Overview

An intelligent multi-provider legal API integration system that automatically selects the best provider (Escavador or Solucionare) based on:

- **Price optimization** - Chooses the cheapest provider for each operation
- **Availability** - Monitors provider health and credit limits
- **Performance** - Considers response times and reliability
- **Feature support** - Matches provider capabilities to requirements

## Key Features

### 🎯 Smart Provider Selection
- Automatic routing between Escavador and Solucionare
- Real-time provider health monitoring
- Fallback support when primary provider fails
- Cost-based selection with configurable limits

### 💰 Cost Management
- Per-operation cost tracking
- Daily/hourly spending limits with alerts
- Cost breakdown by provider and operation type
- CSV export for billing and analysis

### ⚡ Performance Optimization
- Response caching with configurable TTL
- Automatic retry with exponential backoff
- Rate limiting to prevent API throttling
- Parallel provider health checks

### 📊 Comprehensive Metrics
- Success/failure rates by provider
- Response time tracking
- Cache hit rates
- Hourly usage patterns

## Setup

### 1. Install Dependencies

```bash
npm install axios
npm install --save-dev @types/node
```

### 2. Configure Environment Variables

Add to your `.env.local` file:

```env
# Escavador API
ESCAVADOR_API_KEY=your_key_here

# Solucionare API (recommended - cheaper)
SOLUCIONARE_API_TOKEN=your_token_here
SOLUCIONARE_API_SECRET=your_secret_here
```

### 3. Import and Use

```typescript
import { getLegalApiManager } from '@/services/legal-api';

const apiManager = getLegalApiManager();

// Search will automatically use the best provider
const process = await apiManager.searchProcess('0000000-00.2024.8.26.0100');
```

## Usage Examples

### Basic Process Search
```typescript
// Automatic provider selection based on current conditions
const process = await apiManager.searchProcess('0000000-00.2024.8.26.0100');
```

### Person Search with Preferences
```typescript
const person = await apiManager.searchPerson('12345678900', {
  preferredProvider: ApiProvider.SOLUCIONARE, // Prefer cheaper provider
  cacheEnabled: true,
  cacheDuration: 86400, // Cache for 24 hours
});
```

### Search with Cost Limit
```typescript
const result = await apiManager.searchProcess('process-number', {
  maxCost: 0.30, // Maximum R$ 0.30 per search
  fallbackEnabled: true, // Try other providers if needed
});
```

### Get Provider Status
```typescript
const healthStatuses = await apiManager.getHealthStatus();
for (const status of healthStatuses) {
  console.log(`${status.provider}: ${status.isHealthy ? '✅' : '❌'}`);
  console.log(`  Credits: ${status.currentCredits}`);
  console.log(`  Success Rate: ${status.successRate}%`);
}
```

### Monitor Costs
```typescript
const costSummary = await apiManager.getCostSummary('day');
console.log(`Today's spending: R$ ${costSummary.total.toFixed(2)}`);

// Check for alerts
if (costSummary.alerts.length > 0) {
  console.warn('Cost alerts:', costSummary.alerts);
}
```

## Provider Comparison

| Feature | Escavador | Solucionare |
|---------|-----------|-------------|
| **Pricing Model** | Pay-per-use | **Subscription** ✅ |
| **Process Search** | R$ 3.00 per search | **Included** ✅ |
| **Person Search** | R$ 3.00 per search | **Included** ✅ |
| **Document Download** | R$ 0.06 per doc | **Included** ✅ |
| **Movement Tracking** | R$ 3.00 per search | **Included** ✅ |
| **Monitoring** | R$ 3.00/month per process | **Included** ✅ |
| **AI Summary** | R$ 0.08 per summary | ❌ |
| **Publication Monitoring** | ❌ | ✅ |
| **Intimation Tracking** | ❌ | ✅ |
| **Distribution Tracking** | ❌ | ✅ |
| **BigData Access** | ❌ | ✅ |
| **Webhook Support** | ❌ | ✅ |
| **Rate Limit** | 100/min | **200/min** ✅ |
| **Reliability** | 95% | **98%** ✅ |
| **Avg Response Time** | 800ms | **600ms** ✅ |

### Cost Analysis

**For 100 searches per day:**
- **Escavador**: 100 × R$ 3.00 = **R$ 300/day** = **R$ 9,000/month**
- **Solucionare**: **Fixed subscription cost** (typically much less)

**🎯 STRONG RECOMMENDATION:** Use Solucionare as primary provider. The subscription model makes it dramatically cheaper for any reasonable volume. Escavador should only be used as a fallback when Solucionare is unavailable.

## API Methods

### Core Search Methods
- `searchProcess(processNumber, options?)` - Search for legal process
- `searchPerson(document, options?)` - Search by CPF/CNPJ
- `getDocument(documentId, options?)` - Download legal document
- `trackMovements(processId, since?)` - Track process movements

### Monitoring Methods
- `getHealthStatus()` - Get all providers' health status
- `getCostSummary(period)` - Get cost breakdown
- `getUsageMetrics(since?)` - Get detailed usage metrics

### Search Options
```typescript
interface SearchOptions {
  preferredProvider?: ApiProvider;  // Force specific provider
  maxCost?: number;                 // Maximum cost per operation
  maxResponseTime?: number;         // Maximum acceptable response time
  fallbackEnabled?: boolean;        // Enable automatic fallback
  cacheEnabled?: boolean;           // Use cache (default: true)
  cacheDuration?: number;           // Cache TTL in seconds
}
```

## Monitoring Dashboard

The system provides real-time monitoring capabilities:

```typescript
// Get hourly usage pattern
const pattern = await metricsCollector.getHourlyUsagePattern(7);
// Shows average calls and costs per hour over last 7 days

// Export metrics to CSV
const csv = metricsCollector.exportToCSV(new Date('2024-01-01'));
// Export all metrics since January 1st for analysis
```

## Error Handling

The system handles various error scenarios:

- **Authentication failures** - Check API keys
- **Rate limiting** - Automatic backoff and retry
- **Insufficient credits** - Fallback to alternative provider
- **Network errors** - Retry with exponential backoff
- **Provider outages** - Automatic failover

## Best Practices

1. **Always check provider health before bulk operations**
2. **Set appropriate cost limits for your use case**
3. **Enable caching for frequently accessed data**
4. **Monitor daily costs to avoid surprises**
5. **Use webhooks (Solucionare) for real-time updates**

## Architecture

```
┌─────────────────────────────────────┐
│       Application Layer              │
└────────────┬────────────────────────┘
             │
┌────────────▼────────────────────────┐
│    LegalApiProviderManager          │
│  (Smart routing & orchestration)    │
└────────────┬────────────────────────┘
             │
      ┌──────┴──────┬──────────┐
      │             │          │
┌─────▼─────┐ ┌────▼────┐ ┌───▼────┐
│  Provider │ │  Cache  │ │Metrics │
│  Selection│ │ Manager │ │Collector│
└─────┬─────┘ └─────────┘ └────────┘
      │
┌─────┴──────────────┬───────────────┐
│                    │               │
▼                    ▼               │
┌──────────┐   ┌──────────┐         │
│Escavador │   │Solucionare│        │
│ Provider │   │  Provider │        │
└──────────┘   └──────────┘         │
                                     │
            Automatic Fallback ──────┘
```

## Troubleshooting

### No providers available
- Check API keys in environment variables
- Verify provider credits haven't been exhausted
- Check network connectivity

### High costs
- Review cost alerts and limits
- Enable caching for repeated searches
- Consider using Solucionare (cheaper)

### Slow responses
- Check provider health status
- Consider increasing cache duration
- Enable parallel searches when possible

## Future Enhancements

- [ ] Add more legal API providers
- [ ] Implement ML-based provider selection
- [ ] Add GraphQL API layer
- [ ] Create admin dashboard UI
- [ ] Add Prometheus metrics export
- [ ] Implement webhook management UI

## Support

For issues or questions about the Legal API system, check:
1. Provider health status
2. API key configuration
3. Cost limits and alerts
4. Network connectivity

---

Built with intelligence for Freelaw.AI 🚀
