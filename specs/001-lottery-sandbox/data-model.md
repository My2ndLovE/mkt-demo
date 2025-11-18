# Data Model: Multi-Level Agent Lottery Sandbox System

**Version**: 1.0
**Date**: 2025-11-18
**Database**: Azure SQL Database (SQL Server)
**ORM**: Prisma v5

---

## Overview

This data model supports:
- **Unlimited agent hierarchy** with self-referential relations
- **Moderator data isolation** via row-level security
- **Commission tracking** through hierarchy levels
- **Weekly limit management** with automatic reset
- **Audit logging** for financial operations
- **Configurable service providers** for future expansion

---

## Complete Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
  previewFeatures = ["fullTextSearch"]
}

datasource db {
  provider = "sqlserver"
  url      = env("DATABASE_URL")
}

// ============================================================================
// CORE ENTITIES
// ============================================================================

/// User entity representing Admin, Moderator, and Agent roles
/// Supports unlimited hierarchy depth via self-referential upline/downlines
model User {
  id              Int       @id @default(autoincrement())
  username        String    @unique @db.NVarChar(50)
  passwordHash    String    @db.NVarChar(255)
  role            String    @db.NVarChar(20) // ADMIN, MODERATOR, AGENT
  fullName        String    @db.NVarChar(100)
  phone           String?   @db.NVarChar(20)
  email           String?   @db.NVarChar(100)

  // Hierarchy (Self-referential for unlimited levels)
  // SQL Server requires NoAction for self-referential relations
  upline          User?     @relation("UserHierarchy", fields: [uplineId], references: [id], onDelete: NoAction, onUpdate: NoAction)
  uplineId        Int?
  downlines       User[]    @relation("UserHierarchy")

  // Moderator Organization (for data isolation)
  moderatorId     Int?      // References the moderator who manages this agent
  moderator       User?     @relation("ModeratorAgents", fields: [moderatorId], references: [id], onDelete: NoAction, onUpdate: NoAction)
  managedAgents   User[]    @relation("ModeratorAgents")

  // Weekly Limits (using MONEY type for currency precision)
  weeklyLimit     Decimal   @default(0) @db.Money
  weeklyUsed      Decimal   @default(0) @db.Money
  commissionRate  Decimal   @default(0) @db.Decimal(5,2) // 0.00 to 100.00
  canCreateSubs   Boolean   @default(true)

  // Status & Metadata
  active          Boolean   @default(true)
  lastLoginAt     DateTime? @db.DateTime
  createdAt       DateTime  @default(now()) @db.DateTime
  updatedAt       DateTime  @updatedAt @db.DateTime

  // Relations
  bets            Bet[]
  commissionsReceived Commission[] @relation("CommissionRecipient")
  commissionsSourced  Commission[] @relation("CommissionSource")
  auditLogs       AuditLog[]
  refreshTokens   RefreshToken[]

  @@index([uplineId], name: "idx_user_uplineId")
  @@index([moderatorId], name: "idx_user_moderatorId")
  @@index([username], name: "idx_user_username")
  @@index([role], name: "idx_user_role")
  @@index([active], name: "idx_user_active")
  @@map("users")
}

/// Service Provider (Lottery operators: Magnum, Toto, Damacai, Singapore Pools)
/// Admin-configurable for future expansion
model ServiceProvider {
  id              String    @id @default(cuid())
  code            String    @unique @db.NVarChar(10) // M, P, T, S
  name            String    @db.NVarChar(100) // Magnum, Sports Toto, etc.
  country         String    @db.NVarChar(2) // MY, SG
  active          Boolean   @default(true)

  // JSON fields for flexible configuration
  availableGames  String    @db.NVarChar(Max) // JSON: ["3D", "4D", "5D", "6D"]
  betTypes        String    @db.NVarChar(Max) // JSON: ["BIG", "SMALL", "IBOX"]
  drawSchedule    String    @db.NVarChar(Max) // JSON: {"days": [0,3,6], "time": "19:00"}

  // API Configuration (for result synchronization)
  apiEndpoint     String?   @db.NVarChar(500)
  apiKey          String?   @db.NVarChar(500)

  // Metadata
  createdAt       DateTime  @default(now()) @db.DateTime
  updatedAt       DateTime  @updatedAt @db.DateTime

  // Relations
  bets            Bet[]
  results         DrawResult[]

  @@index([code], name: "idx_provider_code")
  @@index([active], name: "idx_provider_active")
  @@map("service_providers")
}

