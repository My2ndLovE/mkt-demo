# Sync Module

The Sync Module provides automated third-party API integration for result synchronization, eliminating manual result entry and ensuring timely bet processing.

## Features

### Automated Daily Sync

**Schedule**: Every day at 9 PM SGT (Singapore Time, GMT+8)

**Functionality**:
- Automatically fetches draw results from all active providers
- Checks for new results daily
- Processes matched bets automatically
- Calculates commissions on winning bets

**Provider Support**:
- Magayo API (primary)
- Extensible for additional providers

### Manual Sync

Admins can trigger synchronization on-demand for:
- Emergency result updates
- Historical data backfill
- Testing purposes
- Missed automated syncs

### Bulk Sync

Process multiple dates in a single operation:
- Useful for initial setup
- Historical data import
- Recovery from extended outages

## API Endpoints

### Manual Sync

```http
POST /api/sync/manual
Authorization: Bearer {admin_jwt_token}
Content-Type: application/json

{
  "providerCode": "SG",
  "drawDate": "2025-01-18",
  "syncProvider": "magayo"
}
```

**Response**:
```json
{
  "success": true,
  "provider": "SG",
  "drawDate": "2025-01-18",
  "resultId": 123,
  "betsProcessed": 45
}
```

**Error Response**:
```json
{
  "success": false,
  "provider": "SG",
  "drawDate": "2025-01-18",
  "error": "API unavailable: Connection timeout"
}
```

### Bulk Sync

```http
POST /api/sync/bulk
Authorization: Bearer {admin_jwt_token}
Content-Type: application/json

{
  "providerCode": "SG",
  "startDate": "2025-01-01",
  "endDate": "2025-01-31"
}
```

**Response**:
```json
[
  {
    "success": true,
    "provider": "SG",
    "drawDate": "2025-01-01",
    "resultId": 100,
    "betsProcessed": 20
  },
  {
    "success": true,
    "provider": "SG",
    "drawDate": "2025-01-02",
    "resultId": 101,
    "betsProcessed": 25
  }
]
```

**Use Cases**:
- Initial system setup (import last 90 days)
- Recovery from prolonged API outage
- Historical analysis requirements

**Rate Limiting**: 1.5 second delay between each date to avoid API throttling

### Check Sync Status

```http
GET /api/sync/status?providerCode=SG&drawDate=2025-01-18
Authorization: Bearer {jwt_token}
```

**Response (Synced)**:
```json
{
  "synced": true,
  "provider": "SG",
  "drawDate": "2025-01-18",
  "result": {
    "id": 123,
    "drawNumber": "SG-20250118-001",
    "firstPrize": "1234",
    "secondPrize": "5678",
    "thirdPrize": "9012",
    "createdAt": "2025-01-18T21:05:30Z"
  }
}
```

**Response (Not Synced)**:
```json
{
  "synced": false,
  "provider": "SG",
  "drawDate": "2025-01-18",
  "message": "No result found for this date"
}
```

**Access**: ADMIN, MODERATOR

### Get Sync History

```http
GET /api/sync/history?limit=50
Authorization: Bearer {jwt_token}
```

**Response**:
```json
[
  {
    "id": 1,
    "action": "MANUAL_RESULT_SYNC",
    "metadata": {
      "provider": "SG",
      "drawDate": "2025-01-18",
      "success": true,
      "resultId": 123,
      "betsProcessed": 45
    },
    "createdAt": "2025-01-18T14:30:00Z"
  },
  {
    "id": 2,
    "action": "AUTOMATED_RESULT_SYNC",
    "metadata": {
      "timestamp": "2025-01-17T21:00:00Z",
      "total": 5,
      "successful": 5,
      "failed": 0
    },
    "createdAt": "2025-01-17T21:05:00Z"
  }
]
```

**Access**: ADMIN, MODERATOR

**Query Parameters**:
- `limit` (optional): Number of records (default: 50, max: 500)

### Trigger Daily Sync (Testing)

```http
POST /api/sync/trigger-daily
Authorization: Bearer {admin_jwt_token}
```

