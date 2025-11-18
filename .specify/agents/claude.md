# Agent Context: Multi-Level Agent Lottery Sandbox System

**Feature**: 001-lottery-sandbox
**Last Updated**: 2025-01-18
**Agent**: Claude (Sonnet 4.5)

---

## Technology Stack

### Frontend

#### Core Framework
- **Vite** 6.0+: Build tool and dev server
- **React** 19.0+: UI framework
- **TypeScript** 5.0+: Type-safe JavaScript
- **React Router** 7.0+: Client-side routing (framework mode, CSR)

#### State Management
- **TanStack Query** v5: Server state management, data fetching, caching
- **Zustand** v5: Client state management (UI state, user preferences)

#### Forms & Validation
- **React Hook Form** v7: Form state management
- **Zod** v3: Schema validation
- **@hookform/resolvers**: Zod resolver for React Hook Form

#### UI Components & Styling
- **shadcn/ui**: Accessible component library (Radix UI primitives)
- **Tailwind CSS** v4: Utility-first CSS framework
- **Radix UI**: Headless accessible components
- **Lucide React**: Icon library
- **clsx** + **tailwind-merge**: Conditional class names

#### Data Display
- **TanStack Table** v8: Headless table library for complex data tables
- **Recharts** v2: Chart library for reports and analytics

#### Date & Time
- **date-fns** v3: Date manipulation and formatting

#### Testing
- **Vitest**: Unit testing framework
- **@testing-library/react**: React component testing
- **@testing-library/user-event**: User interaction simulation
- **MSW (Mock Service Worker)**: API mocking for tests

#### Build & Dev Tools
- **ESLint** v9: Linting (TypeScript ESLint plugin)
- **Prettier**: Code formatting
- **Husky** v9: Git hooks
- **lint-staged**: Run linters on staged files
- **TypeScript**: Type checking

---

### Backend

#### Core Framework
- **NestJS** v10: Progressive Node.js framework
- **Node.js** v20 LTS: JavaScript runtime
- **TypeScript** 5.0+: Type-safe server code

#### Database
- **Prisma** v5: ORM (Object-Relational Mapping)
- **Azure SQL Database**: SQL Server provider
- **@prisma/client**: Auto-generated type-safe database client

#### Authentication & Security
- **Passport.js**: Authentication middleware
- **passport-jwt**: JWT strategy for Passport
- **bcrypt**: Password hashing (cost factor: 12)
- **jsonwebtoken**: JWT token generation and validation
- **class-validator**: DTO validation
- **class-transformer**: DTO transformation

#### API & HTTP
- **@nestjs/swagger**: OpenAPI documentation generation
- **@nestjs/throttler**: Rate limiting
- **helmet**: Security headers
- **cors**: Cross-Origin Resource Sharing

#### Caching
- **@nestjs/cache-manager**: In-memory caching (initial implementation)
- **cache-manager**: Cache abstraction layer
- **Azure Cache for Redis** (optional, Phase 2+): Distributed caching when scaling

#### Scheduled Jobs
- **node-schedule**: In-memory job scheduling
- **Azure Functions Timer Triggers**: Serverless scheduled jobs (weekly reset, result sync)

#### Testing
- **Jest**: Unit testing framework
- **@nestjs/testing**: NestJS testing utilities
- **supertest**: HTTP assertions for e2e tests

#### Build & Dev Tools
- **@nestjs/cli**: NestJS CLI
- **ts-node**: TypeScript execution
- **nodemon**: Dev server with hot reload
- **ESLint** + **Prettier**: Code quality

---

### Infrastructure (Azure)

#### Hosting
- **Azure Static Web Apps**: Frontend hosting (Free/Standard tier)
  - Global CDN with automatic HTTPS
  - Custom domains support
  - Built-in authentication (optional)
  - Integrated staging environments

- **Azure Functions**: Serverless backend (Consumption plan)
  - Pay-per-execution pricing
  - Automatic scaling (0 to thousands of instances)
  - Cold start: 600ms-1.5s (optimizable)
  - Connection pooling: `connection_limit=1` per function instance