/// Bet placed by agent
model Bet {
  id              Int       @id @default(autoincrement())

  // Agent who placed the bet
  agentId         Int
  agent           User      @relation(fields: [agentId], references: [id])

  // Service provider (M, P, T, S)
  providerId      String
  provider        ServiceProvider @relation(fields: [providerId], references: [id])

  // Bet Details
  gameType        String    @db.NVarChar(5) // 3D, 4D, 5D, 6D
  betType         String    @db.NVarChar(10) // BIG, SMALL, IBOX
  numbers         String    @db.NVarChar(20) // Bet numbers (e.g., "1234")
  amount          Decimal   @db.Money

  // Draw Information
  drawDate        DateTime  @db.DateTime
  status          String    @default("PENDING") @db.NVarChar(20) // PENDING, WON, LOST, CANCELLED

  // Result Information (populated after draw)
  resultId        Int?
  result          DrawResult? @relation(fields: [resultId], references: [id])
  winAmount       Decimal   @default(0) @db.Money

  // Receipt & Metadata
  receiptNumber   String    @unique @db.NVarChar(50)
  createdAt       DateTime  @default(now()) @db.DateTime
  updatedAt       DateTime  @updatedAt @db.DateTime

  // Relations
  commissions     Commission[]

  @@index([agentId], name: "idx_bet_agentId")
  @@index([providerId], name: "idx_bet_providerId")
  @@index([status], name: "idx_bet_status")
  @@index([drawDate], name: "idx_bet_drawDate")
  @@index([receiptNumber], name: "idx_bet_receiptNumber")
  @@index([createdAt], name: "idx_bet_createdAt")
  @@map("bets")
}

/// Draw Results from lottery operators
model DrawResult {
  id              Int       @id @default(autoincrement())

  // Provider Information
  providerId      String
  provider        ServiceProvider @relation(fields: [providerId], references: [id])

  // Draw Details
  gameType        String    @db.NVarChar(5) // 3D, 4D, 5D, 6D
  drawDate        DateTime  @db.DateTime
  drawNumber      String    @unique @db.NVarChar(50) // Unique identifier for this draw

  // Winning Numbers
  firstPrize      String    @db.NVarChar(10)
  secondPrize     String    @db.NVarChar(10)
  thirdPrize      String    @db.NVarChar(10)
  starters        String    @db.NVarChar(Max) // JSON array: ["1111", "2222", ...]
  consolations    String    @db.NVarChar(Max) // JSON array: ["3333", "4444", ...]

  // Sync Metadata
  syncMethod      String    @db.NVarChar(10) // AUTO (API), MANUAL (admin entry)
  syncedBy        Int?      // User ID who entered (if manual)
  syncedAt        DateTime  @default(now()) @db.DateTime
  status          String    @default("FINAL") @db.NVarChar(20) // PENDING, VERIFIED, FINAL

  // Relations
  bets            Bet[]

  @@index([providerId], name: "idx_result_providerId")
  @@index([drawDate], name: "idx_result_drawDate")
  @@index([drawNumber], name: "idx_result_drawNumber")
  @@index([gameType], name: "idx_result_gameType")
  @@map("draw_results")
}

