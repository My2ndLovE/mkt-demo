# Implementation Prompt: Multi-Level Agent Lottery Sandbox System

**Purpose**: Complete prompt for starting implementation in a new Claude Code session
**Date**: 2025-11-18
**Project**: Multi-Level Agent Lottery Sandbox System
**Repository**: C:\WebDev\MKT

---

## Copy This Entire Prompt to Start Implementation

```
I need you to implement the Multi-Level Agent Lottery Sandbox System following the SpecKit workflow that has already been completed.

## Project Context

**Location**: C:\WebDev\MKT
**Branch**: 001-lottery-sandbox
**Specification Directory**: C:\WebDev\MKT\specs\001-lottery-sandbox

## What's Already Done

All specification work is complete:
1. ✅ Constitution (.specify/constitution.md) - 3 CRITICAL principles
2. ✅ Feature Specification (specs/001-lottery-sandbox/spec.md) - 8 user stories
3. ✅ Implementation Plan (specs/001-lottery-sandbox/plan.md) - passed constitution check
4. ✅ Research Findings (specs/001-lottery-sandbox/research.md) - 5 research tasks
5. ✅ Data Model (specs/001-lottery-sandbox/data-model.md) - Complete Prisma schema
6. ✅ API Contracts (specs/001-lottery-sandbox/contracts/openapi.yaml) - 76+ endpoints
7. ✅ Quickstart Guide (specs/001-lottery-sandbox/quickstart.md) - Azure deployment
8. ✅ Task Breakdown (specs/001-lottery-sandbox/tasks.md) - 345 tasks organized by user story

## Architecture Overview

**Tech Stack**:
- **Frontend**: Vite 6 + React 19 + React Router 7 (framework mode, CSR)
- **Backend**: NestJS v10 on Azure Functions (Node.js 20 LTS)
- **Database**: Azure SQL Database with Prisma v5 ORM
- **Infrastructure**: Azure Static Web Apps + Azure Functions + Azure SQL
- **Caching**: In-memory (cache-manager) → optional Redis later
- **State Management**: TanStack Query v5 (server) + Zustand v5 (client)
- **UI**: shadcn/ui + Tailwind CSS v4
- **Testing**: Jest (backend), Vitest (frontend), 100% coverage for critical logic

## Critical Requirements (Constitution - NON-NEGOTIABLE)

### I. Type Safety & Code Quality (CRITICAL)
- TypeScript strict mode MUST be enabled (no `any` types)
- 100% test coverage REQUIRED for:
  - Commission calculations
  - Quota/limit management
  - Bet validation
- TDD approach: Write failing test → Implement → Refactor

### II. User Experience & Accessibility (CRITICAL)
- Mobile-first design (375px minimum width, 100% mobile users)
- Performance targets:
  - Page Load: < 2s (p95)
  - Time to Interactive: < 3s
  - API Response: < 200ms (p95)
- WCAG 2.1 AA compliance (44x44px tap targets, 4.5:1 contrast)

### III. Security & Data Integrity (CRITICAL)
- JWT tokens (15min access, 7day refresh)
- bcrypt password hashing (cost factor 12)
- Row-level security (moderator data isolation)
- Audit logging for ALL financial operations
- NO SQL injection, XSS vulnerabilities

## Implementation Strategy

**IMPORTANT**: Follow this exact sequence:

### Phase 1: Setup (Tasks T001-T018)
Create monorepo structure with backend/ and frontend/ directories.

### Phase 2: Foundational - CRITICAL BLOCKERS (Tasks T019-T268)

⚠️ **BLOCKING DECISIONS REQUIRED FIRST**:

1. **Multi-Provider Betting Architecture** (Task T215):
   - **OPTION A** (RECOMMENDED): Single bet with provider array
   - **OPTION B**: Multiple bets, one per provider
   - **Decision**: Choose OPTION A (simpler, one receipt)
   - **Action**: Update Prisma schema to support `providerId String[]` or junction table

2. **API Key Encryption** (Tasks T236-T240):
   - Install @nestjs/crypto or crypto-js
   - Create encryption service (AES-256-GCM)
   - Configure Azure Key Vault for encryption key
   - Encrypt ServiceProvider.apiKey before saving

⚠️ **CRITICAL INFRASTRUCTURE** (MUST complete before any user stories):
- Database transactions (T220-T224) - Prisma.$transaction for atomic operations
- Azure Functions configuration (T225-T229) - host.json, function.json, timezone
- Row-level security (T230-T235) - Prisma middleware for moderator isolation
- Caching (T241-T248) - @nestjs/cache-manager setup
- Validation services (T249-T254) - Bet number, draw cutoff, iBox validators
- Error handling (T255-T261) - Custom exceptions, logging, notifications
- Authentication flow (T262-T268) - Login page, token refresh, auth guards

### Phase 3: User Story 1 - Agent Places Practice Bet (MVP) (Tasks T051-T311)

**Goal**: Agent can log in, place bet (single/multi-provider), view history, cancel pending bets, see receipt.

**Implementation Order**:
1. **Tests First (TDD)**: T051-T054, T284, T289 - Write ALL tests, ensure they FAIL
2. **Validators**: T249-T254 - Bet number, draw cutoff, iBox validators
3. **Backend**: T055-T064, T220, T276-T281, T330, T337 - Services, controllers, transactions
4. **Frontend**: T065-T073, T285-T288, T310-T311 - Hooks, forms, text parser

**Test Coverage**: 100% for bets.service.ts and limits.service.ts (constitution requirement)

### Phase 4-10: Remaining User Stories (Tasks T074-T345)

Continue with:
- **US2**: Admin configures providers (with API key encryption)
- **US3**: Moderator creates agents (with row-level security)
- **US4**: Results & commissions (with hierarchy caching)
- **US5**: Reports (6 different types)
- **US6**: Weekly auto-reset (Azure Functions timer)
- **US7**: Sub-agents (unlimited hierarchy)
- **US8**: API sync (circuit breaker, retry, fallback)
- **Phase 11**: Polish (performance, security, accessibility)

## Key Implementation Patterns

### 1. Database Transactions (CRITICAL)
```typescript
// All financial operations MUST be in transactions
async placeBet(dto: CreateBetDto, userId: number) {
  return await this.prisma.$transaction(async (tx) => {
    // 1. Deduct limit
    await tx.user.update({
      where: { id: userId },
      data: { weeklyUsed: { increment: dto.betAmount } }
    });

    // 2. Create bet
    const bet = await tx.bet.create({
      data: { ...dto, agentId: userId }
    });

    // 3. Audit log
    await tx.auditLog.create({
      data: { userId, action: 'BET_PLACED', metadata: JSON.stringify(bet) }
    });

    return bet;
  });
}
```

### 2. Row-Level Security (CRITICAL)
```typescript
// Prisma middleware in backend/src/prisma/prisma.middleware.ts
prisma.$use(async (params, next) => {
  const user = getCurrentUser();

  if (user.role === 'ADMIN') {
    return next(params); // Admins bypass RLS
  }

  if (user.role === 'MODERATOR' || user.role === 'AGENT') {
    if (['Bet', 'User', 'Commission'].includes(params.model)) {
      if (params.action.startsWith('find')) {
        params.args.where = {
          ...params.args.where,
          moderatorId: user.role === 'MODERATOR' ? user.id : user.moderatorId
        };
      }
    }
  }

  return next(params);
});
```

### 3. Hierarchy Caching (CRITICAL)
```typescript
// Cache hierarchy paths for 30 minutes
async getUplineChain(agentId: number) {
  const cacheKey = `hierarchy:upline:${agentId}`;

  // Try cache first
  const cached = await this.cacheManager.get(cacheKey);
  if (cached) return cached;

  // Recursive CTE query
  const result = await this.prisma.$queryRaw`
    WITH RECURSIVE AgentHierarchy AS (
      SELECT id, uplineId, commissionRate, 0 AS level
      FROM [User] WHERE id = ${agentId}
      UNION ALL
      SELECT u.id, u.uplineId, u.commissionRate, ah.level + 1
      FROM [User] u
      INNER JOIN AgentHierarchy ah ON u.id = ah.uplineId
      WHERE ah.level < 100
    )
    SELECT * FROM AgentHierarchy WHERE level > 0 ORDER BY level ASC
  `;

  // Cache for 30 minutes
  await this.cacheManager.set(cacheKey, result, 1800);
  return result;
}
```

## File Structure to Create

```
C:\WebDev\MKT\
├── backend/
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   ├── providers/
│   │   │   ├── bets/
│   │   │   ├── limits/
│   │   │   ├── results/
│   │   │   ├── commissions/
│   │   │   └── reports/
│   │   ├── common/
│   │   │   ├── decorators/
│   │   │   ├── guards/
│   │   │   ├── filters/
│   │   │   ├── interceptors/
│   │   │   ├── pipes/
│   │   │   ├── services/ (encryption, cache, error-logger)
│   │   │   ├── utils/
│   │   │   └── exceptions/
│   │   ├── config/
│   │   ├── prisma/
│   │   ├── functions/ (weekly-reset, results-sync, token-cleanup)
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.ts
│   ├── test/
│   ├── package.json
│   ├── tsconfig.json
│   ├── nest-cli.json
│   ├── host.json
│   └── .env.example
│
├── frontend/
│   ├── app/
│   │   ├── routes/
│   │   │   ├── _index.tsx
│   │   │   ├── login.tsx
│   │   │   ├── app/ (authenticated routes)
│   │   │   ├── admin/ (admin routes)
│   │   │   └── moderator/ (moderator routes)
│   │   ├── components/
│   │   │   ├── ui/ (shadcn/ui)
│   │   │   ├── features/
│   │   │   └── layout/
│   │   ├── hooks/
│   │   ├── stores/
│   │   ├── lib/
│   │   └── types/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── tailwind.config.ts
│
├── package.json (workspace root)
└── pnpm-workspace.yaml
```

## Step-by-Step Execution

**Start with these exact commands**:

1. Read the complete task list:
   ```
   Read C:\WebDev\MKT\specs\001-lottery-sandbox\tasks.md
   ```

2. Understand critical requirements:
   ```
   Read C:\WebDev\MKT\.specify\constitution.md
   Read C:\WebDev\MKT\specs\001-lottery-sandbox\plan.md (sections: Constitution Check, Project Structure)
   ```

3. Review data model:
   ```
   Read C:\WebDev\MKT\specs\001-lottery-sandbox\data-model.md
   ```

4. Start implementation:
   ```
   Begin with Phase 1: Setup (T001-T018)
   Then Phase 2: Foundational (T019-T268) - COMPLETE ALL CRITICAL TASKS
   Then Phase 3: User Story 1 MVP (T051-T311)
   ```

## Important Reminders

1. ✅ **TDD**: Write failing tests FIRST, then implement
2. ✅ **Transactions**: ALL financial operations in Prisma.$transaction
3. ✅ **RLS**: Implement Prisma middleware for data isolation
4. ✅ **Caching**: Use @nestjs/cache-manager for hierarchy and providers
5. ✅ **Validation**: Create validators BEFORE DTOs
6. ✅ **Error Handling**: Custom exceptions for all business logic errors
7. ✅ **Security**: Encrypt API keys, hash passwords, sanitize inputs
8. ✅ **Accessibility**: 44x44px tap targets, ARIA labels, keyboard navigation
9. ✅ **Performance**: <2s page load, <200ms API response
10. ✅ **NO shortcuts**: Follow tasks.md exactly, complete all CRITICAL tasks

## Questions to Ask Before Starting

Before implementing, clarify:
1. ✅ Multi-provider architecture decision (OPTION A recommended)
2. ✅ Azure subscription details for deployment
3. ✅ Magayo API key for lottery results (or use manual entry only for MVP)
4. ✅ Database credentials for Azure SQL (or use local SQL Server for development)

## Success Criteria for MVP (User Story 1)

Agent can:
- ✅ Log in with username/password
- ✅ See dashboard with weekly limit balance
- ✅ Place bet in Simple mode (text: "M 1234 BIG 10")
- ✅ Place bet in Detailed mode (form with dropdowns)
- ✅ Place multi-provider bet (M+P+T simultaneously)
- ✅ View bet history with filters
- ✅ Cancel pending bets (before draw)
- ✅ Receive unique receipt number
- ✅ See receipt confirmation dialog

Tests:
- ✅ 100% coverage for bets.service.ts
- ✅ 100% coverage for limits.service.ts
- ✅ Integration tests pass for bet placement flow
- ✅ Frontend component tests pass

Performance:
- ✅ Betting page loads in <2s
- ✅ Bet placement API responds in <200ms
- ✅ Works on mobile (375px width)

## Reference Documents

All specs are in: C:\WebDev\MKT\specs\001-lottery-sandbox/

- **tasks.md** - 345 tasks organized by user story (YOUR PRIMARY GUIDE)
- **spec.md** - 8 user stories with acceptance criteria
- **plan.md** - Technical approach and structure
- **data-model.md** - Complete Prisma schema
- **contracts/openapi.yaml** - All API endpoints
- **quickstart.md** - Local setup and Azure deployment
- **research.md** - Technical decisions and patterns
- **.specify/constitution.md** - Critical principles

## Let's Begin!

Please confirm you understand the scope and start with:
1. Read tasks.md to see all 345 tasks
2. Make the multi-provider architecture decision (OPTION A recommended)
3. Begin Phase 1: Setup (T001-T018)

Use the TodoWrite tool to track progress through all tasks.
```