#### Database
- **Azure SQL Database**: SQL Server managed service
  - Service tier: Basic (2 GB) - ~$5/month
  - Built-in backups (7-day retention)
  - Automatic patching and updates
  - Row-level security for moderator isolation
  - Recursive CTE support for unlimited hierarchy queries

#### Storage
- **Azure Storage Account**: Required for Azure Functions
  - Standard LRS tier
  - Used for function app configuration and state

#### Monitoring & Logging
- **Azure Application Insights**: Application performance monitoring
  - Real-time metrics and logs
  - Distributed tracing
  - Custom events and metrics
  - Alerts and notifications

#### CI/CD
- **GitHub Actions**: Automated deployment pipeline
  - Triggers on push to `main` branch
  - Parallel frontend and backend deployment
  - Prisma migrations before deployment
  - Environment-specific configurations

---

### Third-Party Services

#### Lottery Results API
- **Magayo Lottery API**: Third-party lottery results provider
  - Supports Malaysian and Singapore providers
  - RESTful JSON API
  - API key authentication
  - Manual fallback for API failures

---

## Architecture Patterns

### Frontend Architecture

#### Folder Structure
```
apps/frontend/
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── ui/           # shadcn/ui components
│   │   └── features/     # Feature-specific components
│   ├── features/          # Feature modules (bets, agents, reports)
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility functions, API client
│   ├── routes/            # React Router route definitions
│   ├── stores/            # Zustand stores
│   ├── types/             # TypeScript type definitions
│   └── main.tsx           # Application entry point
```

#### Key Patterns
- **TanStack Query**: All server data fetching, caching, and synchronization
- **Zustand**: UI state (sidebar open/closed, modals, theme)
- **React Router Loaders**: Data fetching before route rendering
- **shadcn/ui**: Consistent, accessible component library
- **Barrel Exports**: Clean imports (`@/components/ui`)

### Backend Architecture

#### Folder Structure
```
apps/backend/
├── src/
│   ├── modules/           # Feature modules (auth, bets, agents, etc.)
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.module.ts
│   │   │   └── dto/
│   │   ├── bets/
│   │   ├── agents/
│   │   ├── providers/
│   │   ├── commissions/
│   │   └── reports/
│   ├── common/            # Shared utilities
│   │   ├── decorators/   # Custom decorators
│   │   ├── guards/       # Auth guards
│   │   ├── interceptors/ # HTTP interceptors
│   │   └── filters/      # Exception filters
│   ├── prisma/            # Prisma module
│   │   └── prisma.service.ts
│   └── main.ts            # Application entry point
├── prisma/
│   ├── schema.prisma      # Database schema
│   ├── migrations/        # Database migrations
│   └── seed.ts            # Seed data script
```

#### Key Patterns
- **Modular Architecture**: Each feature is a self-contained NestJS module
- **DTOs**: Request/response validation with class-validator
- **Guards**: JWT authentication, role-based authorization
- **Interceptors**: Response transformation, logging
- **Prisma**: Type-safe database access
- **Dependency Injection**: NestJS built-in DI container

### Database Patterns

#### Prisma Schema Highlights
- **Self-Referential Relations**: `User.upline` → `User` (unlimited hierarchy)
- **Moderator Organizations**: `User.moderator` → `User` (data isolation)
- **Recursive CTEs**: For hierarchy traversal (single database roundtrip)
- **Connection Pooling**: `connection_limit=1` per Azure Function instance
- **Row-Level Security**: Moderator data isolation
- **Audit Logs**: All financial transactions logged