**Response**:
```json
{
  "message": "Daily sync job triggered",
  "note": "Check logs and audit trail for results"
}
```

**Access**: ADMIN only

**Use Case**: Testing the automated sync job without waiting for 9 PM

## Magayo API Integration

### Configuration

Set environment variables for Magayo API:

```env
# Magayo API Configuration
MAGAYO_API_URL=https://api.magayo.com
MAGAYO_API_KEY=your-api-key-here
NODE_ENV=production
```

**Development Mode**: When `NODE_ENV=development` and API fails, the system automatically falls back to mock data for testing.

### API Request Format

```
GET {MAGAYO_API_URL}/results/{providerCode}/{drawDate}
Headers:
  X-API-Key: {MAGAYO_API_KEY}
  Content-Type: application/json
```

**Example**:
```
GET https://api.magayo.com/results/SG/2025-01-18
X-API-Key: abc123xyz
```

### Expected Response Format

```json
{
  "provider": "SG",
  "drawDate": "2025-01-18",
  "drawNumber": "SG-20250118-001",
  "prizes": {
    "first": "1234",
    "second": "5678",
    "third": "9012",
    "starter": ["1111", "2222", "3333", "4444", "5555", "6666", "7777", "8888", "9999", "0000"],
    "consolation": ["1112", "2223", "3334", "4445", "5556", "6667", "7778", "8889", "9990", "0001"]
  }
}
```

**Supported Providers**:
- `SG`: Singapore Pools
- `MY`: Magnum Malaysia
- `DMC`: Damacai Malaysia
- `STC`: Sports Toto Malaysia
- `SB`: Sabah 88
- `SWK`: Sarawak Cash Sweep
- `SD`: Sandakan 4D

### Error Handling

**API Errors**:
- Connection timeout (10 seconds)
- Invalid API key (401)
- Rate limit exceeded (429)
- Provider not found (404)
- Result not yet available (404)

**Retry Logic**:
- **Max Retries**: 3 attempts
- **Delays**: 2s, 4s, 6s (linear backoff)
- **Total Max Time**: ~12 seconds per date

**Fallback Strategy**:
1. Primary: Magayo API
2. Development: Mock data generator
3. Production Failure: Log error, manual sync required

## Automated Sync Workflow

```
Daily at 9 PM SGT
    ↓
Get All Active Providers
    ↓
For Each Provider:
    ↓
Check if Result Exists for Today
    ↓ (if not exists)
Fetch from Magayo API
    ↓
Retry up to 3 times on failure
    ↓ (on success)
Create DrawResult Record
    ↓
ResultsService.create()
    ↓
Process All Pending Bets
    ↓
Update Bet Status (WON/LOST/PARTIAL)
    ↓
Calculate Commissions
    ↓
CommissionsService.calculateAndCreateCommissions()
    ↓
Log to Audit Trail
    ↓
1 second delay before next provider
    ↓
Repeat for Next Provider
    ↓
Log Sync Summary
```

## Database Schema

### Audit Log Entries

The sync module creates audit log entries for tracking:

**Manual Sync**:
```json
{
  "action": "MANUAL_RESULT_SYNC",
  "metadata": {
    "provider": "SG",
    "drawDate": "2025-01-18",
    "success": true,
    "resultId": 123,
    "error": null
  }
}
```

**Automated Sync**:
```json
{
  "action": "AUTOMATED_RESULT_SYNC",
  "metadata": {
    "timestamp": "2025-01-18T21:00:00Z",
    "total": 5,
    "successful": 5,
    "failed": 0,
    "results": [
      {
        "provider": "SG",
        "success": true,
        "resultId": 123,
        "betsProcessed": 45
      }
    ]
  }
}
```

**Bulk Sync**:
```json
{
  "action": "BULK_RESULT_SYNC",
  "metadata": {
    "provider": "SG",
    "startDate": "2025-01-01",
    "endDate": "2025-01-31",
    "total": 31,
    "successful": 30,
    "failed": 1
  }
}
```

