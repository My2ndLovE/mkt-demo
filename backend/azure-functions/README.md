# Azure Functions - Weekly Limit Reset

This directory contains Azure Functions for scheduled tasks in the Lottery Sandbox system.

## Functions

### Weekly Reset (`weekly-reset/`)

**Purpose**: Automatically resets all agent betting limits every Monday at 00:00 SGT (Singapore Time, GMT+8).

**Schedule**: `0 0 0 * * 1` (Cron expression: second minute hour day month dayOfWeek)
- Runs every Monday at midnight
- Uses Singapore Standard Time zone

**Features**:
- Automatic retry with exponential backoff (3 attempts max)
- Comprehensive logging to `LimitResetLog` table
- Audit trail for all reset operations
- Error handling and alerting

## Local Development

### Prerequisites

1. Install Azure Functions Core Tools:
```bash
npm install -g azure-functions-core-tools@4
```

2. Install dependencies:
```bash
cd backend
pnpm install
```

3. Configure local settings:
   - Copy `local.settings.json.example` to `local.settings.json`
   - Update database connection string and environment variables

### Running Locally

1. Build the backend:
```bash
cd backend
pnpm build
```

2. Start Azure Functions runtime:
```bash
cd azure-functions
func start
```

The function will run according to the schedule, or you can trigger it manually via the Azure Functions portal/CLI.

### Manual Testing

To manually trigger the weekly reset (Admin only):

```bash
curl -X POST http://localhost:3000/api/scheduler/reset-limits \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

## Deployment to Azure

### 1. Create Function App

```bash
az functionapp create \
  --resource-group lottery-sandbox-rg \
  --consumption-plan-location southeastasia \
  --runtime node \
  --runtime-version 20 \
  --functions-version 4 \
  --name lottery-sandbox-functions \
  --storage-account lotterysa \
  --os-type Linux
```

### 2. Configure Time Zone

```bash
az functionapp config appsettings set \
  --name lottery-sandbox-functions \
  --resource-group lottery-sandbox-rg \
  --settings WEBSITE_TIME_ZONE="Singapore Standard Time"
```

### 3. Configure Application Settings

```bash
az functionapp config appsettings set \
  --name lottery-sandbox-functions \
  --resource-group lottery-sandbox-rg \
  --settings \
    DATABASE_URL="@Microsoft.KeyVault(SecretUri=https://lottery-kv.vault.azure.net/secrets/DatabaseUrl)" \
    JWT_SECRET="@Microsoft.KeyVault(SecretUri=https://lottery-kv.vault.azure.net/secrets/JwtSecret)" \
    APPLICATIONINSIGHTS_CONNECTION_STRING="@Microsoft.KeyVault(...)"
```

### 4. Deploy Function

```bash
cd backend
pnpm build

cd azure-functions
func azure functionapp publish lottery-sandbox-functions
```

## Monitoring

### View Logs

**Azure Portal**:
1. Navigate to Function App > Functions > weekly-reset
2. Click "Monitor" to view execution history
3. Click on individual invocations to see detailed logs

**Azure CLI**:
```bash
func azure functionapp logstream lottery-sandbox-functions
```

### Application Insights

The function is configured to send telemetry to Application Insights:
- Execution duration
- Success/failure rates
- Custom metrics (users affected, retry attempts)
- Exception tracking

**View in Portal**: Function App > Application Insights > Logs

### Reset History API

Query reset history via the backend API:

```bash
GET /api/scheduler/reset-history?limit=50
Authorization: Bearer JWT_TOKEN
```

## Troubleshooting

### Function Not Triggering

1. **Check time zone**: Ensure `WEBSITE_TIME_ZONE` is set to "Singapore Standard Time"
2. **Verify schedule**: The cron expression `0 0 0 * * 1` runs Mondays at midnight
3. **Check logs**: Look for errors in Application Insights or Function App logs
4. **Manual trigger**: Test via `/api/scheduler/reset-limits` endpoint

### Database Connection Issues

1. Verify `DATABASE_URL` in application settings
2. Check firewall rules allow Azure Functions IP ranges
3. Ensure MSI/Service Principal has database access

### Retry Failures

If all 3 retry attempts fail:
1. Check database availability and performance
2. Review error messages in `LimitResetLog` table
3. Check for deadlocks or long-running transactions
4. Manually trigger reset via API after resolving issues

## Security

- **Authentication**: Function uses MSI to access Azure SQL Database
- **Secrets**: All sensitive values stored in Azure Key Vault
- **Network**: Function App has VNet integration for secure database access
- **Audit**: All reset operations logged to `LimitResetLog` and `AuditLog` tables

## Cost Optimization

- **Consumption Plan**: Pay only for execution time
- **Expected Monthly Cost**: ~$0.50 USD
  - 4 executions/month (weekly)
  - ~30 seconds per execution
  - Minimal retry overhead

## Architecture Decision Records

### ADR-005: NestJS Integration in Azure Functions

**Decision**: Bootstrap full NestJS application context in Azure Function

**Rationale**:
- Reuse existing business logic in `SchedulerService`
- Consistent error handling and logging
- Automatic dependency injection
- Single source of truth for reset logic

**Trade-offs**:
- Longer cold start (~2-3 seconds)
- Higher memory usage (acceptable for weekly schedule)
- Simpler maintenance vs. duplicated logic