#### Example Recursive CTE
```typescript
// Get upline chain for commission distribution
async function getUplineChain(agentId: number) {
  return await prisma.$queryRaw`
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
}
```

---

## Key Business Logic

### Weekly Limit System
- **Reset Schedule**: Every Monday at 00:00:00 (Asia/Kuala_Lumpur timezone)
- **Azure Functions Timer Trigger**: `0 0 0 * * MON` (cron expression)
- **Reset Logic**:
  1. Set all `User.weeklyUsed = 0`
  2. Create `LimitResetLog` entries for audit trail
  3. Run in background, no downtime

### Commission Calculation
- **Real-Time**: For hierarchies ≤5 levels (calculated on bet placement)
- **Background Job**: For hierarchies >5 levels (Azure Functions, 5-minute interval)
- **Algorithm**:
  1. Traverse upline chain using recursive CTE
  2. Calculate commission at each level: `betAmount * (uplineRate / 100)`
  3. Create `Commission` records for each upline
  4. Commission is **earned**, not deducted from bet amount

### Bet Placement Validation
1. **Weekly Limit Check**: `weeklyAvailable >= betAmount`
2. **Duplicate Check**: Same `(agentId, drawId, gameType, selectedNumbers)` prevented
3. **Draw Status Check**: Draw must be in `PENDING` status (not yet drawn)
4. **Provider Validation**: `gameType` and `betType` must be in provider's `availableGames` and `betTypes`

### Results Synchronization
- **Third-Party API**: Magayo API (primary)
- **Scheduled Sync**: Azure Functions Timer Trigger (every 30 minutes after draw time)
- **Manual Fallback**: ADMIN can manually enter results via `/results` POST endpoint
- **Bet Status Update**: Automatically update all bets for the draw to `WON` or `LOST`

---

## Performance Targets (from Constitution)

### Page Load Time
- **Target**: <2 seconds (p95)
- **Strategy**:
  - Code splitting with React Router
  - Lazy loading for reports and admin pages
  - TanStack Query caching (5-minute stale time)
  - Azure Static Web Apps global CDN

### Time to Interactive (TTI)
- **Target**: <3 seconds
- **Strategy**:
  - Server-side rendering (future enhancement)
  - Critical CSS inlining
  - Preload fonts and icons
  - Minimize JavaScript bundle size

### API Response Time
- **Target**: <200ms (p95)
- **Strategy**:
  - Database query optimization (indexes, recursive CTEs)
  - In-memory caching (hierarchy paths, service providers)
  - Connection pooling (`connection_limit=1` per function)
  - Denormalized data where appropriate

### Cold Start Optimization (Azure Functions)
- **Current**: 600ms-1.5s
- **Optimizations**:
  - Minimize dependencies (tree shaking, dead code elimination)
  - Use `node-schedule` for in-memory jobs (avoid cold starts)
  - Consider migration to App Service if cold starts become critical

---

## Security Measures

### Authentication
- **JWT Tokens**:
  - Access Token: 15 minutes expiry
  - Refresh Token: 7 days expiry
- **Password Hashing**: bcrypt with cost factor 12
- **Token Storage**: Refresh tokens stored in database with revocation support

### Authorization
- **Role-Based Access Control (RBAC)**:
  - `ADMIN`: Full access to all resources
  - `MODERATOR`: Access to agents within their organization
  - `AGENT`: Access to their own data and direct downlines
- **Row-Level Security**: Prisma middleware filters data by moderator

### Data Validation
- **Frontend**: Zod schema validation in forms
- **Backend**: class-validator DTOs (all endpoints)
- **Database**: Prisma schema constraints (unique, nullable, cascades)

### Audit Trail
- **AuditLog Table**: All financial transactions logged
  - Bet placement, cancellation
  - Commission distribution
  - Limit allocation
  - Draw result entry

---

## Testing Strategy (from Constitution)

### Backend Testing
- **Unit Tests**: 80% minimum coverage
  - Commission calculations: **100% coverage required**
  - Quota management: **100% coverage required**
  - Bet validation: **100% coverage required**
- **E2E Tests**: Critical user flows (bet placement, login, limit allocation)
- **Integration Tests**: Database queries, third-party API integration

### Frontend Testing
- **Component Tests**: `@testing-library/react` (critical components)
- **Integration Tests**: User flows with MSW (Mock Service Worker)
- **Visual Regression**: (optional, Phase 2+)

### TDD Workflow (from CLAUDE.md)
1. **RED**: Write failing test first
2. **GREEN**: Write minimum code to pass
3. **REFACTOR**: Improve code while keeping tests passing

---

## Migration Path

### Phase 1: MVP (Current Architecture)
- Azure Static Web Apps + Functions
- Azure SQL Basic tier
- In-memory caching
- **Cost**: ~$31/month

### Phase 2: Scaling (>1,000 users)
- Add Azure Cache for Redis (~$25/month)
- Upgrade SQL Database to Standard tier (~$15/month)
- Enable Application Insights alerts
- **Cost**: ~$71/month

### Phase 3: Optimization (Optional)
- Migrate to Azure App Service (~$44/month base, no Redis)
- Add Azure CDN for global performance (~$30/month)
- Implement WebSocket for real-time updates
- **Cost**: ~$74/month (with CDN)

---

## Development Workflow

### Local Development
1. Start SQL Server (LocalDB or Docker)
2. Run Prisma migrations: `pnpm prisma migrate dev`
3. Seed database: `pnpm prisma db seed`
4. Start backend: `cd apps/backend && pnpm dev` (http://localhost:3000)
5. Start frontend: `cd apps/frontend && pnpm dev` (http://localhost:5173)

### Deployment
1. Push to `main` branch
2. GitHub Actions triggers:
   - Run tests (unit + e2e)
   - Build frontend and backend
   - Run Prisma migrations (production)
   - Deploy to Azure Static Web Apps
   - Deploy to Azure Functions
3. Verify health checks:
   - Frontend: https://swa-lottery-prod.azurestaticapps.net
   - Backend: https://func-lottery-backend-prod.azurewebsites.net/api/v1/health

---

## Important Notes

### From CLAUDE.md
- **TDD Required**: Always write failing test first, then implement
- **No Hardcoded Strings**: All UI text must come from localization resources (if localization enabled)
- **No Emojis**: Use proper icon library (Lucide React) instead of emojis
- **SpecKit Workflow**: Follow /speckit.specify → /speckit.plan → /speckit.tasks → /speckit.implement

### From Constitution
- **TypeScript Strict Mode**: MUST be enabled (no `any` types)
- **Mobile-First**: Design for 375px width minimum (100% mobile users)
- **Accessibility**: WCAG 2.1 AA compliance required
- **Test Coverage**: 80% minimum, 100% for critical business logic

---

## API Documentation

- **OpenAPI Specification**: [specs/001-lottery-sandbox/contracts/openapi.yaml](../contracts/openapi.yaml)
- **Base URL (Production)**: `https://func-lottery-backend-prod.azurewebsites.net/api/v1`
- **Base URL (Local)**: `http://localhost:3000/api/v1`