## Testing

### Unit Tests

```bash
cd backend
pnpm test sync.service.spec.ts
```

**Coverage**:
- syncProviderResults (new, existing, API failure)
- manualSync with audit logging
- getSyncHistory retrieval
- getSyncStatus (synced/not synced)
- bulkSync date range iteration
- handleDailySync with multiple providers

### Manual Testing

1. **Manual Sync (Single Date)**:
```bash
curl -X POST http://localhost:3000/api/sync/manual \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "providerCode": "SG",
    "drawDate": "2025-01-18",
    "syncProvider": "magayo"
  }'
```

2. **Check Sync Status**:
```bash
curl http://localhost:3000/api/sync/status?providerCode=SG&drawDate=2025-01-18 \
  -H "Authorization: Bearer JWT_TOKEN"
```

3. **View Sync History**:
```bash
curl http://localhost:3000/api/sync/history?limit=10 \
  -H "Authorization: Bearer JWT_TOKEN"
```

4. **Trigger Daily Sync**:
```bash
curl -X POST http://localhost:3000/api/sync/trigger-daily \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

5. **Bulk Sync (Date Range)**:
```bash
curl -X POST http://localhost:3000/api/sync/bulk \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "providerCode": "SG",
    "startDate": "2025-01-01",
    "endDate": "2025-01-07"
  }'
```

## Security

- **Authentication**: All endpoints require JWT token
- **Authorization**: Manual/bulk sync limited to ADMIN role
- **API Key Storage**: Magayo API key stored in environment variables (Azure Key Vault in production)
- **Audit Logging**: All sync operations logged with full metadata
- **Rate Limiting**: Built-in delays to respect API provider limits

## Performance

### Sync Speed

**Single Provider**:
- API call: ~1-2 seconds
- Database write: ~200ms
- Bet processing: ~500ms for 100 bets
- **Total**: ~2-3 seconds per date

**Daily Sync (5 Active Providers)**:
- 5 providers × 2.5 seconds = ~12.5 seconds
- Plus 1-second delays between providers
- **Total**: ~17 seconds

**Bulk Sync (31 Days, Single Provider)**:
- 31 dates × 2.5 seconds = ~77 seconds
- Plus 1.5-second delays = ~46 seconds
- **Total**: ~2 minutes

### Database Load

**Per Sync Operation**:
- 1 INSERT into DrawResult
- N UPDATES to Bet (matched bets)
- M INSERTS into Commission (multi-level)
- 1 INSERT into AuditLog

**Daily Sync Impact**:
- Minimal (runs at 9 PM, low user activity)
- Atomic transactions ensure consistency
- Indexed queries for bet matching

## Monitoring

### Key Metrics

1. **Sync Success Rate**:
```sql
SELECT
  JSON_VALUE(metadata, '$.total') as total,
  JSON_VALUE(metadata, '$.successful') as successful,
  (CAST(JSON_VALUE(metadata, '$.successful') AS FLOAT) /
   CAST(JSON_VALUE(metadata, '$.total') AS FLOAT) * 100) as success_rate
FROM AuditLog
WHERE action = 'AUTOMATED_RESULT_SYNC'
ORDER BY createdAt DESC;
```

2. **API Response Time**: Monitor via logs
3. **Failed Syncs**: Check audit logs for errors
4. **Bet Processing Count**: Track `betsProcessed` in metadata

### Alerts

**Critical** (Immediate action):
- Daily sync failed for all providers
- Magayo API key invalid/expired
- Database connection failure during sync

**Warning**:
- Single provider sync failed (retry succeeded)
- API response time > 5 seconds
- Bulk sync partial failure

### Azure Application Insights Queries

```kusto
// Failed syncs in last 7 days
traces
| where timestamp > ago(7d)
| where message contains "Sync attempt" and message contains "failed"
| project timestamp, message, severityLevel

