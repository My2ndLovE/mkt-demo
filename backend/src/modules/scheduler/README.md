# Scheduler Module

The Scheduler Module provides automated scheduled tasks for the Lottery Sandbox system, primarily handling weekly limit resets.

## Features

### Weekly Limit Reset

**Schedule**: Every Monday at 00:00 SGT (Singapore Time, GMT+8)

**Functionality**:
- Resets all agent betting limits to their configured weekly amounts
- Processes all active agents in the system
- Executes atomically via database transaction

**Reliability**:
- **Retry Mechanism**: 3 attempts with exponential backoff
  - Attempt 1: Immediate
  - Attempt 2: +1 second delay
  - Attempt 3: +2 seconds delay
- **Logging**: All reset operations logged to `LimitResetLog` table
- **Audit Trail**: Includes metadata (duration, attempt count, timestamp)

## API Endpoints

### Manual Reset Trigger (Admin Only)

```http
POST /api/scheduler/reset-limits
Authorization: Bearer {admin_jwt_token}
```

**Response**:
```json
{
  "success": true,
  "count": 25,
  "message": "Successfully reset limits for 25 users"
}
```

**Use Cases**:
- Emergency reset after data migration
- Testing before production deployment
- Ad-hoc reset due to system issues

### Get Reset History

```http
GET /api/scheduler/reset-history?limit=50
Authorization: Bearer {jwt_token}
```

**Query Parameters**:
- `limit` (optional): Number of records (default: 50, max: 500)

**Response**:
```json
[
  {
    "id": 1,
    "resetDate": "2025-01-20T00:00:00.000Z",
    "success": true,
    "usersAffected": 25,
    "errorMessage": null,
    "metadata": "{\"attemptCount\":1,\"durationMs\":245,\"startTime\":\"...\",\"endTime\":\"...\"}",
    "createdAt": "2025-01-20T00:00:15.123Z"
  }
]
```

## Database Schema

### LimitResetLog Table

Tracks all reset operations for audit and monitoring purposes.

```prisma
model LimitResetLog {
  id             Int      @id @default(autoincrement())
  resetDate      DateTime
  success        Boolean
  usersAffected  Int
  errorMessage   String?  @db.NVarChar(Max)
  metadata       String?  @db.NVarChar(Max)
  createdAt      DateTime @default(now())
}
```

**Fields**:
- `resetDate`: When the reset was initiated
- `success`: Whether reset completed successfully
- `usersAffected`: Number of user limits reset
- `errorMessage`: Error details if failed (null if successful)
- `metadata`: JSON with additional info (attemptCount, durationMs, timestamps)

## Architecture

### Execution Flow

```
Monday 00:00 SGT
    ↓
@Cron Decorator Triggers
    ↓
SchedulerService.handleWeeklyLimitReset()
    ↓
┌─────────────────────────────┐
│ Attempt 1                   │
│ LimitsService.resetAllLimits│ ─── Success ──→ Log & Exit
│                             │
└─────────────┬───────────────┘
              │ Failure
              ↓
         Wait 1 second
              ↓
┌─────────────────────────────┐
│ Attempt 2                   │
│ LimitsService.resetAllLimits│ ─── Success ──→ Log & Exit
│                             │
└─────────────┬───────────────┘
              │ Failure
              ↓
         Wait 2 seconds
              ↓
┌─────────────────────────────┐
│ Attempt 3 (Final)           │
│ LimitsService.resetAllLimits│ ─── Success ──→ Log & Exit
│                             │      Failure  ──→ Log Error & Alert
└─────────────────────────────┘
```

### Integration Points

1. **LimitsService**: Executes the actual reset logic
   - `resetAllLimits()`: Updates all user limits
   - Atomic transaction ensures data consistency

2. **PrismaService**: Database operations
   - Log creation in `LimitResetLog`
   - Audit log entries for manual resets

3. **NestJS Schedule**: Cron job management
   - `@Cron()` decorator for automatic scheduling
   - Time zone support (Asia/Singapore)

4. **Azure Functions** (Production): Serverless execution
   - Consumption plan for cost efficiency
   - Application Insights for monitoring

## Configuration

### Environment Variables

```env
# Not directly used by scheduler, but referenced by dependencies
DATABASE_URL=sqlserver://...
JWT_SECRET=...
```

### Cron Expression

```typescript
@Cron('0 0 * * 1', {
  name: 'weekly-limit-reset',
  timeZone: 'Asia/Singapore',
})
```

- `0 0 * * 1`: Every Monday at 00:00
- `timeZone`: Ensures consistent timing regardless of server location

### Retry Configuration

```typescript
private readonly MAX_RETRIES = 3;
private readonly INITIAL_RETRY_DELAY = 1000; // 1 second
```

Exponential backoff formula: `INITIAL_RETRY_DELAY * 2^(attempt-1)`

## Testing

### Unit Tests

