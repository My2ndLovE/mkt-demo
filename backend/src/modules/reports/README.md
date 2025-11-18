# Reports Module

The Reports Module provides comprehensive reporting capabilities for the Lottery Sandbox system with 6 report types across 3 user roles: Agents, Moderators, and Admins.

## Report Types

### Agent Reports (A-1, A-2, A-3)

#### A-1: Agent Bet Summary
**Purpose**: Shows betting activity summary for an agent

**Endpoint**: `GET /api/reports/agent/bet-summary`

**Access**: AGENT, MODERATOR, ADMIN

**Query Parameters**:
- `startDate` (optional): ISO 8601 date string
- `endDate` (optional): ISO 8601 date string
- `format` (optional): json | excel | csv (default: json)

**Response**:
```json
{
  "totalBets": 125,
  "totalAmount": 12500,
  "byStatus": {
    "pending": 20,
    "won": 45,
    "lost": 55,
    "partial": 3,
    "cancelled": 2
  },
  "byGameType": {
    "4D": { "count": 80, "total": 8000 },
    "3D": { "count": 45, "total": 4500 }
  },
  "byBetType": {
    "BIG": { "count": 70, "total": 7000 },
    "SMALL": { "count": 55, "total": 5500 }
  },
  "bets": [
    {
      "id": 1,
      "receiptNumber": "BET20250118001",
      "numbers": "1234",
      "gameType": "4D",
      "betType": "BIG",
      "amount": 100,
      "providers": ["SG", "MY"],
      "status": "WON",
      "results": [
        {
          "provider": "SG",
          "prizeCategory": "1ST",
          "winAmount": 2000
        }
      ],
      "createdAt": "2025-01-18T10:30:00Z"
    }
  ]
}
```

#### A-2: Agent Win/Loss Report
**Purpose**: Detailed win/loss analysis with profit/loss calculation

**Endpoint**: `GET /api/reports/agent/win-loss`

**Access**: AGENT, MODERATOR, ADMIN

**Query Parameters**: Same as A-1

**Response**:
```json
{
  "totalBets": 100,
  "totalBetAmount": 10000,
  "totalWinAmount": 8500,
  "totalProfitLoss": -1500,
  "winRate": 42.5,
  "details": [
    {
      "receiptNumber": "BET20250118001",
      "numbers": "1234",
      "gameType": "4D",
      "betType": "BIG",
      "betAmount": 100,
      "winAmount": 2000,
      "netProfitLoss": 1900,
      "status": "WON",
      "createdAt": "2025-01-18T10:30:00Z"
    }
  ]
}
```

**Key Metrics**:
- `winRate`: Percentage of winning bets (WON + PARTIAL) / total
- `netProfitLoss`: totalWinAmount - totalBetAmount
- Positive = profit, Negative = loss

#### A-3: Agent Commission Report
**Purpose**: Commission earnings from downline agent activity

**Endpoint**: `GET /api/reports/agent/commission`

**Access**: AGENT, MODERATOR, ADMIN

**Query Parameters**: Same as A-1

**Response**:
```json
{
  "totalCommissions": 50,
  "totalAmount": 1250.50,
  "averageCommission": 25.01,
  "byLevel": {
    "1": {
      "count": 30,
      "total": 750.30,
      "details": [
        {
          "betReceiptNumber": "BET20250118001",
          "sourceAgent": "agent123",
          "commissionRate": 5,
          "betAmount": 100,
          "profitLoss": 50,
          "commissionAmount": 2.50,
          "createdAt": "2025-01-18T10:30:00Z"
        }
      ]
    },
    "2": {
      "count": 20,
      "total": 500.20,
      "details": [...]
    }
  }
}
```

**Commission Calculation**:
- Level 1: Direct downline (highest rate)
- Level 2: Second-level downline (lower rate)
- Level N: N-level deep in hierarchy
- Commission = (Bet Profit/Loss) × (Commission Rate %)

### Moderator Reports (B-1, B-2)

#### B-1: Moderator Hierarchy Report
**Purpose**: Complete downline structure with per-user statistics

**Endpoint**: `GET /api/reports/moderator/hierarchy`

**Access**: MODERATOR (own hierarchy), ADMIN (any hierarchy)

**Query Parameters**:
- `userId` (optional): User ID for hierarchy root (defaults to current user, ADMIN can specify any)
- `startDate` (optional): For stats calculation
- `endDate` (optional): For stats calculation
- `format` (optional): json | excel

**Response**:
```json
{
  "moderator": {
    "id": 1,
    "username": "moderator1",
    "fullName": "Moderator One",
    "role": "MODERATOR"
  },
  "hierarchy": {
    "id": 1,
    "username": "moderator1",
    "fullName": "Moderator One",
    "role": "MODERATOR",
    "active": true,
    "weeklyLimit": 50000,
    "currentLimit": 35000,
    "commissionRate": 10,
    "createdAt": "2025-01-01T00:00:00Z",
    "stats": {
      "totalBets": 150,
      "totalBetAmount": 15000,
      "totalCommissions": 750,
      "activeBets": 20
    },
    "downlines": [
      {
        "id": 2,
        "username": "agent1",
        "fullName": "Agent One",
        "role": "AGENT",
        "active": true,
        "weeklyLimit": 5000,
        "currentLimit": 3000,
        "commissionRate": 5,
        "createdAt": "2025-01-05T00:00:00Z",
        "stats": {
          "totalBets": 50,
          "totalBetAmount": 5000,
          "totalCommissions": 0,
          "activeBets": 5
        },
        "downlines": []
      }
    ]
  }
}
```