// Daily sync summary
customMetrics
| where name == "daily_sync_success_rate"
| summarize avg(value), min(value), max(value) by bin(timestamp, 1d)
```

## Troubleshooting

### Common Issues

1. **"API unavailable: Connection timeout"**
   - **Cause**: Magayo API down or network issues
   - **Resolution**: Wait for API recovery, or trigger manual sync later
   - **Prevention**: Monitor API uptime, consider fallback providers

2. **"Result already exists for {provider} on {date}"**
   - **Cause**: Duplicate sync attempt
   - **Resolution**: This is normal behavior, sync is idempotent
   - **Action**: None required

3. **"Magayo API configuration missing"**
   - **Cause**: Missing MAGAYO_API_URL or MAGAYO_API_KEY env vars
   - **Resolution**: Set environment variables in .env or Azure config
   - **Check**: `echo $MAGAYO_API_URL && echo $MAGAYO_API_KEY`

4. **"Empty response from Magayo API"**
   - **Cause**: API returned 200 but no data
   - **Resolution**: Check API documentation, verify provider code
   - **Testing**: Use development mode for mock data

### Manual Recovery

If automated sync fails for multiple days:

1. **Check API Status**:
```bash
curl -H "X-API-Key: $MAGAYO_API_KEY" \
  https://api.magayo.com/status
```

2. **Review Failed Syncs**:
```bash
curl http://localhost:3000/api/sync/history?limit=20 \
  -H "Authorization: Bearer ADMIN_JWT" | jq '.[] | select(.metadata.success == false)'
```

3. **Bulk Sync Missing Dates**:
```bash
curl -X POST http://localhost:3000/api/sync/bulk \
  -H "Authorization: Bearer ADMIN_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "providerCode": "SG",
    "startDate": "2025-01-10",
    "endDate": "2025-01-17"
  }'
```

4. **Verify Results**:
```sql
SELECT provider, drawDate, drawNumber, createdAt
FROM DrawResult
WHERE drawDate BETWEEN '2025-01-10' AND '2025-01-17'
ORDER BY drawDate DESC;
```

## Future Enhancements

1. **Multiple API Providers**: Add redundancy with alternative APIs
2. **Webhook Support**: Real-time result push from providers
3. **Partial Result Sync**: Handle providers with incomplete data
4. **Smart Scheduling**: Dynamic sync times based on draw schedules
5. **Result Validation**: Cross-check results across multiple sources
6. **Notification System**: Email/SMS alerts for sync failures
7. **Performance Optimization**: Parallel provider sync
8. **Result Preview**: Admin approval before processing bets

## Architecture

### Dependencies

- **HttpModule**: @nestjs/axios for HTTP requests
- **ConfigService**: Environment variable management
- **PrismaService**: Database operations
- **ResultsService**: Result creation and bet processing
- **ProvidersService**: Active provider list
- **ScheduleModule**: Cron job scheduling

### Integration Points

1. **ResultsModule**: Creates DrawResult records, processes bets
2. **CommissionsModule**: Triggered indirectly via bet results
3. **ProvidersModule**: Determines which providers to sync
4. **SchedulerModule**: Shares cron job infrastructure

### Error Flow

```
API Request
    ↓
[Try 1] Fetch from Magayo
    ↓ (if error)
Wait 2 seconds
    ↓
[Try 2] Fetch from Magayo
    ↓ (if error)
Wait 4 seconds
    ↓
[Try 3] Fetch from Magayo
    ↓ (if error)
└─→ Development Mode?
       ↓ Yes
    Generate Mock Data
       ↓ No
    Return Error
```

## Related Modules

- **ResultsModule**: Consumes sync data for bet processing
- **CommissionsModule**: Indirectly triggered by results
- **ProvidersModule**: Defines available providers
- **SchedulerModule**: Shares scheduling infrastructure
- **AuthModule**: Protects API endpoints

## References

- [NestJS HttpModule](https://docs.nestjs.com/techniques/http-module)
- [NestJS Scheduling](https://docs.nestjs.com/techniques/task-scheduling)
- [Magayo API Documentation](https://www.magayo.com/api/) (placeholder)
- [RxJS Observable](https://rxjs.dev/guide/observable)