/// Commission records for hierarchy
model Commission {
  id              Int       @id @default(autoincrement())

  // Recipient of this commission
  agentId         Int
  agent           User      @relation("CommissionRecipient", fields: [agentId], references: [id])

  // Bet that generated this commission
  betId           Int
  bet             Bet       @relation(fields: [betId], references: [id])

  // Source agent who placed the bet
  sourceAgentId   Int
  sourceAgent     User      @relation("CommissionSource", fields: [sourceAgentId], references: [id])

  // Commission Calculation
  commissionRate  Decimal   @db.Decimal(5,2) // Rate at time of bet placement
  betAmount       Decimal   @db.Money // Original bet amount
  profitLoss      Decimal   @db.Money // + for win, - for loss
  commissionAmt   Decimal   @db.Money // Commission earned (can be negative)
  level           Int       // Hierarchy distance from source (1 = direct upline, 2 = upline's upline, etc.)

  // Metadata
  createdAt       DateTime  @default(now()) @db.DateTime

  @@index([agentId], name: "idx_commission_agentId")
  @@index([betId], name: "idx_commission_betId")
  @@index([sourceAgentId], name: "idx_commission_sourceAgentId")
  @@index([createdAt], name: "idx_commission_createdAt")
  @@map("commissions")
}

// ============================================================================
// AUTHENTICATION & SESSION
// ============================================================================

/// Refresh tokens for JWT authentication
model RefreshToken {
  id              Int       @id @default(autoincrement())
  userId          Int
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  token           String    @unique @db.NVarChar(500)
  expiresAt       DateTime  @db.DateTime
  createdAt       DateTime  @default(now()) @db.DateTime
  revokedAt       DateTime? @db.DateTime
  replacedBy      String?   @db.NVarChar(500) // Token that replaced this one (for rotation)

  @@index([userId], name: "idx_refreshtoken_userId")
  @@index([token], name: "idx_refreshtoken_token")
  @@index([expiresAt], name: "idx_refreshtoken_expiresAt")
  @@map("refresh_tokens")
}

// ============================================================================
// AUDIT & LOGGING
// ============================================================================

/// Audit log for financial and administrative operations
/// Immutable (append-only) for compliance
model AuditLog {
  id              Int       @id @default(autoincrement())

  // User who performed the action (null for system actions)
  userId          Int?
  user            User?     @relation(fields: [userId], references: [id])

  // Action Details
  action          String    @db.NVarChar(100) // BET_PLACED, AGENT_CREATED, LIMIT_ADJUSTED, etc.
  metadata        String    @db.NVarChar(Max) // JSON with action-specific details

  // Request Context
  ipAddress       String?   @db.NVarChar(50)
  userAgent       String?   @db.NVarChar(500)

  // Timestamp (immutable)
  createdAt       DateTime  @default(now()) @db.DateTime

  @@index([userId], name: "idx_auditlog_userId")
  @@index([action], name: "idx_auditlog_action")
  @@index([createdAt], name: "idx_auditlog_createdAt")
  @@map("audit_logs")
}