**Use Cases**:
- Visualize organizational structure
- Monitor downline performance
- Identify top performers
- Track hierarchy health

#### B-2: Moderator Financial Summary
**Purpose**: Aggregated financial data for entire downline

**Endpoint**: `GET /api/reports/moderator/financial-summary`

**Access**: MODERATOR, ADMIN

**Query Parameters**: Same as A-1

**Response**:
```json
{
  "period": {
    "startDate": "2025-01-01T00:00:00Z",
    "endDate": "2025-01-31T23:59:59Z"
  },
  "bets": {
    "totalBets": 500,
    "totalAmount": 50000,
    "byStatus": {
      "pending": 50,
      "won": 200,
      "lost": 230,
      "partial": 15,
      "cancelled": 5
    }
  },
  "winnings": {
    "totalWinAmount": 45000,
    "netProfitLoss": -5000
  },
  "commissions": {
    "totalCommissions": 120,
    "totalAmount": 2500,
    "byLevel": {
      "1": { "count": 80, "total": 1800 },
      "2": { "count": 40, "total": 700 }
    }
  },
  "users": {
    "totalUsers": 25,
    "active": 23,
    "inactive": 2,
    "byRole": {
      "agents": 20,
      "moderators": 4,
      "admins": 1
    }
  }
}
```

**Key Insights**:
- Downline betting volume and trends
- Win/loss profitability
- Commission earnings breakdown
- User activity and hierarchy composition

### Admin Reports (B-3)

#### B-3: Admin System Overview
**Purpose**: System-wide statistics and health metrics

**Endpoint**: `GET /api/reports/admin/system-overview`

**Access**: ADMIN only

**Query Parameters**: Same as A-1

**Response**:
```json
{
  "period": {
    "startDate": "2025-01-01T00:00:00Z",
    "endDate": "2025-01-31T23:59:59Z"
  },
  "users": {
    "total": 250,
    "active": 230,
    "inactive": 20,
    "byRole": [
      { "role": "AGENT", "count": 200 },
      { "role": "MODERATOR", "count": 45 },
      { "role": "ADMIN", "count": 5 }
    ]
  },
  "bets": {
    "total": 5000,
    "totalAmount": 500000,
    "byStatus": [
      { "status": "PENDING", "count": 500, "amount": 50000 },
      { "status": "WON", "count": 2000, "amount": 200000 },
      { "status": "LOST", "count": 2300, "amount": 230000 },
      { "status": "PARTIAL", "count": 150, "amount": 15000 },
      { "status": "CANCELLED", "count": 50, "amount": 5000 }
    ]
  },
  "winnings": {
    "totalWinAmount": 450000,
    "netProfitLoss": -50000,
    "houseEdge": 10.0
  },
  "commissions": {
    "total": 1200,
    "totalAmount": 25000
  },
  "providers": {
    "total": 10,
    "active": 8,
    "list": [
      { "code": "SG", "name": "Singapore Pools", "active": true },
      { "code": "MY", "name": "Magnum Malaysia", "active": true }
    ]
  },
  "systemHealth": {
    "recentResets": [
      {
        "date": "2025-01-15T00:00:00Z",
        "success": true,
        "usersAffected": 230
      }
    ],
    "lastSuccessfulReset": "2025-01-15T00:00:00Z"
  }
}
```

**Key Metrics**:
- `houseEdge`: System profitability percentage
- `systemHealth`: Automated reset monitoring
- User distribution and activity
- Provider availability

## Excel Export

All reports support Excel export for offline analysis and record-keeping.

### Usage

Add `?format=excel` to any report endpoint:

```bash
GET /api/reports/agent/bet-summary?format=excel&startDate=2025-01-01&endDate=2025-01-31
```

**Response Headers**:
```
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="agent-bet-summary-agent123-2025-01-18.xlsx"
```

**Excel Features**:
- Bold headers
- Auto-sized columns
- Multiple sheets for nested data (hierarchy reports)
- Formatted dates and numbers

### Excel Structure

**Flat Reports** (A-1, A-2, A-3):
- Single sheet with all detail rows
- Headers in first row
- Data starts from row 2

**Hierarchical Reports** (B-1):
- Flattened structure with level and path columns
- `level`: Depth in hierarchy (0 = root)
- `path`: Breadcrumb trail (e.g., "moderator1 > agent1 > agent2")

**Aggregate Reports** (B-2, B-3):
- Key-value pairs for summary data
- Nested objects as JSON strings

## API Examples

### Get Agent Bet Summary (Last 30 Days)