### Key Endpoints
- `POST /auth/login` - User authentication
- `POST /bets` - Place new bet
- `GET /limits/balance` - Check weekly limit balance
- `POST /limits/allocate` - Allocate limit to downline
- `GET /agents/{id}/hierarchy` - Get agent hierarchy
- `GET /reports/a1` - Daily betting summary by provider
- `GET /results/sync` - Sync results from third-party API

---

## Useful Commands

### Prisma
```bash
# Generate Prisma Client
pnpm prisma generate

# Create new migration
pnpm prisma migrate dev --name add_new_field

# Deploy migrations to production
pnpm prisma migrate deploy

# Open Prisma Studio (database GUI)
pnpm prisma studio

# Reset database (WARNING: deletes all data)
pnpm prisma migrate reset
```

### Testing
```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:cov

# Run e2e tests
pnpm test:e2e

# Run tests in watch mode
pnpm test:watch
```

### Deployment
```bash
# Deploy backend to Azure Functions
cd apps/backend
func azure functionapp publish func-lottery-backend-prod --node

# Deploy frontend to Azure Static Web Apps (via GitHub Actions)
git push origin main
```

---

## References

- **SpecKit Workflow**: https://github.com/github/spec-kit
- **NestJS Documentation**: https://docs.nestjs.com/
- **Prisma Documentation**: https://www.prisma.io/docs
- **Azure Static Web Apps**: https://learn.microsoft.com/en-us/azure/static-web-apps/
- **Azure Functions**: https://learn.microsoft.com/en-us/azure/azure-functions/
- **React Router v7**: https://reactrouter.com/
- **TanStack Query**: https://tanstack.com/query/latest