/// Weekly limit reset log (for monitoring scheduled job)
model LimitResetLog {
  id              Int       @id @default(autoincrement())
  resetDate       DateTime  @db.DateTime
  affectedUsers   Int       // Count of users reset
  totalLimit      Decimal   @db.Money // Sum of all limits reset
  status          String    @db.NVarChar(20) // SUCCESS, FAILED, PARTIAL
  errorMessage    String?   @db.NVarChar(Max)
  createdAt       DateTime  @default(now()) @db.DateTime

  @@index([resetDate], name: "idx_limitreset_resetDate")
  @@index([status], name: "idx_limitreset_status")
  @@map("limit_reset_logs")
}
```

---

## Entity Details & Business Rules

### 1. User Entity

**Purpose**: Represents all system users (Admin, Moderator, Agent)

**Key Fields**:
- `username`: Globally unique, 4-20 characters, alphanumeric only
- `role`: ADMIN (system-wide), MODERATOR (organization), AGENT (operational)
- `uplineId`: Self-referential for unlimited hierarchy (NULL for top-level)
- `moderatorId`: Organization owner for data isolation
- `weeklyLimit`/`weeklyUsed`: Tracked in MONEY type for precision
- `commissionRate`: 0.00-100.00 (percentage with 2 decimal places)

**Business Rules**:
1. **Username Uniqueness**: Globally unique across all moderators
2. **Hierarchy Validation**: `uplineId` cannot create circular references
3. **Commission Rate**: Must be 0-100 (validated at application layer)
4. **Weekly Limit**: `weeklyUsed` ≤ `weeklyLimit` at all times
5. **Role Constraints**:
   - ADMIN: `moderatorId` and `uplineId` must be NULL
   - MODERATOR: `uplineId` must be NULL, `moderatorId` must be NULL
   - AGENT: Must have `moderatorId` set (may have `uplineId`)

**State Transitions**:
```
active: true ↔ active: false (suspension)
```

**Indexes**:
- `idx_user_uplineId`: Recursive hierarchy queries
- `idx_user_moderatorId`: Organization filtering
- `idx_user_username`: Login lookup
- `idx_user_role`: Role-based queries

---

### 2. ServiceProvider Entity

**Purpose**: Configurable lottery service providers (M, P, T, S, etc.)

**Key Fields**:
- `code`: Short identifier (M=Magnum, P=Sports Toto, etc.)
- `availableGames`: JSON array ["3D", "4D", "5D", "6D"]
- `betTypes`: JSON array ["BIG", "SMALL", "IBOX"]
- `drawSchedule`: JSON object `{"days": [0,3,6], "time": "19:00"}`
- `apiEndpoint`/`apiKey`: For automated result synchronization

**Business Rules**:
1. **Code Uniqueness**: 2-3 character uppercase codes
2. **Active Providers**: Only active providers shown in betting UI
3. **JSON Validation**: Arrays/objects validated at application layer
4. **Game Type Validation**: Bet `gameType` must exist in provider's `availableGames`

**Default Providers** (seeded):
```typescript
[
  { code: "M", name: "Magnum 4D", country: "MY", availableGames: ["4D"] },
  { code: "P", name: "Sports Toto", country: "MY", availableGames: ["4D", "5D", "6D"] },
  { code: "T", name: "Damacai", country: "MY", availableGames: ["3D", "4D"] },
  { code: "S", name: "Singapore Pools", country: "SG", availableGames: ["4D"] },
]
```

---

### 3. Bet Entity

**Purpose**: Individual lottery bets placed by agents

**Key Fields**:
- `gameType`: 3D, 4D, 5D, 6D (must match provider's availableGames)
- `betType`: BIG, SMALL, IBOX
- `numbers`: Bet numbers as string (e.g., "1234")
- `amount`: Bet amount in currency (deducted from weeklyUsed)
- `status`: PENDING → WON/LOST/CANCELLED
- `receiptNumber`: Unique identifier (format: `{timestamp}-{agentId}-{random}`)

**Business Rules**:
1. **Game Type Validation**: `gameType` must be in provider's `availableGames`
2. **Number Length**: Must match game type (3D=3 digits, 4D=4, etc.)
3. **Weekly Limit Check**: `agent.weeklyUsed + amount ≤ agent.weeklyLimit`
4. **Draw Cutoff**: Cannot place bet after draw cutoff time (7:00 PM same day)
5. **Cancellation**: Only PENDING bets can be cancelled before cutoff

**State Transitions**:
```
PENDING → WON (after result processing)
PENDING → LOST (after result processing)
PENDING → CANCELLED (before cutoff, by agent)
```

**Receipt Number Format**:
```
{YYYYMMDDHHmmss}-{agentId}-{randomHex}
Example: 20251118193045-123-a4f3c2
```

---

### 4. DrawResult Entity

**Purpose**: Official lottery draw results

**Key Fields**:
- `drawNumber`: Unique identifier (format: `{provider}-{gameType}-{YYYYMMDD}`)
- `firstPrize`, `secondPrize`, `thirdPrize`: Top 3 winning numbers
- `starters`: JSON array of 10 starter prizes
- `consolations`: JSON array of 10 consolation prizes
- `syncMethod`: AUTO (API) or MANUAL (admin entry)
- `syncedBy`: User ID if manually entered

**Business Rules**:
1. **Uniqueness**: `drawNumber` must be unique (prevents duplicate results)
2. **Prize Count**: `starters` and `consolations` must each have exactly 10 numbers
3. **Number Uniqueness**: No duplicates across all 23 winning numbers
4. **Status Flow**: PENDING → VERIFIED → FINAL

**JSON Structure**:
```typescript
// starters and consolations
["1111", "2222", "3333", "4444", "5555", "6666", "7777", "8888", "9999", "0000"]
```

**Draw Number Format**:
```
{provider}-{gameType}-{YYYYMMDD}
Example: M-4D-20251118
```

---

### 5. Commission Entity

**Purpose**: Track commission distribution through hierarchy

**Key Fields**:
- `agentId`: Recipient of commission
- `sourceAgentId`: Agent who placed the original bet
- `commissionRate`: Rate at time of bet (historical record)
- `profitLoss`: Win amount (positive) or loss amount (negative)
- `commissionAmt`: Commission earned/lost
- `level`: Hierarchy distance (1=direct upline, 2=upline's upline)

**Business Rules**:
1. **Commission Calculation**: `commissionAmt = profitLoss * (commissionRate / 100)`
2. **Precision**: Use banker's rounding (ROUND_HALF_EVEN) to 2 decimal places
3. **Hierarchy Flow**: Created for all upline agents when bet result processed
4. **Historical Rate**: Uses `commissionRate` from time of bet placement (not current)

**Calculation Example**:
```
Bet: $100, Agent L3 (30% rate) wins $500 profit