```bash
curl -X GET "http://localhost:3000/api/reports/agent/bet-summary?startDate=2025-01-01&endDate=2025-01-31" \
  -H "Authorization: Bearer JWT_TOKEN"
```

### Download Win/Loss Excel Report

```bash
curl -X GET "http://localhost:3000/api/reports/agent/win-loss?format=excel" \
  -H "Authorization: Bearer JWT_TOKEN" \
  --output win-loss-report.xlsx
```

### Get Moderator Hierarchy (JSON)

```bash
curl -X GET "http://localhost:3000/api/reports/moderator/hierarchy" \
  -H "Authorization: Bearer JWT_TOKEN"
```

### Admin System Overview (Last Week)

```bash
curl -X GET "http://localhost:3000/api/reports/admin/system-overview?startDate=2025-01-11&endDate=2025-01-18" \
  -H "Authorization: Bearer JWT_TOKEN"
```

## Security

- **Authentication**: All endpoints require JWT authentication
- **Authorization**: Role-based access control via `@Roles()` decorator
- **Data Isolation**: Moderators can only view their own downline data
- **Admin Override**: Admins can view any user's reports

## Performance Considerations

### Database Optimization

1. **Indexed Queries**: All date range filters use indexed `createdAt` columns
2. **Selective Loading**: Only required fields fetched (Prisma `select`)
3. **Aggregation**: Use `groupBy` for summary statistics
4. **Recursive Limits**: Hierarchy traversal has 100-level safety limit

### Caching Strategy

Reports are **not cached** by default due to:
- Real-time data requirements
- User-specific filtering
- Large result sets

For frequently accessed reports, consider:
- Client-side caching (HTTP Cache-Control headers)
- Scheduled report generation (background jobs)
- Materialized views for aggregates

### Large Datasets

For organizations with >10,000 agents:
- Implement pagination for detail reports
- Use streaming responses for Excel exports
- Consider report scheduling instead of on-demand generation

## Testing

### Unit Tests

```bash
cd backend
pnpm test reports.service.spec.ts
```

**Coverage**:
- All 6 report types
- Date filtering
- Excel export functionality
- Edge cases (empty results, null values)

### Manual Testing

1. **Agent Reports** (as AGENT):
```bash
# Login as agent
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"agent1","password":"password123"}' \
  | jq -r '.accessToken')

# Get reports
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/reports/agent/bet-summary
```

2. **Moderator Reports** (as MODERATOR):
```bash
# Login as moderator
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"mod1","password":"password123"}' \
  | jq -r '.accessToken')

# Get hierarchy
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/reports/moderator/hierarchy
```

3. **Admin Reports** (as ADMIN):
```bash
# Login as admin
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin123!"}' \
  | jq -r '.accessToken')

# Get system overview
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/reports/admin/system-overview
```

## Future Enhancements

1. **Scheduled Reports**: Email/notification delivery
2. **Report Templates**: Customizable report layouts
3. **CSV Export**: Alternative to Excel for lightweight files
4. **Charting**: Visual representations (graphs, charts)
5. **Report History**: Save and retrieve past reports
6. **Custom Filters**: Additional query parameters (provider, game type, etc.)
7. **Pagination**: For large detail reports
8. **Real-time Updates**: WebSocket for live report refreshes

## Architecture

### Service Layer

`ReportsService` provides 6 main methods:
1. `getAgentBetSummary(agentId, query)`
2. `getAgentWinLoss(agentId, query)`
3. `getAgentCommission(agentId, query)`
4. `getModeratorHierarchy(moderatorId, query)`
5. `getModeratorFinancialSummary(moderatorId, query)`
6. `getAdminSystemOverview(query)`

Plus helper methods:
- `exportToExcel(data, reportName)`: Excel generation
- `getUserStats(userId, query)`: Per-user statistics
- `getDownlineIds(userId)`: Recursive downline collection
- `groupBy(array, key)`: Array aggregation utility

### Controller Layer

`ReportsController` exposes 6 endpoints with:
- JWT authentication (`JwtAuthGuard`)
- Role-based authorization (`RolesGuard`, `@Roles()`)
- Format handling (JSON vs Excel)
- Response streaming for Excel files

### Database Queries

All reports use **Prisma ORM** for:
- Type-safe queries
- Relation loading
- Aggregations (`groupBy`, `count`, `sum`)
- Transaction support (not used in reports, read-only)

### Integration Points

- **BetsModule**: Betting data access
- **CommissionsModule**: Commission calculations
- **UsersModule**: User/agent data and hierarchy
- **PrismaModule**: Database access layer

## Related Modules

- **BetsModule**: Source data for betting reports
- **CommissionsModule**: Commission calculation logic
- **UsersModule**: User hierarchy and management
- **SchedulerModule**: Potential for scheduled report generation

## References

- [NestJS Controllers](https://docs.nestjs.com/controllers)
- [Prisma Aggregation](https://www.prisma.io/docs/concepts/components/prisma-client/aggregation-grouping-summarizing)
- [ExcelJS Documentation](https://github.com/exceljs/exceljs)
- [Swagger API Documentation](https://docs.nestjs.com/openapi/introduction)
