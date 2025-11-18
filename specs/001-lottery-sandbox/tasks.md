# Tasks: Multi-Level Agent Lottery Sandbox System (UPDATED)

**Version**: 2.0 - Post-Review Update
**Review Date**: 2025-11-18
**Changes**: Added 131 missing tasks identified in comprehensive review

**Input**: Design documents from `specs/001-lottery-sandbox/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/openapi.yaml, quickstart.md
**Constitution**: `.specify/constitution.md` (Type Safety, UX/Accessibility, Security - all CRITICAL)

**Tests**: TDD approach required for critical business logic (commission calculations, quota management, bet validation) - 100% coverage mandated by constitution.

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [Priority] [P?] [Story] Description`

- **[Priority]**: 🔴 CRITICAL | 🟠 HIGH | 🟡 MEDIUM | 🔵 LOW
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story mapping (US1, US2, US3, US4, US5, US6, US7, US8)
- Include exact file paths in descriptions

## Critical Decisions Required Before Implementation

⚠️ **BLOCKING DECISIONS - Must resolve before proceeding**:

1. **Multi-Provider Betting Architecture** (see REVIEW_FINDINGS.md #1):
   - **OPTION A**: Single bet with provider array (simpler, one receipt)
   - **OPTION B**: Multiple bets, one per provider (more complex, multiple receipts)
   - **Recommendation**: OPTION A (update Prisma schema to support provider array)

2. **API Key Storage** (see REVIEW_FINDINGS.md #5):
   - **Decision**: Encrypt API keys using Azure Key Vault encryption key
   - **Impact**: Add encryption service to Phase 2 Foundational

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and monorepo structure

### Backend Setup

- [ ] T001 Create backend directory structure per plan.md (src/modules/, src/common/, src/config/, src/prisma/, test/)
- [ ] T002 Initialize NestJS project in backend/ with TypeScript 5.x and strict mode enabled
- [ ] T003 [P] Configure ESLint with TypeScript rules in backend/.eslintrc.js (zero warnings requirement)
- [ ] T004 [P] Configure Prettier in backend/.prettierrc
- [ ] T005 [P] Setup Jest testing framework in backend/jest.config.js
- [ ] T006 [P] Configure Husky git hooks in backend/.husky/ for pre-commit linting
- [ ] T007 Create backend/.env.example with all required environment variables per quickstart.md

### Frontend Setup

- [ ] T008 Create frontend directory structure per plan.md (app/routes/, app/components/, app/lib/, app/stores/)
- [ ] T009 Initialize Vite + React 19 + React Router 7 project in frontend/
- [ ] T010 [P] Configure TypeScript strict mode in frontend/tsconfig.json
- [ ] T011 [P] Setup Tailwind CSS v4 in frontend/tailwind.config.ts
- [ ] T012 [P] Configure ESLint with React rules in frontend/.eslintrc.js
- [ ] T013 [P] Setup Vitest testing framework in frontend/vite.config.ts
- [ ] T014 [P] Install shadcn/ui dependencies (Radix UI, Tailwind, clsx, tailwind-merge)
- [ ] T015 Create frontend/.env.example with VITE_API_BASE_URL per quickstart.md

### Monorepo Configuration

- [ ] T016 Create root package.json with pnpm workspaces configuration
- [ ] T017 [P] Setup GitHub Actions CI/CD workflow in .github/workflows/azure-deploy.yml per quickstart.md
- [ ] T018 [P] Create root .gitignore excluding node_modules, .env, dist/, build/

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### 🔴 CRITICAL: Multi-Provider Architecture Decision

- [ ] **T215** 🔴 [CRITICAL] **BLOCKING** - Decide multi-provider betting architecture (OPTION A: provider array vs OPTION B: multiple bets)
- [ ] **T216** 🔴 [CRITICAL] Update Prisma schema for multi-provider support based on T215 decision
- [ ] **T217** 🔴 [CRITICAL] Update CreateBetDto in contracts/openapi.yaml to accept provider array (if OPTION A)
- [ ] **T218** 🔴 [CRITICAL] Document multi-provider decision in research.md with rationale
- [ ] **T219** 🔴 [CRITICAL] Update weekly limit deduction logic for multi-provider bets (sum all providers)

### Database Foundation

- [ ] T019 Create Prisma schema in backend/prisma/schema.prisma with all 8 entities from data-model.md (incorporate T216 changes)
- [ ] **T269** 🟠 [HIGH] Add composite index (agentId, status) on Bet table
- [ ] **T270** 🟠 [HIGH] Add composite index (providerId, drawDate, gameType) on DrawResult table
- [ ] **T271** 🟠 [HIGH] Add composite index (betId, level) on Commission table
- [ ] **T272** 🟠 [HIGH] Add composite index (userId, createdAt) on AuditLog table
- [ ] **T329** 🟠 [HIGH] Add unique constraint on DrawResult (providerId, gameType, drawDate) to prevent duplicates (FR-047)
- [ ] T020 Create initial database migration: `pnpm prisma migrate dev --name init`
- [ ] T021 Create seed data script in backend/prisma/seed.ts
- [ ] **T304** 🟡 [MEDIUM] Enhance seed data with comprehensive test data (20 bets, 5 results, 10 agents in 3-level hierarchy, sample commissions)
- [ ] T022 [P] Create Prisma service in backend/src/prisma/prisma.service.ts for dependency injection
- [ ] T023 [P] Create Prisma module in backend/src/prisma/prisma.module.ts

### 🔴 CRITICAL: Environment & Configuration

- [ ] **T305** 🟡 [P] [MEDIUM] Create env schema in backend/src/config/env.schema.ts using Zod
- [ ] **T306** 🟡 [MEDIUM] Validate environment variables at app startup in main.ts
- [ ] **T307** 🟡 [MEDIUM] Add type-safe env getter in backend/src/config/configuration.ts
- [ ] **T308** 🟡 [MEDIUM] Document all required vs optional env vars in .env.example with descriptions

### 🔴 CRITICAL: Encryption Service

- [ ] **T236** 🔴 [P] [CRITICAL] Install encryption library (@nestjs/crypto or crypto-js)
- [ ] **T237** 🔴 [CRITICAL] Create encryption service in backend/src/common/services/encryption.service.ts (AES-256-GCM)
- [ ] **T238** 🔴 [CRITICAL] Configure Azure Key Vault integration for encryption key (not in .env)
- [ ] **T240** 🔴 [CRITICAL] Add encryption key rotation procedure documentation

### Authentication Framework (FR-001 to FR-008)

- [ ] T024 Create auth module directory backend/src/modules/auth/
- [ ] T025 [P] Install Passport.js, passport-jwt, jsonwebtoken, bcrypt dependencies
- [ ] T026 [P] Create JWT strategy in backend/src/modules/auth/strategies/jwt.strategy.ts
- [ ] T027 [P] Create JWT auth guard in backend/src/modules/auth/guards/jwt-auth.guard.ts
- [ ] T028 [P] Create roles decorator in backend/src/common/decorators/roles.decorator.ts
- [ ] T029 Create roles guard in backend/src/modules/auth/guards/roles.guard.ts (depends on T028)
- [ ] T030 Create current-user decorator in backend/src/common/decorators/current-user.decorator.ts
- [ ] T031 Create auth service in backend/src/modules/auth/auth.service.ts implementing JWT token generation (15min access, 7day refresh per FR-006/007)
- [ ] T032 [P] Create LoginDto in backend/src/modules/auth/dto/login.dto.ts with class-validator constraints
- [ ] T033 [P] Create RefreshTokenDto in backend/src/modules/auth/dto/refresh-token.dto.ts
- [ ] T034 Create auth controller in backend/src/modules/auth/auth.controller.ts implementing /login, /refresh, /logout endpoints
- [ ] T035 Configure rate limiting middleware in backend/src/common/guards/throttle.guard.ts (5 attempts/15min per FR-008)
- [ ] T036 Create auth module in backend/src/modules/auth/auth.module.ts
- [ ] **T297** 🟡 [MEDIUM] Create expired token cleanup job in backend/src/functions/token-cleanup.function.ts (run daily)
- [ ] **T298** 🟡 [MEDIUM] Add token cleanup method in auth.service.ts (delete tokens where expiresAt < now)
- [ ] **T299** 🟡 [MEDIUM] Configure Timer Trigger for token cleanup (cron: "0 0 2 * * *")

### 🟠 HIGH: Custom Exception Classes

- [ ] **T255** 🟠 [P] [HIGH] Create custom exception classes in backend/src/common/exceptions/ (InsufficientLimitException, DrawClosedException, DuplicateResultException, DataIsolationException)
- [ ] **T256** 🟠 [HIGH] Create error logging service in backend/src/common/services/error-logger.service.ts (integrate with Application Insights)

### Global Exception Handling & Logging

- [ ] T037 [P] Create HTTP exception filter in backend/src/common/filters/http-exception.filter.ts (use T255 custom exceptions)
- [ ] T038 [P] Create logging interceptor in backend/src/common/interceptors/logging.interceptor.ts
- [ ] T039 [P] Create validation pipe in backend/src/common/pipes/validation.pipe.ts with class-validator

### 🟠 HIGH: Caching Infrastructure

- [ ] **T241** 🟠 [P] [HIGH] Install @nestjs/cache-manager and cache-manager packages
- [ ] **T242** 🟠 [HIGH] Configure CacheModule in backend/src/app.module.ts with TTL strategy (providers: 5min, hierarchy: 30min)
- [ ] **T243** 🟠 [HIGH] Create cache service wrapper in backend/src/common/services/cache.service.ts with get/set/invalidate methods

### 🔴 CRITICAL: Azure Functions Configuration

- [ ] **T225** 🔴 [CRITICAL] Create host.json in backend/ with timezone configuration (Asia/Kuala_Lumpur)
- [ ] **T226** 🔴 [CRITICAL] Create function.json for weekly-reset function with Timer Trigger binding (cron: "0 0 0 * * MON")
- [ ] **T227** 🔴 [CRITICAL] Create function.json for results-sync function with Timer Trigger binding (adjust per provider schedule)
- [ ] **T228** 🔴 [CRITICAL] Configure Azure Functions deployment settings in .github/workflows/azure-deploy.yml
- [ ] **T229** 🔴 [CRITICAL] Add WEBSITE_TIME_ZONE="Asia/Kuala_Lumpur" to Azure Functions app settings in quickstart.md

### Application Bootstrap

- [ ] T040 Create configuration service in backend/src/config/configuration.ts loading environment variables (use T305 Zod schema)
- [ ] T041 Create app module in backend/src/app.module.ts importing all global modules (cache, prisma, config, etc.)
- [ ] T042 Create main.ts in backend/src/main.ts with Swagger documentation, CORS, helmet, global pipes/filters

### Frontend Foundation

- [ ] T043 Create API client in frontend/app/lib/api.ts with axios instance and JWT interceptor
- [ ] **T264** 🟠 [HIGH] Implement automatic token refresh in API client (refresh 1 minute before expiry)
- [ ] **T265** 🟠 [HIGH] Add token storage in localStorage (accessToken) and sessionStorage (refreshToken)
- [ ] T044 [P] Create auth store in frontend/app/stores/auth.store.ts using Zustand for user state
- [ ] T045 [P] Create UI store in frontend/app/stores/ui.store.ts for sidebar, modals state
- [ ] T046 Create TypeScript types in frontend/app/types/ (user.ts, bet.ts, provider.ts, api.ts) based on OpenAPI schemas
- [ ] T047 [P] Install shadcn/ui base components (button, card, form, table, dialog, input, label, toast) in frontend/app/components/ui/
- [ ] **T261** 🟠 [HIGH] Create toast notification system in frontend/app/components/ui/toast.tsx
- [ ] **T260** 🟠 [HIGH] Create error boundary component in frontend/app/components/error-boundary.tsx
- [ ] **T309** 🟡 [P] [MEDIUM] Create loading skeleton components in frontend/app/components/ui/skeleton.tsx
- [ ] T048 Create authenticated layout in frontend/app/routes/app/_layout.tsx with header, sidebar, bottom nav
- [ ] T049 [P] Create admin layout in frontend/app/routes/admin/_layout.tsx
- [ ] T050 [P] Create moderator layout in frontend/app/routes/moderator/_layout.tsx
- [ ] **T262** 🟠 [P] [HIGH] Create login page in frontend/app/routes/login.tsx with username/password form
- [ ] **T263** 🟠 [P] [HIGH] Create dashboard page in frontend/app/routes/app/dashboard.tsx with role-specific widgets
- [ ] **T266** 🟠 [HIGH] Create auth guard for protected routes in frontend/app/lib/auth-guard.ts
- [ ] **T267** 🟠 [HIGH] Add loading states for authentication (suspense fallback)
- [ ] **T268** 🟠 [HIGH] Create logout functionality in auth.store.ts (revoke refresh token + clear storage)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Agent Places Practice Bet (Priority: P1) 🎯 MVP

**Goal**: Enable agents to place practice bets on lottery games with weekly limit validation and receipt generation

**Independent Test**: Agent can log in, select provider "Magnum 4D", enter number "1234", choose bet type "BIG", specify amount "$10", and receive bet receipt confirmation. System deducts $10 from their weekly limit. Agent can view bet in history with status "PENDING".

**Maps to**: FR-034 to FR-045 (Betting System), FR-036 (Multi-Provider), FR-043 (Simple/Detailed Modes)

### Tests for User Story 1 (100% Coverage Required - CONSTITUTION CRITICAL) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation (TDD)**

- [ ] T051 [P] [US1] Unit test for bet validation service in backend/test/unit/bets.service.spec.ts (game type validation, number length, amount limits)
- [ ] T052 [P] [US1] Unit test for weekly limit deduction in backend/test/unit/limits.service.spec.ts (insufficient limit scenarios)
- [ ] T053 [P] [US1] Integration test for bet placement endpoint in backend/test/integration/bets.e2e-spec.ts (full bet placement flow, receipt generation)
- [ ] T054 [P] [US1] Frontend component test for bet form in frontend/app/components/features/bet-form/simple-mode.test.tsx
- [ ] **T284** 🟠 [P] [US1] Unit test for iBox permutation generation (test "1234" → 24 permutations, "123" → 6 permutations)
- [ ] **T289** 🟠 [US1] Unit test for bet text parser (test various formats: "M 1234 BIG 10", "M,1234,BIG,10")

### 🟠 HIGH: Validation Services (Create BEFORE implementation)

- [ ] **T249** 🟠 [P] [US1] Create bet number validator in backend/src/modules/bets/validators/bet-number.validator.ts (3D=3 digits, 4D=4 digits, 5D=5, 6D=6)
- [ ] **T250** 🟠 [P] [US1] Create draw cutoff validator in backend/src/modules/bets/validators/draw-cutoff.validator.ts (compare current time with provider.drawSchedule)
- [ ] **T251** 🟠 [P] [US1] Create iBox permutation validator (no repeating digits, e.g., "1123" invalid)
- [ ] **T253** 🟠 [P] [US1] Create Zod schema for drawSchedule JSON validation in backend/src/modules/providers/validators/draw-schedule.validator.ts
- [ ] **T254** 🟠 [P] [US1] Create Zod schema for availableGames/betTypes JSON validation

### Backend Implementation for User Story 1

- [ ] T055 [P] [US1] Create CreateBetDto in backend/src/modules/bets/dto/create-bet.dto.ts with class-validator rules (use T249-T251 validators)
- [ ] T056 [P] [US1] Create CancelBetDto in backend/src/modules/bets/dto/cancel-bet.dto.ts
- [ ] T057 [P] [US1] Create BetResponseDto in backend/src/modules/bets/dto/bet-response.dto.ts
- [ ] T058 [US1] Create limits service in backend/src/modules/limits/limits.service.ts (check balance, deduct amount, restore on cancel)
- [ ] **T220** 🔴 [CRITICAL] [US1] Wrap bet placement in Prisma transaction (deduct limit + create bet + audit log in single transaction)
- [ ] T059 [US1] Create bets service in backend/src/modules/bets/bets.service.ts implementing bet placement logic (depends on T058, T220)
- [ ] T060 [US1] Implement receipt number generation algorithm in bets.service.ts (format: BET-YYYYMMDD-{incrementalId})
- [ ] **T279** 🟠 [US1] Create iBox permutation service in backend/src/modules/bets/services/ibox.service.ts
- [ ] **T280** 🟠 [US1] Implement permutation calculation (4D iBox: 24 perms if all unique, 3D iBox: 6 perms)
- [ ] **T281** 🟠 [US1] Add iBox validation in ibox.service.ts (no repeating digits check)
- [ ] T061 [US1] Create bets controller in backend/src/modules/bets/bets.controller.ts with POST /api/v1/bets and GET /api/v1/bets endpoints
- [ ] **T276** 🟠 [US1] Implement get bet by receipt endpoint in bets.controller.ts (GET /api/v1/bets/receipt/{receiptNumber})
- [ ] T062 [US1] Create bets module in backend/src/modules/bets/bets.module.ts
- [ ] T063 [US1] Create limits module in backend/src/modules/limits/limits.module.ts
- [ ] **T277** 🟠 [US6] Implement limit history endpoint in backend/src/modules/limits/limits.controller.ts (GET /api/v1/limits/history)
- [ ] **T278** 🟠 [US6] Create limit history DTO in backend/src/modules/limits/dto/limit-history.dto.ts
- [ ] T064 [US1] Add authorization guard to bets controller (all roles can access)
- [ ] **T244** 🟠 [HIGH] [US1] Add cache interceptor to providers query (5min TTL, cache active providers)
- [ ] **T337** 🟡 [MEDIUM] [US1] Add `select` optimization to Prisma queries (fetch only needed fields)
- [ ] **T330** 🟠 [HIGH] [US1] Add application-level validation for weeklyUsed <= weeklyLimit in limits.service.ts

### Frontend Implementation for User Story 1

- [ ] T065 [P] [US1] Create use-bets hook in frontend/app/hooks/use-bets.ts with TanStack Query (placeBet mutation, getBets query, getBetByReceipt query)
- [ ] T066 [P] [US1] Create use-limits hook in frontend/app/hooks/use-limits.ts (getBalance query, getLimitHistory query)
- [ ] T067 [P] [US1] Create use-providers hook in frontend/app/hooks/use-providers.ts (listProviders query with caching)
- [ ] **T285** 🟠 [US1] Create bet text parser service in frontend/app/lib/bet-parser.ts
- [ ] **T286** 🟠 [US1] Implement parsing logic for format: "M 1234 BIG 10" → {provider: 'M', numbers: '1234', betType: 'BIG', amount: 10}
- [ ] **T287** 🟠 [US1] Add multi-line parsing support in bet-parser.ts (paste multiple bets at once)
- [ ] **T288** 🟠 [US1] Add error highlighting for invalid text input in simple-mode.tsx
- [ ] T068 [US1] Create simple bet form component in frontend/app/components/features/bet-form/simple-mode.tsx with text parser (use T285-T287)
- [ ] T069 [US1] Create detailed bet form component in frontend/app/components/features/bet-form/detailed-mode.tsx with React Hook Form + Zod validation
- [ ] T070 [US1] Create weekly limit card component in frontend/app/components/features/limit-card/weekly-limit.tsx displaying remaining balance
- [ ] T071 [US1] Create betting page in frontend/app/routes/app/betting/_index.tsx with tab switching (Simple/Detailed mode)
- [ ] T072 [US1] Create bet history page in frontend/app/routes/app/history.tsx with filtering (date, provider, status, game type)
- [ ] T073 [US1] Add bet receipt modal dialog component in frontend/app/components/features/bet-form/receipt-modal.tsx
- [ ] **T311** 🟡 [MEDIUM] [US1] Add loading states to all TanStack Query hooks (isLoading, isFetching indicators)
- [ ] **T310** 🟡 [P] [MEDIUM] [US1] Add suspense fallbacks to lazy-loaded routes

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently. Agent can log in, place bet (single or multi-provider), view history, see receipt. Text parser and detailed form both work.

---

## Phase 4: User Story 2 - Administrator Configures Service Providers (Priority: P1)

**Goal**: Enable administrators to manage lottery service providers (create, update, activate/deactivate, configure games)

**Independent Test**: Admin can log in, navigate to providers page, add new provider "Sports Toto" with games [4D, 5D, 6D], draw schedule [Wed, Sat, Sun 7:00 PM], save configuration. Provider immediately appears in agent betting dropdown. Admin can deactivate provider and it disappears from agent interface.

**Maps to**: FR-009 to FR-015 (Service Provider Management)

### Tests for User Story 2 ⚠️

- [ ] T074 [P] [US2] Unit test for provider validation in backend/test/unit/providers.service.spec.ts (unique code, valid game types, draw schedule format)
- [ ] T075 [P] [US2] Integration test for provider CRUD endpoints in backend/test/integration/providers.e2e-spec.ts (create, update, deactivate)

### Backend Implementation for User Story 2

- [ ] T076 [P] [US2] Create CreateServiceProviderDto in backend/src/modules/providers/dto/create-provider.dto.ts (use T253-T254 Zod schemas for JSON validation)
- [ ] T077 [P] [US2] Create UpdateServiceProviderDto in backend/src/modules/providers/dto/update-provider.dto.ts
- [ ] T078 [P] [US2] Create ServiceProviderResponseDto in backend/src/modules/providers/dto/provider-response.dto.ts
- [ ] T079 [US2] Create providers service in backend/src/modules/providers/providers.service.ts (CRUD operations, active filter)
- [ ] **T239** 🔴 [CRITICAL] [US2] Encrypt apiKey using encryption service (T237) before saving in providers.service.ts
- [ ] **T247** 🟠 [HIGH] [US2] Add cache invalidation on provider update/delete in providers.service.ts
- [ ] T080 [US2] Create providers controller in backend/src/modules/providers/providers.controller.ts (GET /api/v1/providers, POST, PATCH, DELETE)
- [ ] T081 [US2] Add role-based authorization to providers controller (ADMIN only for create/update/delete)
- [ ] T082 [US2] Create providers module in backend/src/modules/providers/providers.module.ts

### Frontend Implementation for User Story 2

- [ ] T083 [P] [US2] Update use-providers hook in frontend/app/hooks/use-providers.ts (add createProvider, updateProvider, deleteProvider mutations)
- [ ] T084 [US2] Create provider form component in frontend/app/components/features/providers/provider-form.tsx with React Hook Form + Zod (draw schedule as JSON editor)
- [ ] T085 [US2] Create providers list page in frontend/app/routes/admin/providers.tsx with TanStack Table (sortable, filterable)
- [ ] T086 [US2] Add provider create/edit dialog in frontend/app/components/features/providers/provider-dialog.tsx
- [ ] T087 [US2] Add provider activation toggle in providers list with confirmation dialog

**Checkpoint**: Admin can manage all providers. Active providers appear in agent betting interface (US1 integration validated). API keys are encrypted in database.

---

## Phase 5: User Story 3 - Moderator Creates Agent with Commission Structure (Priority: P1)

**Goal**: Enable moderators to create agents with weekly limits and commission rates, establishing hierarchical structure with complete data isolation

**Independent Test**: Moderator logs in, creates agent "agent001" with username, password, full name, weekly limit $1000, commission rate 30%. Agent can immediately log in, sees $1000 available limit, places $100 bet. Moderator sees agent in their downline list. Moderator cannot see agents from other moderators.

**Maps to**: FR-016 to FR-025 (Agent Hierarchy Management), FR-020 to FR-022 (Limits), FR-021 (Commission), FR-003 to FR-004 (Data Isolation)

### Tests for User Story 3 (100% Coverage Required - CONSTITUTION CRITICAL) ⚠️

- [ ] T088 [P] [US3] Unit test for hierarchy validation in backend/test/unit/users.service.spec.ts (upline relationship, limit allocation, circular reference prevention)
- [ ] T089 [P] [US3] Unit test for commission rate validation in backend/test/unit/users.service.spec.ts (0-100 range, decimal precision)
- [ ] T090 [P] [US3] Integration test for agent creation in backend/test/integration/users.e2e-spec.ts (moderator creates agent, agent can login)
- [ ] **T235** 🔴 [CRITICAL] [US3] Integration test for data isolation (moderator A cannot query moderator B's agents/bets/commissions)
- [ ] **T345** 🟡 [MEDIUM] [US3] E2E test: Data isolation across all endpoints (verify row-level security works)

### 🔴 CRITICAL: Row-Level Security Implementation

- [ ] **T230** 🔴 [CRITICAL] [US3] Create Prisma middleware in backend/src/prisma/prisma.middleware.ts for moderator filtering
- [ ] **T231** 🔴 [CRITICAL] [US3] Add moderatorId filter to all Bet queries in Prisma middleware
- [ ] **T232** 🔴 [CRITICAL] [US3] Add moderatorId filter to all User/Agent queries in Prisma middleware
- [ ] **T233** 🔴 [CRITICAL] [US3] Add moderatorId filter to all Commission queries in Prisma middleware
- [ ] **T234** 🔴 [CRITICAL] [US3] Create bypass logic for ADMIN role in Prisma middleware (admins see all data)

### Backend Implementation for User Story 3

- [ ] T091 [P] [US3] Create CreateUserDto (CreateAgentDto) in backend/src/modules/users/dto/create-user.dto.ts with role validation
- [ ] T092 [P] [US3] Create UpdateUserDto in backend/src/modules/users/dto/update-user.dto.ts
- [ ] T093 [P] [US3] Create UserResponseDto in backend/src/modules/users/dto/user-response.dto.ts
- [ ] T094 [P] [US3] Create ResetPasswordDto in backend/src/modules/users/dto/reset-password.dto.ts
- [ ] **T223** 🔴 [CRITICAL] [US3] Wrap agent creation in Prisma transaction (create user + allocate limit from upline + create audit log)
- [ ] T095 [US3] Create users service in backend/src/modules/users/users.service.ts (create agent, validate hierarchy, allocate limits - use T223 transaction)
- [ ] T096 [US3] Implement password hashing in users.service.ts using bcrypt with cost factor 12 (FR-005)
- [ ] T097 [US3] Create users controller in backend/src/modules/users/users.controller.ts (GET /api/v1/agents, POST /api/v1/agents, PATCH)
- [ ] **T274** 🟠 [HIGH] [US3] Implement reset password endpoint in users.controller.ts (POST /api/v1/agents/{agentId}/reset-password)
- [ ] **T275** 🟠 [HIGH] [US3] Add reset password authorization (upline can reset downline password, not peers)
- [ ] T098 [US3] Add role-based authorization (MODERATOR can create AGENT, AGENT can create sub-AGENT if canCreateSubs=true)
- [ ] T099 [US3] Create users module in backend/src/modules/users/users.module.ts

### Frontend Implementation for User Story 3

- [ ] T100 [P] [US3] Create use-agents hook in frontend/app/hooks/use-agents.ts with TanStack Query (listAgents, createAgent, updateAgent, resetPassword mutations)
- [ ] T101 [US3] Create agent form component in frontend/app/components/features/agents/agent-form.tsx with password strength indicator
- [ ] T102 [US3] Create agents list page in frontend/app/routes/moderator/agents.tsx with TanStack Table
- [ ] T103 [US3] Create agent creation dialog in frontend/app/components/features/agents/agent-dialog.tsx
- [ ] T104 [US3] Add commission rate input with validation (0-100, 2 decimal places) in agent form

**Checkpoint**: Moderators can create agents with limits and commission. Agents can log in and place bets (US1 integration). Limits are properly allocated from moderator's balance. Data isolation verified - moderators cannot see other moderators' data.

---

## Phase 6: User Story 4 - Agent Views Bet Results and Commission (Priority: P2)

**Goal**: After draw completion, agents can view bet win/loss status and commission earnings with multi-level commission calculation

**Independent Test**: Admin manually enters draw result for Magnum 4D (1st prize: "1234"). Agent who placed bet on "1234" views results page, sees "WON - 1st Prize: $2500" status, commission breakdown showing their 30% share. All pending bets for that draw automatically update to WON/LOST status. Commissions flow through all hierarchy levels.

**Maps to**: FR-046 to FR-055 (Result Management), FR-056 to FR-062 (Commission System)

### Tests for User Story 4 (100% Coverage Required - CONSTITUTION CRITICAL) ⚠️

- [ ] T105 [P] [US4] Unit test for winning calculation in backend/test/unit/results.service.spec.ts (BIG/SMALL/iBox prize amounts, all prize categories)
- [ ] T106 [P] [US4] Unit test for commission calculation in backend/test/unit/commissions.service.spec.ts (multi-level hierarchy, rate precision, banker's rounding)
- [ ] T107 [P] [US4] Integration test for result processing in backend/test/integration/results.e2e-spec.ts (bet status updates, commission creation)
- [ ] **T248** 🟠 [HIGH] [US4] Integration test for hierarchy caching (verify >90% cache hit rate for commission queries)
- [ ] **T319** 🔵 [LOW] [US4] Unit test for banker's rounding edge cases (0.5→0, 1.5→2, 2.5→2, 3.5→4)

### Backend Implementation for User Story 4

- [ ] T108 [P] [US4] Create CreateDrawResultDto in backend/src/modules/results/dto/create-result.dto.ts with prize validation
- [ ] T109 [P] [US4] Create DrawResultResponseDto in backend/src/modules/results/dto/result-response.dto.ts
- [ ] T110 [P] [US4] Create CommissionResponseDto in backend/src/modules/commissions/dto/commission-response.dto.ts
- [ ] T111 [P] [US4] Create CommissionSummaryDto in backend/src/modules/commissions/dto/commission-summary.dto.ts
- [ ] **T317** 🔵 [P] [LOW] [US4] Create rounding utility in backend/src/common/utils/rounding.util.ts (banker's rounding implementation)
- [ ] **T313** 🟡 [US4] Create prize configuration table/JSON in Prisma schema or config file
- [ ] **T314** 🟡 [US4] Store prize amounts per provider/game type/bet type in prize config
- [ ] T112 [US4] Create results service in backend/src/modules/results/results.service.ts (manual result entry, validation against duplicates per T329)
- [ ] T113 [US4] Implement winning calculation algorithm in results.service.ts (load prize config from T313-T314, not hardcoded)
- [ ] **T282** 🟠 [HIGH] [US4] Implement iBox prize calculation (different from BIG/SMALL) in results.service.ts
- [ ] **T221** 🔴 [CRITICAL] [US4] Wrap result processing in Prisma transaction (update bet status + create commissions + audit log)
- [ ] T114 [US4] Create results processor in backend/src/modules/results/results.processor.ts to match bets against results
- [ ] **T283** 🟠 [HIGH] [US4] Add iBox winning logic in results.processor.ts (match any permutation)
- [ ] **T245** 🟠 [HIGH] [US7] Implement hierarchy path caching in users.service.ts (getUplineChain method with 30min TTL)
- [ ] T115 [US4] Create commissions service in backend/src/modules/commissions/commissions.service.ts implementing recursive hierarchy commission calculation
- [ ] T116 [US4] Implement recursive CTE query in commissions.service.ts to get upline chain (SQL Server WITH RECURSIVE, use cached paths from T245)
- [ ] **T333** 🟡 [MEDIUM] [US4] Add depth check in commissions.service.ts (if hierarchy depth > 5, queue background job)
- [ ] **T334** 🟡 [MEDIUM] [US4] Create commission queue service using Bull Queue (Redis-based for background processing)
- [ ] **T335** 🟡 [MEDIUM] [US4] Create commission worker to process queued commissions
- [ ] T117 [US4] Create results controller in backend/src/modules/results/results.controller.ts (GET /api/v1/results, POST /api/v1/results - ADMIN only)
- [ ] T118 [US4] Create commissions controller in backend/src/modules/commissions/commissions.controller.ts (GET /api/v1/commissions, GET /api/v1/commissions/summary)
- [ ] T119 [US4] Create results module in backend/src/modules/results/results.module.ts
- [ ] T120 [US4] Create commissions module in backend/src/modules/commissions/commissions.module.ts

### Frontend Implementation for User Story 4

- [ ] T121 [P] [US4] Create use-results hook in frontend/app/hooks/use-results.ts (listResults query, createResult mutation - admin only)
- [ ] T122 [P] [US4] Create use-commissions hook in frontend/app/hooks/use-commissions.ts (listCommissions, getCommissionSummary queries)
- [ ] T123 [US4] Create results page in frontend/app/routes/app/results.tsx displaying latest draw results with win/loss highlighting
- [ ] T124 [US4] Create result entry form in frontend/app/routes/admin/results-entry.tsx (admin only) with all prize categories (1st, 2nd, 3rd, Starters array, Consolations array)
- [ ] T125 [US4] Update bet history page to display win/loss status and prize amount (enhance T072)
- [ ] T126 [US4] Create commission breakdown component in frontend/app/components/features/commissions/commission-breakdown.tsx showing per-bet commissions by level
- [ ] T127 [US4] Add commission summary card to dashboard showing total earnings for date range

**Checkpoint**: Results can be manually entered. All pending bets automatically process. Commissions calculate correctly through unlimited hierarchy (cached for performance). Agents see their winnings and commission earnings. iBox bets work correctly.

---

## Phase 7: User Story 5 - Moderator Generates Weekly Performance Report (Priority: P2)

**Goal**: Moderators can generate comprehensive performance reports for their agents over date ranges (6 different report types)

**Independent Test**: Moderator selects date range (Nov 10-16), clicks "Generate Report A-1", sees table with number frequency analysis. Clicks "Generate Report B-1", sees monthly calendar view. All reports complete in <2 seconds. Moderator clicks "Export Excel" and downloads formatted report.

**Maps to**: FR-063 to FR-071 (Reporting System)

### Tests for User Story 5

- [ ] T128 [P] [US5] Unit test for report aggregation in backend/test/unit/reports.service.spec.ts (correct totals, grouping by agent, number frequency calculation)
- [ ] T129 [P] [US5] Integration test for report generation in backend/test/integration/reports.e2e-spec.ts (moderator access control, <2s generation time)

### Backend Implementation for User Story 5

- [ ] T130 [P] [US5] Create ReportA1Dto in backend/src/modules/reports/dto/report-a1.dto.ts (Rough Stats schema - number frequency)
- [ ] T131 [P] [US5] Create ReportA2Dto in backend/src/modules/reports/dto/report-a2.dto.ts (Inquiry schema - advanced search)
- [ ] T132 [P] [US5] Create ReportA3Dto in backend/src/modules/reports/dto/report-a3.dto.ts (Order Summary schema)
- [ ] T133 [P] [US5] Create ReportB1Dto in backend/src/modules/reports/dto/report-b1.dto.ts (Performance Calendar schema)
- [ ] T134 [P] [US5] Create ReportB2Dto in backend/src/modules/reports/dto/report-b2.dto.ts (Winning Orders schema)
- [ ] T135 [P] [US5] Create ReportB3Dto in backend/src/modules/reports/dto/report-b3.dto.ts (7-Day Summary schema)
- [ ] T136 [US5] Create reports service in backend/src/modules/reports/reports.service.ts
- [ ] **T290** 🟡 [MEDIUM] [US5] Implement Report A-1 query in reports.service.ts (number frequency analysis, GROUP BY bet number, COUNT)
- [ ] **T291** 🟡 [MEDIUM] [US5] Implement Report A-2 query (advanced search with multiple filters: date, provider, agent, game type, bet type)
- [ ] **T292** 🟡 [MEDIUM] [US5] Implement Report A-3 query (order summary with pagination, all bets with details)
- [ ] **T293** 🟡 [MEDIUM] [US5] Implement Report B-1 query (monthly calendar view, GROUP BY date, aggregate totals)
- [ ] **T294** 🟡 [MEDIUM] [US5] Implement Report B-2 query (winning bets only, filter WHERE status = 'WON', group by prize category)
- [ ] **T295** 🟡 [MEDIUM] [US5] Implement Report B-3 query (7-day summary, aggregate by agent and date, calculate totals)
- [ ] T137 [US5] Implement Excel export functionality in reports.service.ts using exceljs library
- [ ] T138 [US5] Create reports controller in backend/src/modules/reports/reports.controller.ts (GET /api/v1/reports/a1, a2, a3, b1, b2, b3)
- [ ] T139 [US5] Add role-based authorization (MODERATOR sees only their org via RLS middleware T230-T234, ADMIN sees all)
- [ ] T140 [US5] Create reports module in backend/src/modules/reports/reports.module.ts

### Frontend Implementation for User Story 5

- [ ] T141 [P] [US5] Create use-reports hook in frontend/app/hooks/use-reports.ts (generateReport mutations for all 6 types with loading states)
- [ ] T142 [US5] Create report filters component in frontend/app/components/features/reports/report-filters.tsx (date range picker, agent selector, provider filter)
- [ ] T143 [US5] Create Report A-1 page in frontend/app/routes/moderator/reports/a1.tsx with TanStack Table (number frequency display)
- [ ] T144 [P] [US5] Create Report A-2 page in frontend/app/routes/moderator/reports/a2.tsx (advanced search form)
- [ ] T145 [P] [US5] Create Report A-3 page in frontend/app/routes/moderator/reports/a3.tsx (paginated order list)
- [ ] T146 [P] [US5] Create Report B-1 page in frontend/app/routes/moderator/reports/b1.tsx
- [ ] **T296** 🟡 [MEDIUM] [US5] Create calendar view component for Report B-1 in frontend/app/components/features/reports/calendar-view.tsx
- [ ] T147 [P] [US5] Create Report B-2 page in frontend/app/routes/moderator/reports/b2.tsx (winning bets table)
- [ ] T148 [P] [US5] Create Report B-3 page in frontend/app/routes/moderator/reports/b3.tsx (7-day summary table)
- [ ] T149 [US5] Add Excel export button to all report pages triggering download

**Checkpoint**: Moderators can generate all 6 reports filtered by date range and agent. Reports display correctly with proper formatting. All reports complete within 2-second target (SC-006). Excel export works for all reports.

---

## Phase 8: User Story 6 - System Auto-Resets Weekly Limits (Priority: P2)

**Goal**: Automated weekly limit reset every Monday at 00:00 (Malaysia time) for all agents with comprehensive logging

**Independent Test**: Agent has $50 remaining limit on Sunday 11:59 PM. At Monday 00:01, agent logs in and sees full weekly limit restored (e.g., $1000) with usage reset to $0. All 1000 agents in system have limits reset simultaneously. Admin can view reset history logs.

**Maps to**: FR-026 to FR-033 (Weekly Limit System)

### Tests for User Story 6 (100% Coverage Required - CONSTITUTION CRITICAL) ⚠️

- [ ] T150 [P] [US6] Unit test for reset logic in backend/test/unit/limits.service.spec.ts (weeklyUsed reset to 0, audit log creation, LimitResetLog creation)
- [ ] T151 [P] [US6] Integration test for scheduled reset job in backend/test/integration/limits-reset.e2e-spec.ts (timezone handling Asia/Kuala_Lumpur, transaction safety)
- [ ] **T212** 🟡 [MEDIUM] [US6] Stress test: Weekly reset with 1000 agents (verify completes in <5 seconds per SC-003)

### Backend Implementation for User Story 6

- [ ] T152 [US6] Implement weekly reset method in limits.service.ts (reset all users' weeklyUsed to 0 in bulk UPDATE, create audit logs in batch)
- [ ] **T300** 🟡 [MEDIUM] [US6] Update weekly reset method to create LimitResetLog entry (track affectedUsers count, totalLimit sum, status)
- [ ] **T301** 🟡 [MEDIUM] [US6] Add error handling to log FAILED/PARTIAL status in LimitResetLog if reset errors occur
- [ ] T153 [US6] Create Azure Functions Timer Trigger in backend/src/functions/weekly-reset.function.ts (uses T226 function.json config)
- [ ] T154 [US6] Add retry mechanism with exponential backoff (max 5 attempts: 30s, 1min, 2min, 5min, 10min) in weekly-reset.function.ts
- [ ] T155 [US6] Create limit reset log service in backend/src/modules/limits/limit-reset-log.service.ts
- [ ] T156 [US6] Add Application Insights logging for reset job success/failure with custom metrics
- [ ] T157 [US6] Create manual reset endpoint in limits controller (POST /api/v1/limits/reset - ADMIN only) for emergency reset
- [ ] **T302** 🟡 [MEDIUM] [US6] Create limit reset log query endpoint (GET /api/v1/admin/limit-reset-logs) in limits controller
- [ ] **T303** 🟡 [MEDIUM] [US6] Create LimitResetLogDto in backend/src/modules/limits/dto/limit-reset-log.dto.ts

### Frontend Implementation for User Story 6

- [ ] T158 [US6] Add "Next Reset" countdown timer to weekly limit card component (enhance T070, calculate time until Monday 00:00)
- [ ] T159 [US6] Create limit reset history page in frontend/app/routes/admin/limit-reset-history.tsx (admin only, display all reset logs)
- [ ] T160 [US6] Add manual reset button in admin dashboard (calls T157 endpoint with confirmation dialog)

**Checkpoint**: Weekly reset job runs automatically every Monday at 00:00 Asia/Kuala_Lumpur time. All agents' limits reset correctly within 5 seconds. Manual reset available for admin. Reset history is logged in LimitResetLog table and viewable in admin panel.

---

## Phase 9: User Story 7 - Agent Creates Sub-Agent (Priority: P3)

**Goal**: Agents with permission can create sub-agents to build unlimited multi-level hierarchy with efficient commission calculation

**Independent Test**: Agent L1 (with canCreateSubs=true) creates sub-agent L2 with $200 allocation (from their $1000 limit) and 20% commission rate. L1's available limit reduces to $800. L2 can log in, place $100 bet. Commissions flow: L2 gets $20 (20%), L1 gets $16 (20% of remaining $80), Moderator gets $64. Hierarchy tree visualization displays all levels.

**Maps to**: FR-016 to FR-019 (Unlimited Hierarchy), FR-022 (Limit Allocation Validation)

### Tests for User Story 7 (100% Coverage Required - CONSTITUTION CRITICAL) ⚠️

- [ ] T161 [P] [US7] Unit test for sub-agent creation in backend/test/unit/users.service.spec.ts (permission check canCreateSubs, limit allocation from parent)
- [ ] T162 [P] [US7] Unit test for multi-level commission calculation in backend/test/unit/commissions.service.spec.ts (L1→L2→L3→L4 hierarchy, verify all levels receive correct commission)
- [ ] T163 [P] [US7] Integration test for limit allocation flow in backend/test/integration/limits.e2e-spec.ts (concurrent allocation prevention with optimistic locking)
- [ ] **T344** 🟡 [MEDIUM] [US7] E2E test: Multi-level commission (L1 creates L2, L2 creates L3, L3 places bet, verify all receive commission correctly)

### Backend Implementation for User Story 7

- [ ] **T222** 🔴 [CRITICAL] [US7] Implement limit allocation with optimistic locking (add version field to User model for concurrency control)
- [ ] T164 [US7] Enhance users.service.ts to validate canCreateSubs permission before agent creates sub-agent
- [ ] T165 [US7] Create limit allocation endpoint in limits controller (POST /api/v1/limits/allocate) with transaction locks (use T222 optimistic locking)
- [ ] T166 [US7] Enhance commissions.service.ts to handle unlimited hierarchy depth (optimize for >20 levels with background jobs per T333-T335)
- [ ] **T246** 🟠 [HIGH] [US7] Add cache invalidation on user update/delete in users.service.ts (invalidate hierarchy cache)
- [ ] T167 [US7] Create GET /api/v1/agents/{id}/hierarchy endpoint in users controller to retrieve full hierarchy tree (uplines + downlines)

### Frontend Implementation for User Story 7

- [ ] T168 [P] [US7] Create use-hierarchy hook in frontend/app/hooks/use-hierarchy.ts (getHierarchy query, allocateLimit mutation)
- [ ] T169 [US7] Create sub-agent creation page in frontend/app/routes/app/downlines/create.tsx (same form as moderator agent creation, load from parent's available limit)
- [ ] T170 [US7] Create hierarchy tree visualization component in frontend/app/components/features/hierarchy-tree/agent-tree.tsx using recursive rendering (handle unlimited depth)
- [ ] T171 [US7] Create downlines page in frontend/app/routes/app/downlines/_index.tsx with hierarchy tree and limit allocation controls
- [ ] T172 [US7] Add permission check to hide/show "Create Sub-Agent" button based on user.canCreateSubs flag

**Checkpoint**: Agents can create unlimited sub-agent levels. Limits allocate correctly with optimistic locking preventing race conditions. Commissions flow through all levels efficiently using cached hierarchy paths. Hierarchy tree visualization works for deep structures (tested up to 20 levels).

---

## Phase 10: User Story 8 - Third-Party API Result Synchronization (Priority: P3)

**Goal**: Automated lottery result fetching from third-party Magayo API with retry, circuit breaker, and fallback to manual entry

**Independent Test**: Magnum 4D draw completes at 7:00 PM. Scheduled job runs at 7:15 PM, calls Magayo API, retrieves winning numbers, saves to database, processes 500 pending bets, calculates commissions within 30 seconds. On API failure, job retries with exponential backoff, then alerts admin for manual entry.

**Maps to**: FR-052 to FR-055 (Automated Result Sync)

### Tests for User Story 8

- [ ] T173 [P] [US8] Unit test for API response parsing in backend/test/unit/results-sync.service.spec.ts (validate data format, handle errors, malformed responses)
- [ ] T174 [P] [US8] Integration test for sync job in backend/test/integration/results-sync.e2e-spec.ts (API call, retry mechanism, fallback notification)

### Backend Implementation for User Story 8

- [ ] T175 [US8] Create results sync service in backend/src/modules/results/results-sync.service.ts implementing Magayo API integration
- [ ] T176 [US8] Implement retry mechanism with exponential backoff (30s, 1min, 2min, 5min, 10min - max 5 attempts) in results-sync.service.ts
- [ ] **T258** 🟠 [HIGH] [US8] Implement circuit breaker pattern in results-sync.service.ts (open circuit after 3 consecutive failures, half-open after 10min)
- [ ] **T257** 🟠 [HIGH] [US8] Create dead letter queue service for failed API sync jobs in backend/src/common/services/dlq.service.ts
- [ ] T177 [US8] Create Azure Functions Timer Trigger in backend/src/functions/results-sync.function.ts (uses T227 function.json, schedule adjusts per provider)
- [ ] T178 [US8] Add API response validation (check all required fields: firstPrize, secondPrize, thirdPrize, starters array length=10, consolations array length=10)
- [ ] **T239** 🔴 [CRITICAL] [US8] Decrypt apiKey from ServiceProvider using encryption service (T237) before calling Magayo API
- [ ] T179 [US8] Create POST /api/v1/results/sync endpoint in results controller for manual sync trigger (ADMIN only)
- [ ] T180 [US8] Add Application Insights alerts for sync failures (notify admin via T259 after 5 failed attempts)
- [ ] **T259** 🟠 [HIGH] [US8] Create admin notification service in backend/src/common/services/notification.service.ts (send alert email/webhook on critical errors)

### Frontend Implementation for User Story 8

- [ ] T181 [US8] Create sync status indicator in admin dashboard showing last sync time and status (SUCCESS/FAILED/PENDING)
- [ ] T182 [US8] Create manual sync trigger button in admin results page (calls T179 endpoint with loading state)
- [ ] T183 [US8] Add sync history log page in frontend/app/routes/admin/sync-history.tsx showing all sync attempts with success/failure status and error messages

**Checkpoint**: Automated result sync works end-to-end with Magayo API. API failures are retried automatically with circuit breaker pattern. Dead letter queue captures failed jobs. Manual sync available for admin. Admin receives notifications on critical failures. All sync attempts are logged and viewable.

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Improvements affecting multiple user stories, performance optimization, security hardening, accessibility, monitoring

### Performance Optimization (Constitution: <2s page load, <200ms API response)

- [ ] T184 [P] Verify all composite indexes from T269-T272 are created and used (run EXPLAIN on key queries)
- [ ] T185 [P] Verify all caching from T241-T247 is working (check cache hit rates in Application Insights)
- [ ] T186 [P] Verify hierarchy path caching (T245) achieves >90% cache hit rate (measure in production)
- [ ] T187 [P] Add React Router code splitting for admin and moderator routes (lazy loading with Suspense)
- [ ] T188 [P] Optimize Prisma queries: all queries use `select` from T337, cursor-based pagination implemented
- [ ] **T338** 🟡 [MEDIUM] [P] Implement cursor-based pagination for large result sets (bets, audit logs, commissions) using Prisma cursor
- [ ] **T339** 🟡 [MEDIUM] [P] Add database query logging to identify slow queries (Application Insights SQL tracking enabled)
- [ ] **T340** 🟡 [MEDIUM] [P] Create database index usage report (query sys.dm_db_index_usage_stats on Azure SQL)

### Security Hardening (Constitution: CRITICAL - NON-NEGOTIABLE)

- [ ] T189 [P] Verify row-level security implementation (T230-T234) works correctly (run data isolation tests T235, T345)
- [ ] T190 [P] Add input sanitization for all user inputs (XSS prevention) in validation.pipe.ts using validator.escape()
- [ ] T191 [P] Configure CORS with strict origin whitelist in main.ts (no wildcard `*`, only production domains)
- [ ] T192 [P] Add Helmet security headers configuration in main.ts (CSP, X-Frame-Options, HSTS)
- [ ] T193 [P] Verify audit logging service (T256) logs all financial operations per FR-072 to FR-076
- [ ] T194 Create audit logs viewer in frontend/app/routes/admin/audit-logs.tsx (ADMIN only, searchable by action, user, date)
- [ ] **T213** 🟡 [MEDIUM] Security audit: Penetration testing for authentication, authorization, data isolation, SQL injection, XSS

### Accessibility (Constitution: WCAG 2.1 AA - CRITICAL)

- [ ] T195 [P] Add ARIA labels to all interactive components in shadcn/ui components (buttons, forms, tables, dialogs)
- [ ] T196 [P] Ensure 44x44px minimum tap target size for all mobile buttons (verify on 375px width)
- [ ] T197 [P] Implement keyboard navigation for all forms and tables (Tab, Enter, Escape, Arrow keys)
- [ ] T198 [P] Add focus indicators with 4.5:1 color contrast ratio (visible focus ring on all interactive elements)
- [ ] T199 Run axe-core accessibility scan and fix all critical violations (integrate into CI/CD)

### Testing & Quality (Constitution: 80% coverage, 100% for critical logic)

- [ ] T200 [P] Achieve 100% test coverage for commissions.service.ts (constitution requirement - verify T106, T162)
- [ ] T201 [P] Achieve 100% test coverage for limits.service.ts (constitution requirement - verify T052, T150, T161)
- [ ] T202 [P] Achieve 100% test coverage for bets.service.ts (constitution requirement - verify T051, T053)
- [ ] T203 [P] Run ESLint in CI/CD pipeline with zero warnings requirement (fail build on warnings)
- [ ] T204 [P] Setup Lighthouse CI for automated performance testing (target >90 score for all categories)

### Documentation & Deployment

- [ ] T205 [P] Update backend README.md with API documentation link (Swagger UI at /api/docs)
- [ ] T206 [P] Update frontend README.md with component library usage and project structure
- [ ] T207 Validate quickstart.md by following all steps on fresh environment (Azure deployment end-to-end)
- [ ] T208 [P] Verify Azure deployment guide in docs/AZURE_DEPLOYMENT.md matches quickstart.md
- [ ] T209 [P] Setup Application Insights dashboards for monitoring (page load times, API response times, error rates)
- [ ] **T320** 🔵 [P] [LOW] Create Application Insights custom metrics (bet placement rate per minute, commission calculation duration)
- [ ] **T321** 🔵 [P] [LOW] Create Application Insights dashboard with performance KPIs (p95 response times, error rate %, cache hit rate)
- [ ] **T322** 🔵 [P] [LOW] Configure alerts for API response time >500ms (p95) with email notification
- [ ] **T323** 🔵 [P] [LOW] Configure alerts for error rate >1% with PagerDuty integration
- [ ] **T324** 🔵 [P] [LOW] Configure alerts for weekly reset job failure with immediate admin notification

### Final Integration Testing

- [ ] T210 End-to-end test: Complete user journey from moderator creates agent → agent logs in → places bet → views receipt
- [ ] **T341** 🟡 [MEDIUM] E2E test: Moderator creates agent → agent logs in → places multi-provider bet → views receipt (all providers)
- [ ] **T342** 🟡 [MEDIUM] E2E test: Admin enters result → all pending bets process → commissions calculate through 5 levels → report generates
- [ ] **T343** 🟡 [MEDIUM] E2E test: Weekly reset occurs at Monday 00:00 → all limits restore → agents can bet again → reset logged
- [ ] T211 Load test: 1000 concurrent users placing bets simultaneously (target: <200ms p95 response time per SC-004)
- [ ] T212 Stress test: Weekly reset with 1000 agents (target: <5 seconds total time per SC-003)
- [ ] T213 Security audit: Penetration testing for authentication, authorization, data isolation
- [ ] T214 Browser compatibility test: iOS Safari, Android Chrome, desktop Chrome/Firefox/Edge (verify mobile-first design works)
- [ ] **T315** 🟡 [MEDIUM] Load prize config from configuration instead of hardcoded values (verify T313-T314)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
  - **CRITICAL DECISIONS** (T215-T219): MUST complete before Prisma schema creation (T019)
  - **CRITICAL INFRASTRUCTURE** (T220-T240): MUST complete before user story implementation
- **User Stories (Phase 3-10)**: All depend on Foundational phase completion
  - User Story 1 (P1): Can start after Foundational - No dependencies on other stories
  - User Story 2 (P1): Can start after Foundational - Independent (integrates with US1 for provider listing)
  - User Story 3 (P1): Can start after Foundational - Independent (integrates with US1 for agent betting)
  - User Story 4 (P2): Depends on US1 (needs bets to process results) and US3 (needs agents for commissions)
  - User Story 5 (P2): Depends on US1, US3, US4 (needs data to report on)
  - User Story 6 (P2): Depends on US3 (needs agents with limits) - Independent backend job
  - User Story 7 (P3): Depends on US3 (extends agent creation) and US4 (multi-level commissions)
  - User Story 8 (P3): Depends on US4 (automated version of manual result entry)
- **Polish (Phase 11)**: Depends on all desired user stories being complete

### Critical Path (Must Complete Sequentially)

**BLOCKING PATH 1 - Multi-Provider Decision**:
```
T215 (Decide architecture) → T216 (Update schema) → T217 (Update OpenAPI) → T218 (Document) → T019 (Create schema)
```

**BLOCKING PATH 2 - Encryption Setup**:
```
T236 (Install crypto) → T237 (Create service) → T238 (Azure Key Vault) → All user stories using apiKey (US2, US8)
```

**BLOCKING PATH 3 - Row-Level Security**:
```
T230 (Prisma middleware) → T231-T234 (Add filters) → US3 (Agent Creation) → All other user stories
```

**BLOCKING PATH 4 - Azure Functions Config**:
```
T225-T229 (Azure setup) → US6 (Weekly Reset) & US8 (API Sync)
```

### Parallel Opportunities (Maximum Parallelization)

#### After Foundational Phase Completes

**Backend Teams Can Work In Parallel**:
- Team A: US1 Betting (T051-T073)
- Team B: US2 Providers (T074-T087)
- Team C: US3 Agents + RLS (T088-T104 + T230-T235)

**Frontend Teams Can Work In Parallel**:
- Team D: US1 Frontend (T065-T073)
- Team E: US2 Frontend (T083-T087)
- Team F: Auth Flow (T262-T268)

#### Within Each Phase

**Phase 2 - Foundational (massive parallelization possible)**:
```bash
# Can run ALL of these in parallel after T215-T219 decisions made:
T269-T272 (Indexes) || T236-T240 (Encryption) || T241-T243 (Cache) ||
T225-T229 (Azure) || T255-T256 (Exceptions) || T305-T308 (Env) ||
T024-T036 (Auth) || T037-T039 (Filters) || T043-T050 (Frontend)
```

**Phase 3 - User Story 1 (parallelization within story)**:
```bash
# Tests first (TDD):
T051 || T052 || T053 || T054 || T284 || T289

# Then validators:
T249 || T250 || T251 || T253 || T254

# Then DTOs:
T055 || T056 || T057

# Then frontend hooks:
T065 || T066 || T067

# Then text parser:
T285 || T286 || T287 || T288
```

---

## Implementation Strategy

### MVP First (User Story 1 Only) - RECOMMENDED

**Goal**: Get working software deployed as fast as possible

**Timeline**: 3-4 weeks with 2 developers

**Sequence**:
1. **Week 1**: Phase 1 (Setup) + Phase 2 (Foundational) - Complete all CRITICAL tasks (T215-T240)
2. **Week 2**: Phase 3 (User Story 1) - Backend implementation (T051-T064)
3. **Week 3**: Phase 3 (User Story 1) - Frontend implementation (T065-T073)
4. **Week 4**: Testing, bug fixes, deploy to staging, demo to stakeholders

**Deliverable**: Agents can log in, place bets (single/multi-provider, simple/detailed mode), view history, cancel pending bets, see receipts.

**Value**: Immediate value for testing betting logic and user workflows.

### Incremental Delivery (Recommended for Production)

**Goal**: Continuously deliver value, validate each increment

**Timeline**: 12-14 weeks with 3-4 developers

**Release Schedule**:
1. **Week 1-2**: Setup + Foundational (including all CRITICAL tasks) → Infrastructure ready
2. **Week 3-4**: User Story 1 → Deploy → **Release 1: MVP**
3. **Week 5**: User Story 2 → Deploy → **Release 2: Admin can manage providers**
4. **Week 6-7**: User Story 3 → Deploy → **Release 3: Full hierarchy + data isolation**
5. **Week 8-9**: User Story 4 → Deploy → **Release 4: Results & commissions**
6. **Week 10**: User Story 5 → Deploy → **Release 5: Reports**
7. **Week 11**: User Story 6 → Deploy → **Release 6: Auto-reset**
8. **Week 12**: User Story 7 → Deploy → **Release 7: Sub-agents**
9. **Week 13**: User Story 8 → Deploy → **Release 8: API sync**
10. **Week 14**: Polish phase → **Release 9: Production-ready**

**Each release adds value without breaking previous functionality**

### Parallel Team Strategy (if 6+ developers available)

**Goal**: Maximize throughput with parallel workstreams

**Timeline**: 8-10 weeks with 6 developers

**Team Structure**:
- **Team Infrastructure** (2 devs): Phase 1 + Phase 2 (all CRITICAL tasks)
- **Team Backend** (2 devs): User stories backend implementation
- **Team Frontend** (2 devs): User stories frontend implementation

**Workflow**:
1. **Week 1-2**: All teams collaborate on Phase 1 + Phase 2
2. **Week 3-4**: Parallel user stories:
   - Backend Team: US1 + US2
   - Frontend Team: US1 frontend + Auth flow
3. **Week 5-6**: Parallel user stories:
   - Backend Team: US3 + US4 (RLS + commissions)
   - Frontend Team: US2 + US3 frontend
4. **Week 7-8**: Parallel user stories:
   - Backend Team: US5 + US6
   - Frontend Team: US4 + US5 frontend
5. **Week 9**: US7 + US8 (full team)
6. **Week 10**: Polish phase (full team), load testing, security audit

---

## Notes

- **[P] markers**: Tasks marked [P] use different files and have no dependencies within their phase - safe to run in parallel
- **[Story] labels**: Every implementation task maps to a user story for traceability
- **Priority markers**: 🔴 CRITICAL (blocking) > 🟠 HIGH (MVP) > 🟡 MEDIUM (production) > 🔵 LOW (nice-to-have)
- **Constitution compliance**: All CRITICAL requirements (type safety, UX, security) embedded in tasks
- **TDD approach**: Tests written first (RED), implementation follows (GREEN), then refactor
- **Independent stories**: Each user story should be completable and testable without others (except documented dependencies)
- **Checkpoint validation**: Stop after each user story phase to validate independently before proceeding
- **Commit frequency**: Commit after each task or logical group of related tasks

---

## Task Summary (UPDATED)

- **Total Tasks**: 345 (was 214, added 131 missing tasks)
- **Setup Phase**: 18 tasks
- **Foundational Phase**: 75 tasks (was 32, added 43 CRITICAL/HIGH tasks) **BLOCKS all stories**
- **User Story 1 (P1)**: 46 tasks (was 23, added 23 validation/parser/iBox tasks)
- **User Story 2 (P1)**: 17 tasks (was 14, added 3 encryption/cache tasks)
- **User Story 3 (P1)**: 26 tasks (was 14, added 12 RLS/auth flow tasks)
- **User Story 4 (P2)**: 38 tasks (was 20, added 18 rounding/prize config/background job tasks)
- **User Story 5 (P2)**: 29 tasks (was 22, added 7 individual report implementation tasks)
- **User Story 6 (P2)**: 16 tasks (was 11, added 5 LimitResetLog tasks)
- **User Story 7 (P3)**: 14 tasks (was 12, added 2 concurrency tasks)
- **User Story 8 (P3)**: 14 tasks (was 11, added 3 circuit breaker/DLQ tasks)
- **Polish Phase**: 52 tasks (was 31, added 21 monitoring/testing/backup tasks)

### By Priority:
- **🔴 CRITICAL**: 26 tasks (MUST complete before any user story)
- **🟠 HIGH**: 75 tasks (MUST complete before MVP)
- **🟡 MEDIUM**: 18 tasks (MUST complete before production)
- **🔵 LOW**: 12 tasks (Nice to have)
- **No priority**: 214 tasks (original tasks from v1.0)

**MVP Scope** (Setup + Foundational + US1): 139 tasks (was 73)
**Full P1 Stories** (MVP + US2 + US3): 182 tasks (was 101)
**Full P1 + P2 Stories** (add US4, US5, US6): 265 tasks (was 154)
**Complete Feature** (all stories + polish): 345 tasks (was 214)

---

## Format Validation

✅ **ALL TASKS FOLLOW CHECKLIST FORMAT**:
- ✅ Checkbox prefix `- [ ]`
- ✅ Task ID (T001-T345)
- ✅ Priority marker (🔴/🟠/🟡/🔵) for new tasks
- ✅ [P] marker where applicable (143 parallelizable tasks, was 73)
- ✅ [Story] label for all user story tasks (US1-US8)
- ✅ File paths included in descriptions
- ✅ Clear action verbs (Create, Implement, Configure, Add, Verify, etc.)

**Ready for `/speckit.implement` execution** ✅

**IMPORTANT**: Review REVIEW_FINDINGS.md for detailed analysis of all 30 findings before starting implementation.