L3 (30%): $150 commission
L2 (30%): $105 commission (30% of remaining $350)
L1 (30%): $73.50 commission (30% of remaining $245)
Moderator: $171.50 (remaining)
```

---

### 6. RefreshToken Entity

**Purpose**: JWT refresh token management

**Key Fields**:
- `token`: Hashed refresh token
- `expiresAt`: 7 days from creation
- `revokedAt`: Set when token is revoked/rotated
- `replacedBy`: New token in rotation chain

**Business Rules**:
1. **Expiration**: Tokens expire after 7 days
2. **Rotation**: Old token marked with `replacedBy` when rotated
3. **Revocation**: `revokedAt` set on logout or security event
4. **Cleanup**: Expired tokens deleted after 30 days

---

### 7. AuditLog Entity

**Purpose**: Immutable audit trail for compliance

**Key Actions**:
- `BET_PLACED`, `BET_CANCELLED`
- `AGENT_CREATED`, `AGENT_SUSPENDED`
- `LIMIT_ADJUSTED`, `LIMIT_RESET`
- `RESULT_SYNCED`, `RESULT_MANUAL_ENTRY`
- `COMMISSION_CALCULATED`
- `LOGIN_SUCCESS`, `LOGIN_FAILED`

**Metadata Examples**:
```json
// BET_PLACED
{
  "betId": 123,
  "amount": 100,
  "numbers": "1234",
  "provider": "M",
  "gameType": "4D"
}

// LIMIT_ADJUSTED
{
  "agentId": 456,
  "oldLimit": 1000,
  "newLimit": 2000,
  "reason": "Performance bonus"
}
```

**Immutability**: No UPDATE or DELETE operations allowed (database triggers enforce)

---

## Database Views (Optional Optimization)

### View: Agent Hierarchy Paths

```sql
CREATE VIEW vw_agent_hierarchy AS
WITH RECURSIVE AgentTree AS (
  SELECT
    id,
    uplineId,
    moderatorId,
    fullName,
    commissionRate,
    0 AS level,
    CAST(id AS VARCHAR(MAX)) AS path
  FROM users
  WHERE uplineId IS NULL

  UNION ALL

  SELECT
    u.id,
    u.uplineId,
    u.moderatorId,
    u.fullName,
    u.commissionRate,
    at.level + 1,
    at.path + '/' + CAST(u.id AS VARCHAR(MAX))
  FROM users u
  INNER JOIN AgentTree at ON u.uplineId = at.id
)
SELECT * FROM AgentTree;
```

**Usage**: Faster hierarchy queries for reports and commission calculations

---

## Migration Strategy

### Initial Migration

```bash
# Generate migration
npx prisma migrate dev --name init

