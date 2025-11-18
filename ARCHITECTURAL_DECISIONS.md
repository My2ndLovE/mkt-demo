# Architectural Decisions

**Date**: 2025-11-18
**Branch**: claude/analyze-implement-features-013WGESkUhotEiwPuKfCRehM
**Status**: Approved for Implementation

## Critical Decision 1: Multi-Provider Betting Architecture

**Decision**: **OPTION A - Single Bet with Provider Array**

**Rationale**:
- Simpler implementation: One bet record = one receipt number
- Better UX: Agent receives single receipt for multi-provider bet
- Easier weekly limit management: Single deduction instead of multiple
- Simpler commission calculation: One commission flow per bet
- Aligns with real-world lottery practice: Agents typically place same number across multiple providers

**Implementation Details**:
```prisma
model Bet {
  id              Int       @id @default(autoincrement())
  agentId         Int
  providerIds     String    @db.NVarChar(Max) // JSON array: ["M", "P", "T"]
  gameType        String    @db.NVarChar(5)   // 3D, 4D, 5D, 6D
  betType         String    @db.NVarChar(10)  // BIG, SMALL, IBOX
  numbers         String    @db.NVarChar(20)
  amountPerProvider Decimal @db.Money         // RM10 per provider
  totalAmount     Decimal   @db.Money         // RM30 for 3 providers
  // ... rest of fields
}
```

**Weekly Limit Calculation**:
- If providers = ["M", "P", "T"] and amountPerProvider = RM10
- Total deduction from weekly limit = RM30 (3 providers × RM10)

**Alternative Rejected**: OPTION B (Multiple bets) - Too complex, multiple receipts confuse users

---

## Critical Decision 2: API Key Encryption

**Decision**: **Encrypt API keys using AES-256-GCM with Azure Key Vault**

**Rationale**:
- API keys in plaintext violate security best practices
- Azure Key Vault provides secure key storage and rotation
- Encryption adds negligible performance overhead
- Meets compliance requirements for sensitive data

**Implementation Details**:
1. **Create Encryption Service** (T237):
   ```typescript
   // backend/src/common/services/encryption.service.ts
   import { Injectable } from '@nestjs/common';
   import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

   @Injectable()
   export class EncryptionService {
     private readonly algorithm = 'aes-256-gcm';
     private readonly key: Buffer; // From Azure Key Vault

     async encrypt(text: string): Promise<string> {
       const iv = randomBytes(16);
       const cipher = createCipheriv(this.algorithm, this.key, iv);
       // ... encryption logic
     }

     async decrypt(encryptedText: string): Promise<string> {
       // ... decryption logic
     }
   }
   ```

2. **Azure Key Vault Integration**:
   - Store encryption key in Azure Key Vault (not in .env)
   - Fetch key at application startup
   - Rotate key every 90 days

3. **Usage in ServiceProvider**:
   - Encrypt `apiKey` before saving to database
   - Decrypt when calling third-party API

**Security Measures**:
- Key rotation procedure documented
- Encryption key never logged or exposed
- Environment variables only store Key Vault URL

---

## Critical Decision 3: Row-Level Security Implementation

**Decision**: **Prisma Middleware for Moderator Data Isolation**

**Rationale**:
- Azure SQL RLS requires complex session context management
- Prisma middleware provides type-safe, application-level filtering
- Easier to test and debug than database-level RLS
- Performance impact minimal with proper indexing

**Implementation Details**:
1. **Prisma Middleware** (T230):
   ```typescript
   // backend/src/prisma/prisma.middleware.ts
   import { Prisma } from '@prisma/client';

   export function createModeratorFilterMiddleware(prismaClient) {
     prismaClient.$use(async (params, next) => {
       // Get current user from request context
       const currentUser = getCurrentUser();

       // Skip filtering for ADMIN role
       if (currentUser.role === 'ADMIN') {
         return next(params);
       }

       // Apply moderatorId filter to protected models
       if (['Bet', 'User', 'Commission'].includes(params.model)) {
         if (!params.args.where) params.args.where = {};
         params.args.where.moderatorId = currentUser.moderatorId;
       }

       return next(params);
     });
   }
   ```