```bash
cd backend
pnpm test scheduler.service.spec.ts
```

**Coverage**:
- Successful reset on first attempt
- Retry and succeed on second attempt
- Failure after max retries
- Manual reset success
- Manual reset failure
- Reset history retrieval

### Manual Testing (Development)

1. **Trigger immediate reset** (as admin):
```bash
curl -X POST http://localhost:3000/api/scheduler/reset-limits \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

2. **Check reset history**:
```bash
curl http://localhost:3000/api/scheduler/reset-history \
  -H "Authorization: Bearer JWT_TOKEN"
```

3. **Verify database**:
```sql
SELECT TOP 10 * FROM LimitResetLog ORDER BY resetDate DESC;
SELECT username, currentLimit, weeklyLimit FROM [User] WHERE role = 'AGENT';
```

### Load Testing

Simulate large-scale reset:

```typescript
// In seed.ts or test script
const users = await prisma.user.createMany({
  data: Array.from({ length: 10000 }, (_, i) => ({
    username: `agent${i}`,
    role: 'AGENT',
    weeklyLimit: new Prisma.Decimal(5000),
    currentLimit: new Prisma.Decimal(0),
    // ... other fields
  })),
});
```

Then trigger reset and measure:
- Execution time
- Database connection pool usage
- Memory consumption

## Monitoring

### Key Metrics

1. **Success Rate**: % of successful resets
   ```sql
   SELECT
     COUNT(*) as total,
     SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful,
     (SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*)) as success_rate
   FROM LimitResetLog
   WHERE resetDate >= DATEADD(month, -3, GETDATE());
   ```

2. **Users Affected**: Trend over time
3. **Execution Duration**: Parse from `metadata` JSON
4. **Retry Rate**: `attemptCount > 1`

### Alerts

**Critical Alerts** (Immediate action required):
- Reset failure after 3 attempts
- No reset executed on Monday (missed schedule)
- Execution time > 5 minutes

**Warning Alerts**:
- Retry occurred (success on attempt 2 or 3)
- Execution time > 1 minute
- Users affected dropped significantly

### Azure Application Insights Queries

```kusto
// Failed resets in last 30 days
traces
| where timestamp > ago(30d)
| where message contains "Weekly limit reset FAILED"
| project timestamp, message, severityLevel

// Average execution time
customMetrics
| where name == "weekly_reset_duration"
| summarize avg(value), max(value), min(value) by bin(timestamp, 1d)
```

## Error Handling

### Common Errors

1. **Database Connection Timeout**
   - **Cause**: High database load, network issues
   - **Resolution**: Automatic retry handles transient issues
   - **Prevention**: Database connection pooling, Azure SQL tier upgrade

2. **Deadlock**
   - **Cause**: Concurrent transactions on User table
   - **Resolution**: Retry after deadlock victim
   - **Prevention**: Ensure no other processes modify limits during reset window

3. **Permission Denied**
   - **Cause**: Database user lacks UPDATE permission
   - **Resolution**: Grant necessary permissions
   - **Prevention**: Infrastructure-as-Code ensures consistent permissions

### Manual Recovery

If all automated retries fail:

1. **Investigate root cause**:
   ```sql
   SELECT TOP 1 * FROM LimitResetLog
   WHERE success = 0
   ORDER BY resetDate DESC;
   ```

2. **Fix underlying issue** (database, network, permissions)

3. **Trigger manual reset**:
   ```bash
   curl -X POST http://localhost:3000/api/scheduler/reset-limits \
     -H "Authorization: Bearer ADMIN_JWT"
   ```

4. **Verify results**:
   ```sql
   SELECT COUNT(*) FROM [User]
   WHERE role = 'AGENT' AND currentLimit = weeklyLimit;
   ```

## Security Considerations

1. **Manual Reset Endpoint**: Admin role required (`@Roles('ADMIN')`)
2. **JWT Authentication**: All endpoints protected by `JwtAuthGuard`
3. **Audit Logging**: Manual resets logged with triggering user ID
4. **Database Access**: Uses application service account with minimal permissions

## Future Enhancements

1. **Configurable Schedule**: Allow admins to change reset day/time via UI
2. **Notification System**: Email/SMS alerts for failed resets
3. **Partial Reset**: Reset specific moderator hierarchies
4. **Reset Preview**: Dry-run mode to preview changes before applying
5. **Multi-Region Support**: Handle different time zones for global deployment

## Related Modules

- **LimitsModule**: Provides `resetAllLimits()` business logic
- **UsersModule**: Manages user/agent data
- **AuthModule**: Handles endpoint authentication
- **PrismaModule**: Database access layer

## References

- [NestJS Schedule Documentation](https://docs.nestjs.com/techniques/task-scheduling)
- [Azure Functions Timer Trigger](https://learn.microsoft.com/en-us/azure/azure-functions/functions-bindings-timer)
- [Cron Expression Generator](https://crontab.guru/)