---

## Additional Context for Implementation

### MVP Timeline Expectation

**With 2 developers**:
- Week 1: Phase 1 (Setup) + Phase 2 (Foundational, all CRITICAL tasks)
- Week 2: Phase 3 (User Story 1 - Backend)
- Week 3: Phase 3 (User Story 1 - Frontend)
- Week 4: Testing, bug fixes, deploy to staging

**Total: 3-4 weeks for MVP**

### Common Pitfalls to Avoid

1. ❌ Skipping tests - MUST write tests FIRST (TDD)
2. ❌ No transactions - ALL financial ops need Prisma.$transaction
3. ❌ Missing RLS - Implement Prisma middleware BEFORE User Story 3
4. ❌ Hardcoded values - Use config/env for all settings
5. ❌ No caching - Implement cache BEFORE User Story 4
6. ❌ Weak validation - Create validators BEFORE DTOs
7. ❌ Plain text secrets - Encrypt API keys with Azure Key Vault
8. ❌ Desktop-first design - MUST be mobile-first (375px)

### Quick Reference Commands

```bash
# Start backend dev server
cd backend && pnpm dev

# Start frontend dev server
cd frontend && pnpm dev

# Run all tests
pnpm test

# Run Prisma migrations
cd backend && pnpm prisma migrate dev

# Generate Prisma client
cd backend && pnpm prisma generate

# Seed database
cd backend && pnpm prisma db seed
```

---

**This prompt is ready to copy-paste into a new Claude Code session to start implementation immediately.**