2. **Models with RLS**:
   - User (agents within moderator's organization)
   - Bet (bets from moderator's agents)
   - Commission (commissions within moderator's organization)

3. **Bypass Logic**:
   - ADMIN role: No filtering (sees all data)
   - MODERATOR role: Filters by their moderatorId
   - AGENT role: Filters by their moderatorId

4. **Index Optimization** (T269):
   ```sql
   CREATE INDEX idx_bet_moderatorId ON bets(moderatorId);
   CREATE INDEX idx_user_moderatorId ON users(moderatorId);
   CREATE INDEX idx_commission_moderatorId ON commissions(moderatorId);
   ```

**Testing Requirements** (T235, T345):
- Integration test: Moderator A cannot access Moderator B's data
- E2E test: Full data isolation across all endpoints
- Load test: Performance with 1000+ moderators

**Alternative Rejected**: Azure SQL RLS - More complex, harder to test

---

## Critical Decision 4: Azure Functions Timezone Configuration

**Decision**: **Set WEBSITE_TIME_ZONE to Asia/Kuala_Lumpur**

**Rationale**:
- Weekly reset must occur at Monday 00:00 Malaysia time (GMT+8)
- Draw synchronization aligned with Malaysia/Singapore draw times (7:00 PM GMT+8)
- Prevents timezone bugs in scheduled jobs

**Implementation Details**:
1. **host.json** (T225):
   ```json
   {
     "version": "2.0",
     "extensions": {
       "http": {
         "routePrefix": "api"
       }
     },
     "functionTimeout": "00:05:00"
   }
   ```

2. **Azure Function App Settings** (T229):
   ```bash
   az functionapp config appsettings set \
     --name func-lottery-backend-prod \
     --resource-group rg-lottery-sandbox-prod \
     --settings "WEBSITE_TIME_ZONE=Asia/Kuala_Lumpur"
   ```

3. **Cron Expressions** (T226-T227):
   - Weekly Reset: `0 0 0 * * MON` (Monday 00:00)
   - Results Sync: `0 30 19 * * 0,3,6` (Wed/Sat/Sun 19:30)

**Testing**:
- Unit test: Verify timezone conversion logic
- Integration test: Mock Monday 00:00 and verify reset executes
- Manual test: Deploy to staging and verify actual reset time

---

## Technology Stack Confirmation

Based on research findings (research.md), confirmed stack:

### Backend
- **Framework**: NestJS v10 (modular architecture)
- **ORM**: Prisma v5 (SQL Server provider)
- **Database**: Azure SQL Database (Basic tier for MVP)
- **Runtime**: Azure Functions (Consumption plan initially)
- **Authentication**: Passport.js + JWT (15min access, 7day refresh)
- **Validation**: class-validator + Zod (at boundaries)
- **Caching**: In-memory initially (Redis when scaling >1000 users)

### Frontend
- **Framework**: React 19 + React Router 7 (CSR mode)
- **State**: Zustand v5 (global) + TanStack Query v5 (server state)
- **UI**: shadcn/ui + Radix UI + Tailwind CSS v4
- **Forms**: React Hook Form + Zod validation
- **Deployment**: Azure Static Web Apps (Free tier)

### DevOps
- **CI/CD**: GitHub Actions
- **Monitoring**: Azure Application Insights
- **Testing**: Jest (backend) + Vitest (frontend)
- **Type Safety**: TypeScript 5.x strict mode (zero `any` types)

---

## Performance Targets

From spec.md (Success Criteria):

| Metric | Target | How to Achieve |
|--------|--------|----------------|
| Page Load | <2s (p95) | Code splitting, lazy loading, CDN |
| API Response | <200ms (p95) | Indexed queries, caching, optimized CTEs |
| Weekly Reset | <5s for 1000 agents | Bulk UPDATE, batch audit logs |
| Commission Calc | <5s for 20 levels | Recursive CTE with caching |
| Report Generation | <2s for 1 week data | Optimized aggregation queries |

---

## Security Requirements

Constitutional mandates (non-negotiable):

✅ **Type Safety**: TypeScript strict mode, no `any` types
✅ **Input Validation**: Zod at all boundaries, class-validator in DTOs
✅ **Authentication**: JWT with rotation, bcrypt (cost 12) for passwords
✅ **Authorization**: RBAC with role guards on every endpoint
✅ **Data Isolation**: Row-level security via Prisma middleware
✅ **Audit Logging**: All financial operations logged (immutable)
✅ **SQL Injection**: Prisma parameterized queries (no raw SQL interpolation)
✅ **XSS Prevention**: validator.escape() on all user inputs
✅ **CORS**: Strict whitelist (no wildcard)
✅ **HTTPS**: Enforced by Azure (no HTTP allowed)

---

## Next Steps

With architectural decisions finalized, proceed to:

1. ✅ **Phase 1: Setup** - Create monorepo structure (apps/backend, apps/frontend)
2. ✅ **Phase 2: Foundational** - Implement critical infrastructure (auth, RLS, caching, encryption)
3. ⏭️ **Phase 3-10: User Stories** - Implement features incrementally
4. ⏭️ **Phase 11: Polish** - Performance, security, accessibility

**Start Time**: 2025-11-18 (Now)
**Estimated Completion**: 12-14 weeks with 3-4 developers (or AI equivalent)

---

**Approval**: Decisions approved for immediate implementation. No further clarification needed from user.