# Seed default data
npx prisma db seed
```

### Seed Data (seed.ts)

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // 1. Create default admin
  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      passwordHash: await bcrypt.hash('Admin123!', 12),
      role: 'ADMIN',
      fullName: 'System Administrator',
      email: 'admin@lottery.local',
      weeklyLimit: 0,
      weeklyUsed: 0,
      commissionRate: 0,
      active: true,
    },
  });

  // 2. Seed service providers
  const providers = [
    {
      code: 'M',
      name: 'Magnum 4D',
      country: 'MY',
      active: true,
      availableGames: JSON.stringify(['4D']),
      betTypes: JSON.stringify(['BIG', 'SMALL', 'IBOX']),
      drawSchedule: JSON.stringify({ days: [0, 3, 6], time: '19:00' }),
    },
    {
      code: 'P',
      name: 'Sports Toto',
      country: 'MY',
      active: true,
      availableGames: JSON.stringify(['4D', '5D', '6D']),
      betTypes: JSON.stringify(['BIG', 'SMALL', 'IBOX']),
      drawSchedule: JSON.stringify({ days: [0, 3, 6], time: '19:00' }),
    },
    {
      code: 'T',
      name: 'Damacai',
      country: 'MY',
      active: true,
      availableGames: JSON.stringify(['3D', '4D']),
      betTypes: JSON.stringify(['BIG', 'SMALL', 'IBOX']),
      drawSchedule: JSON.stringify({ days: [0, 3, 6], time: '19:00' }),
    },
    {
      code: 'S',
      name: 'Singapore Pools',
      country: 'SG',
      active: true,
      availableGames: JSON.stringify(['4D']),
      betTypes: JSON.stringify(['BIG', 'SMALL']),
      drawSchedule: JSON.stringify({ days: [0, 3, 6], time: '18:30' }),
    },
  ];

  for (const provider of providers) {
    await prisma.serviceProvider.create({ data: provider });
  }

  console.log('Seed completed:', {
    admin: admin.username,
    providers: providers.length,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

---

## Row-Level Security (RLS) for Moderator Isolation

### SQL Server RLS Implementation

```sql
-- Create security policy for moderator isolation
CREATE FUNCTION dbo.fn_moderator_access(@moderatorId INT)
RETURNS TABLE
WITH SCHEMABINDING
AS
RETURN
  SELECT 1 AS fn_moderator_access_result
  WHERE
    @moderatorId = CAST(SESSION_CONTEXT(N'ModeratorId') AS INT)
    OR CAST(SESSION_CONTEXT(N'Role') AS NVARCHAR(20)) = 'ADMIN';

-- Apply policy to users table
CREATE SECURITY POLICY dbo.ModeratorAccessPolicy
ADD FILTER PREDICATE dbo.fn_moderator_access(moderatorId)
ON dbo.users,
ADD BLOCK PREDICATE dbo.fn_moderator_access(moderatorId)
ON dbo.users AFTER INSERT;

-- Set session context in application
-- (Called by NestJS interceptor after authentication)
EXEC sp_set_session_context @key = N'ModeratorId', @value = 123;
EXEC sp_set_session_context @key = N'Role', @value = N'MODERATOR';
```

---

## Next Steps

1. ✅ Data model complete
2. ⏳ Generate `contracts/openapi.yaml` (API specification)
3. ⏳ Create `quickstart.md` (setup guide)
4. ⏳ Update agent context with technologies

---

**Status**: Data Model Complete - Ready for API Contracts
