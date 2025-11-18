# Implementation Plan: Multi-Level Agent Lottery Sandbox System

**Branch**: `001-lottery-sandbox` | **Date**: 2025-11-18 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/001-lottery-sandbox/spec.md`

## Summary

Build a comprehensive web-based lottery practice management system for Malaysian and Singapore lottery games (3D, 4D, 5D, 6D) with unlimited agent hierarchy, configurable commission rates, weekly betting limits, and automated result synchronization. System supports three user roles (Administrator, Moderator, Agent) with complete data isolation between moderator organizations. Mobile-first design targeting 100% mobile users.

**Technical Approach**: Serverless Azure architecture with React Router 7 SSR frontend, NestJS backend running on Azure Functions, Azure SQL Database with Prisma ORM, in-memory caching (Redis optional for scaling), and Azure Blob Storage for file management.

## Technical Context

**Language/Version**: TypeScript 5.x (frontend + backend)
**Primary Dependencies**:
- Frontend: React 19, React Router 7, TanStack Query v5, Zustand v5, shadcn/ui, Tailwind CSS v4
- Backend: NestJS v10, Prisma v5, Passport.js, class-validator, Azure Functions SDK
**Storage**: Azure SQL Database (SQL Server) with Prisma ORM
**Testing**: Jest + Supertest (backend), Vitest + React Testing Library (frontend)
**Target Platform**: Web browsers (mobile-first: iOS Safari, Android Chrome), Node.js v20 LTS runtime
**Project Type**: Web application (frontend + backend separation)
**Performance Goals**:
- Page load < 2s (p95)
- API response < 200ms (p95)
- 1000+ concurrent users supported
- Commission calculation < 5s for 20-level hierarchy
**Constraints**:
- 100% mobile users (touch-optimized UI mandatory)
- WCAG 2.1 AA accessibility compliance
- Row-level security for moderator data isolation
- Zero commission calculation errors (100% accuracy required)
**Scale/Scope**:
- 1000+ agents initially
- Unlimited hierarchy depth (optimized up to 20 levels)
- 500+ daily bets
- 6 comprehensive reports

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Type Safety & Code Quality (CRITICAL - NON-NEGOTIABLE)

✅ **PASS**: TypeScript strict mode enabled on all codebases
✅ **PASS**: Prisma provides type-safe database client (no `any` types)
✅ **PASS**: Zod validation at boundaries (frontend forms, API responses)
✅ **PASS**: class-validator for NestJS DTOs
✅ **PASS**: ESLint configured with zero warnings requirement
✅ **PASS**: Mandatory code reviews (PR process)
✅ **PASS**: TDD required for critical logic:
  - Commission calculations: 100% test coverage planned
  - Quota management: 100% test coverage planned
  - Bet validation: 100% test coverage planned

**Rationale Alignment**: Financial system requires absolute correctness. Multi-level commission errors compound through hierarchy. Type safety catches bugs at compile-time.

### II. User Experience & Accessibility (CRITICAL - NON-NEGOTIABLE)

✅ **PASS**: Mobile-first design (375px minimum width)
✅ **PASS**: Touch optimization (44x44px tap targets, bottom sheets, swipe gestures)
✅ **PASS**: Performance targets align with goals:
  - Page Load < 2s: React Router 7 SSR + code splitting
  - TTI < 3s: Lazy loading + Suspense
  - API < 200ms: Optimized queries + caching
✅ **PASS**: WCAG 2.1 AA compliance (shadcn/ui accessible components, ARIA labels)
✅ **PASS**: Semantic HTML + keyboard navigation
✅ **PASS**: Color contrast ≥ 4.5:1 (Tailwind design tokens)
✅ **PASS**: Loading states + success feedback for all actions

**Rationale Alignment**: 100% mobile users specified. Slow/confusing interface leads to bet placement errors.

### III. Security & Data Integrity (CRITICAL - NON-NEGOTIABLE)

✅ **PASS**: JWT authentication (15min access, 7day refresh)
✅ **PASS**: Password hashing (bcrypt cost factor 12)
✅ **PASS**: Rate limiting (NestJS throttler: 5 attempts/15min)
✅ **PASS**: RBAC with NestJS guards on every endpoint
✅ **PASS**: Row-level security in Azure SQL (moderator isolation)
✅ **PASS**: HTTPS only (Azure enforced)
✅ **PASS**: Parameterized queries (Prisma prevents SQL injection)
✅ **PASS**: Input sanitization (class-validator)
✅ **PASS**: Audit logging for all financial operations
✅ **PASS**: Environment variables for secrets (Azure Key Vault)

**Rationale Alignment**: Lottery system handles sensitive financial data. Security breaches destroy trust. Audit trails essential for reconciliation.

### Constitution Check Result: ✅ **ALL GATES PASSED**

No principle violations. All requirements align with constitution mandates.

## Project Structure

### Documentation (this feature)

```text
specs/001-lottery-sandbox/
├── plan.md              # This file (/speckit.plan output)
├── spec.md              # Feature specification (/speckit.specify output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (API contracts)
│   ├── openapi.yaml
│   └── schemas/
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (/speckit.tasks - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
# Web application structure (frontend + backend)

backend/
├── src/
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.module.ts
│   │   │   ├── guards/
│   │   │   │   ├── jwt-auth.guard.ts
│   │   │   │   └── roles.guard.ts
│   │   │   ├── strategies/
│   │   │   │   └── jwt.strategy.ts
│   │   │   └── dto/
│   │   │       ├── login.dto.ts
│   │   │       └── refresh-token.dto.ts
│   │   ├── users/
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   ├── users.module.ts
│   │   │   └── dto/
│   │   │       ├── create-user.dto.ts
│   │   │       └── update-user.dto.ts
│   │   ├── providers/
│   │   │   ├── providers.controller.ts
│   │   │   ├── providers.service.ts
│   │   │   ├── providers.module.ts
│   │   │   └── dto/
│   │   │       └── create-provider.dto.ts
│   │   ├── bets/
│   │   │   ├── bets.controller.ts
│   │   │   ├── bets.service.ts
│   │   │   ├── bets.module.ts
│   │   │   └── dto/
│   │   │       ├── create-bet.dto.ts
│   │   │       └── cancel-bet.dto.ts
│   │   ├── limits/
│   │   │   ├── limits.service.ts
│   │   │   ├── limits.module.ts
│   │   │   └── dto/
│   │   ├── results/
│   │   │   ├── results.controller.ts
│   │   │   ├── results.service.ts
│   │   │   ├── results.processor.ts
│   │   │   └── results.module.ts
│   │   ├── commissions/
│   │   │   ├── commissions.service.ts
│   │   │   ├── commissions.module.ts
│   │   │   └── dto/
│   │   ├── reports/
│   │   │   ├── reports.controller.ts
│   │   │   ├── reports.service.ts
│   │   │   └── reports.module.ts
│   │   └── audit/
│   │       ├── audit.service.ts
│   │       └── audit.module.ts
│   ├── common/
│   │   ├── decorators/
│   │   │   ├── roles.decorator.ts
│   │   │   └── current-user.decorator.ts
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts
│   │   ├── interceptors/
│   │   │   └── logging.interceptor.ts
│   │   └── pipes/
│   │       └── validation.pipe.ts
│   ├── config/
│   │   └── configuration.ts
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.ts
│   ├── app.module.ts
│   └── main.ts
├── test/
│   ├── unit/
│   │   ├── auth.service.spec.ts
│   │   ├── bets.service.spec.ts
│   │   ├── commissions.service.spec.ts
│   │   └── limits.service.spec.ts
│   ├── integration/
│   │   ├── auth.e2e-spec.ts
│   │   ├── bets.e2e-spec.ts
│   │   └── results.e2e-spec.ts
│   └── fixtures/
├── prisma/
│   └── schema.prisma (symlink to src/prisma/schema.prisma)
├── package.json
├── tsconfig.json
├── nest-cli.json
└── .env.example

frontend/
├── app/
│   ├── routes/
│   │   ├── _index.tsx (landing page)
│   │   ├── login.tsx
│   │   ├── app/
│   │   │   ├── _layout.tsx (authenticated layout)
│   │   │   ├── dashboard.tsx
│   │   │   ├── betting/
│   │   │   │   ├── _index.tsx
│   │   │   │   └── simple.tsx
│   │   │   ├── history.tsx
│   │   │   ├── results.tsx
│   │   │   └── downlines/
│   │   │       ├── _index.tsx
│   │   │       └── create.tsx
│   │   ├── admin/
│   │   │   ├── _layout.tsx
│   │   │   ├── providers.tsx
│   │   │   ├── moderators.tsx
│   │   │   ├── agents.tsx
│   │   │   └── reports/
│   │   │       ├── a1.tsx
│   │   │       ├── a2.tsx
│   │   │       ├── a3.tsx
│   │   │       ├── b1.tsx
│   │   │       ├── b2.tsx
│   │   │       └── b3.tsx
│   │   └── moderator/
│   │       ├── _layout.tsx
│   │       ├── agents.tsx
│   │       └── reports/
│   ├── components/
│   │   ├── ui/ (shadcn/ui components)
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── form.tsx
│   │   │   ├── table.tsx
│   │   │   └── dialog.tsx
│   │   ├── features/
│   │   │   ├── bet-form/
│   │   │   │   ├── simple-mode.tsx
│   │   │   │   └── detailed-mode.tsx
│   │   │   ├── hierarchy-tree/
│   │   │   │   └── agent-tree.tsx
│   │   │   └── limit-card/
│   │   │       └── weekly-limit.tsx
│   │   └── layout/
│   │       ├── header.tsx
│   │       ├── sidebar.tsx
│   │       └── bottom-nav.tsx (mobile)
│   ├── lib/
│   │   ├── api.ts (axios instance)
│   │   ├── utils.ts
│   │   └── cn.ts (class merger)
│   ├── hooks/
│   │   ├── use-auth.ts
│   │   ├── use-bets.ts
│   │   ├── use-limits.ts
│   │   └── use-providers.ts
│   ├── stores/
│   │   ├── auth.store.ts (Zustand)
│   │   └── ui.store.ts
│   ├── types/
│   │   ├── user.ts
│   │   ├── bet.ts
│   │   ├── provider.ts
│   │   └── api.ts
│   ├── root.tsx
│   └── entry.client.tsx
├── public/
│   └── favicon.ico
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts
└── .env.example
```

**Structure Decision**: Web application with clear separation between frontend (React Router 7 SPA with SSR) and backend (NestJS modular architecture). Backend follows feature-based modules pattern as per NestJS best practices. Frontend uses React Router 7 file-based routing with nested layouts for role-specific UIs.

## Complexity Tracking

*No constitution violations - this section intentionally left empty.*

## Phase 0: Research & Technology Validation

### Research Tasks

#### R1: Azure SQL with Prisma Best Practices

**Objective**: Validate Prisma ORM compatibility with Azure SQL Database and identify optimization patterns for hierarchical queries.

**Key Questions**:
- How to implement recursive CTEs for unlimited agent hierarchy in Prisma?
- Best practices for Azure SQL connection pooling in serverless (Azure Functions)?
- Row-level security implementation in Azure SQL with Prisma?
- Performance optimization for recursive queries (20+ levels)?

**Research Deliverables**:
- Prisma schema example with self-referential relations
- Recursive CTE query examples (raw SQL with Prisma)
- Connection pooling configuration for Azure Functions
- Row-level security pattern documentation

#### R2: React Router 7 Framework Mode with Azure Static Web Apps

**Objective**: Validate SSR deployment on Azure Static Web Apps and optimize for mobile performance.

**Key Questions**:
- Azure Static Web Apps support for React Router 7 SSR?
- Build configuration for optimal bundle size?
- Code splitting strategy for mobile networks?
- Service worker configuration for offline fallback?

**Research Deliverables**:
- Azure Static Web Apps deployment configuration
- Vite build optimization settings
- Code splitting strategy document
- Performance budget definition

#### R3: NestJS on Azure Functions Best Practices

**Objective**: Validate NestJS serverless deployment on Azure Functions and establish patterns for module organization.

**Key Questions**:
- Cold start optimization for Azure Functions?
- Dependency injection in serverless context?
- Background job scheduling (weekly reset, result sync)?
- Azure Functions Timer Triggers integration with NestJS?

**Research Deliverables**:
- NestJS Azure Functions adapter configuration
- Warm-up strategy documentation
- Timer trigger implementation examples
- Deployment pipeline configuration

#### R4: Commission Calculation Performance at Scale

**Objective**: Design efficient commission calculation algorithm for unlimited hierarchy depth.

**Key Questions**:
- Algorithm complexity for recursive commission calculation?
- Database vs application-layer calculation trade-offs?
- Caching strategy for hierarchy paths?
- Background job vs real-time calculation decision?

**Research Deliverables**:
- Commission calculation algorithm pseudo-code
- Performance benchmarks (10, 20, 50 levels)
- Caching strategy recommendation
- Background job trigger conditions

#### R5: Third-Party Lottery Result API Integration

**Objective**: Identify available lottery result APIs for Malaysia/Singapore and design integration architecture.

**Key Questions**:
- Available lottery result API providers?
- API reliability and uptime SLAs?
- Data format and schema validation?
- Rate limiting and retry strategies?

**Research Deliverables**:
- List of potential API providers with evaluation
- API integration architecture diagram
- Retry mechanism design (exponential backoff)
- Manual entry fallback workflow

### Research Consolidation

*Output File*: `research.md`

**Format**:
- Decision: [Technology/pattern chosen]
- Rationale: [Why chosen over alternatives]
- Alternatives Considered: [What else was evaluated]
- Implementation Notes: [Specific configurations/patterns]
- Risks & Mitigations: [Known issues and solutions]

## Phase 1: Design & Contracts

### Data Model Design

*Output File*: `data-model.md`

#### Core Entities

**User** (Administrator/Moderator/Agent)
- Fields: id (PK), username (unique), passwordHash, role, fullName, phone, email
- Hierarchy: uplineId (FK self), moderatorId (FK self)
- Limits: weeklyLimit, weeklyUsed, commissionRate, canCreateSubAgents
- Metadata: active, lastLoginAt, createdAt, updatedAt
- Relations: upline (User), downlines (User[]), moderator (User), managedAgents (User[]), bets (Bet[]), commissions (Commission[]), auditLogs (AuditLog[])
- Validation: username (4-20 chars, alphanumeric), weeklyLimit (> 0), commissionRate (0-100)
- State Transitions: active ↔ suspended

**ServiceProvider**
- Fields: id (PK, CUID), code (unique), name, country, active, availableGames (JSON), betTypes (JSON), drawSchedule (JSON), apiEndpoint, apiKey
- Relations: bets (Bet[]), results (DrawResult[])
- Validation: code (2-3 chars uppercase), availableGames (array of '3D'|'4D'|'5D'|'6D')

**Bet**
- Fields: id (PK), agentId (FK), providerId (FK), gameType, betType, numbers, amount, drawDate, status, resultId (FK), winAmount, receiptNumber (unique), createdAt, updatedAt
- Relations: agent (User), provider (ServiceProvider), result (DrawResult), commissions (Commission[])
- Validation: gameType matches provider.availableGames, numbers length matches gameType, amount >= provider.minBet
- State Transitions: PENDING → WON|LOST|CANCELLED

**DrawResult**
- Fields: id (PK), providerId (FK), gameType, drawDate, drawNumber (unique), firstPrize, secondPrize, thirdPrize, starters (JSON), consolations (JSON), syncMethod, syncedBy, syncedAt, status
- Relations: provider (ServiceProvider), bets (Bet[])
- Validation: drawNumber uniqueness per provider+gameType+date, starters/consolations array length = 10

**Commission**
- Fields: id (PK), agentId (FK), betId (FK), sourceAgentId, commissionRate, betAmount, profitLoss, commissionAmt, level, createdAt
- Relations: agent (User), bet (Bet)
- Validation: commissionRate matches agent's rate at bet placement time, level >= 0

**AuditLog**
- Fields: id (PK), userId (FK), action, metadata (JSON), ipAddress, userAgent, createdAt
- Relations: user (User)
- Validation: action from predefined enum, immutable (append-only)

### API Contracts

*Output Directory*: `contracts/`

#### OpenAPI Specification Structure

```yaml
# contracts/openapi.yaml
openapi: 3.0.0
info:
  title: Lottery Sandbox API
  version: 1.0.0

paths:
  # Authentication
  /api/v1/auth/login:
    post:
      summary: User login
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/LoginDto'
      responses:
        '200':
          description: Successful login
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/LoginResponse'

  /api/v1/auth/refresh:
    post:
      summary: Refresh access token
      # ...

  # Service Providers (Admin only)
  /api/v1/providers:
    get:
      summary: List all providers
      security:
        - bearerAuth: []
      # ...
    post:
      summary: Create new provider
      security:
        - bearerAuth: []
      # ...

  /api/v1/providers/{id}:
    get:
      summary: Get provider by ID
      # ...
    put:
      summary: Update provider
      # ...
    delete:
      summary: Delete provider
      # ...

  # Agents
  /api/v1/agents:
    get:
      summary: List agents (filtered by role)
      # ...
    post:
      summary: Create new agent
      # ...

  /api/v1/agents/{id}/hierarchy:
    get:
      summary: Get agent hierarchy tree
      # ...

  # Bets
  /api/v1/bets:
    get:
      summary: List bets with filtering
      # ...
    post:
      summary: Place new bet
      # ...

  /api/v1/bets/{id}:
    get:
      summary: Get bet details
      # ...
    delete:
      summary: Cancel bet (if pending)
      # ...

  # Weekly Limits
  /api/v1/limits/balance:
    get:
      summary: Get current limit balance
      # ...

  /api/v1/limits/allocate:
    patch:
      summary: Allocate limit to sub-agent
      # ...

  # Results
  /api/v1/results:
    get:
      summary: List draw results
      # ...
    post:
      summary: Manual result entry (admin)
      # ...

  /api/v1/results/sync:
    post:
      summary: Trigger API synchronization
      # ...

  # Commissions
  /api/v1/commissions:
    get:
      summary: List commissions for user
      # ...

  /api/v1/commissions/summary:
    get:
      summary: Commission summary by date range
      # ...

  # Reports
  /api/v1/reports/a1:
    post:
      summary: Generate Report A-1 (Rough Stats)
      # ...

  /api/v1/reports/a2:
    post:
      summary: Generate Report A-2 (Inquiry)
      # ...

  /api/v1/reports/a3:
    post:
      summary: Generate Report A-3 (Order Summary)
      # ...

  /api/v1/reports/b1:
    post:
      summary: Generate Report B-1 (Performance Calendar)
      # ...

  /api/v1/reports/b2:
    post:
      summary: Generate Report B-2 (Winning Orders)
      # ...

  /api/v1/reports/b3:
    post:
      summary: Generate Report B-3 (7-Day Summary)
      # ...

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:
    LoginDto:
      type: object
      required: [username, password]
      properties:
        username:
          type: string
          minLength: 4
          maxLength: 20
        password:
          type: string
          minLength: 8

    LoginResponse:
      type: object
      properties:
        accessToken:
          type: string
        refreshToken:
          type: string
        user:
          $ref: '#/components/schemas/UserDto'

    UserDto:
      type: object
      properties:
        id:
          type: integer
        username:
          type: string
        role:
          type: string
          enum: [ADMIN, MODERATOR, AGENT]
        fullName:
          type: string
        weeklyLimit:
          type: number
        weeklyUsed:
          type: number
        commissionRate:
          type: number

    # ... (other schemas)
```

### Quickstart Guide

*Output File*: `quickstart.md`

**Contents**:
1. **Prerequisites**: Node.js 20, Azure CLI, Azure subscription
2. **Local Setup**:
   - Clone repository
   - Install dependencies (frontend + backend)
   - Configure environment variables
   - Run Prisma migrations
   - Seed database
   - Start dev servers
3. **Azure Deployment**:
   - Create Azure resources (Static Web App, Function App, SQL Database)
   - Configure CI/CD (GitHub Actions)
   - Deploy frontend
   - Deploy backend
4. **Testing**:
   - Run unit tests
   - Run integration tests
   - Run E2E tests (optional)
5. **Common Tasks**:
   - Add new module (NestJS CLI)
   - Create new route (React Router)
   - Generate Prisma migration
   - View API documentation (Swagger)

### Agent Context Update

*Action*: Run `.specify/scripts/powershell/update-agent-context.ps1 -AgentType claude`

**Technologies to Add**:
- React Router 7 (framework mode with SSR)
- NestJS v10 (modular architecture)
- Prisma v5 (SQL Server provider)
- Azure SQL Database
- Azure Static Web Apps
- Azure Functions
- TanStack Query v5
- Zustand v5
- shadcn/ui
- Tailwind CSS v4

## Phase 2: Implementation Phases

*Note: Detailed task breakdown will be generated by `/speckit.tasks` command.*

### High-Level Implementation Sequence

**Phase 2.1: Foundation (Weeks 1-4)**
- Project setup (frontend + backend scaffolding)
- Database schema and migrations
- Authentication module (JWT)
- Basic authorization (RBAC guards)

**Phase 2.2: Core Features (Weeks 5-10)**
- Service provider management (admin)
- Agent hierarchy management
- Weekly limit system
- Betting system (place, cancel, view)

**Phase 2.3: Results & Commissions (Weeks 11-14)**
- Result management (manual + API sync)
- Winning calculation engine
- Commission calculation system
- Scheduled jobs (weekly reset, result sync)

**Phase 2.4: Reporting & Polish (Weeks 15-20)**
- 6 comprehensive reports
- Mobile UX optimization
- Performance tuning
- Security audit
- Testing & deployment

## Risks & Mitigations

| Risk | Severity | Probability | Mitigation |
|------|----------|-------------|------------|
| Unlimited hierarchy performance degrades | High | Medium | Implement caching, background jobs for >10 levels, database query optimization |
| Commission calculation errors | Critical | Low | TDD with 100% coverage, decimal precision handling, audit logging, reconciliation reports |
| Third-party API unreliable | Medium | High | Robust retry mechanism, manual entry fallback, multiple API providers |
| Azure Functions cold starts | Medium | Medium | Keep-alive pings, lazy module loading, optimize bundle size |
| Data isolation breach | Critical | Low | Row-level security, comprehensive integration tests, security audit |
| Weekly reset job failure | High | Low | Retry mechanism, alerting, manual reset procedure, monitoring |

## Dependencies

### External Services
- **Azure SQL Database**: Required for data persistence
- **Azure Static Web Apps**: Required for frontend hosting
- **Azure Functions**: Required for backend runtime
- **Third-party lottery API**: Optional (manual entry fallback available)

### Development Tools
- **Node.js v20**: Required for local development
- **Azure CLI**: Required for deployment
- **Git**: Required for version control
- **VS Code**: Recommended IDE

## Success Criteria Verification

### Performance Benchmarks
- [ ] Page load < 2s (measure with Lighthouse on 4G)
- [ ] API response < 200ms (measure with load testing tools)
- [ ] Commission calculation < 5s for 20 levels (unit test benchmark)
- [ ] Weekly reset < 5s for 1000 agents (integration test)

### Quality Gates
- [ ] TypeScript strict mode passes with zero errors
- [ ] ESLint passes with zero warnings
- [ ] Test coverage ≥ 80% for business logic
- [ ] Commission calculations 100% test coverage
- [ ] Lighthouse score > 90 (all categories)
- [ ] WCAG 2.1 AA compliance (axe-core scan)
- [ ] Zero SQL injection vulnerabilities (automated security scan)

### User Acceptance
- [ ] Agents can place bet in < 60s on mobile
- [ ] 95% of users place first bet without help
- [ ] All 6 reports generate within 2s
- [ ] Mobile satisfaction ≥ 4.5/5

---

**Next Steps**:
1. Review and approve this implementation plan
2. Execute Phase 0 research tasks
3. Generate `research.md` with findings
4. Execute Phase 1 design tasks
5. Generate `data-model.md`, `contracts/`, `quickstart.md`
6. Run `/speckit.tasks` to generate detailed task breakdown
7. Begin implementation with `/speckit.implement`

**Status**: Ready for Phase 0 Research
