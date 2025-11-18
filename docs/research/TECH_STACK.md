# Tech Stack Specification
## Multi-Level Agent Lottery Sandbox System

**Version:** 2.0
**Date:** 2025-11-18
**Status:** Approved
**Decision:** Vite + React Router 7 (Over TanStack Start)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Technology Stack Overview](#technology-stack-overview)
3. [Frontend Stack](#frontend-stack)
4. [Backend Stack](#backend-stack)
5. [Database & Caching](#database--caching)
6. [Deployment & Infrastructure](#deployment--infrastructure)
7. [Development Tools](#development-tools)
8. [Architecture Patterns](#architecture-patterns)
9. [Migration Path](#migration-path)
10. [Future Mobile Strategy](#future-mobile-strategy)

---

## Executive Summary

### Stack Decision: Vite + React Router 7

**Why Not TanStack Start:**
- ❌ Still in Release Candidate (RC) - not production stable v1.0
- ❌ No mobile app migration path
- ❌ Smaller community and fewer resources
- ❌ Higher learning curve for team

**Why Vite + React Router 7:**
- ✅ Production-ready and stable (v7.0 released)
- ✅ Clear path to React Native for mobile apps
- ✅ Massive community and ecosystem
- ✅ React Router 7 has framework features (SSR, loaders, actions)
- ✅ Built on Vite (same as TanStack Start)
- ✅ Can still use best TanStack libraries (Query, Table, Virtual, Form)
- ✅ Faster development with more tutorials and resources

### Key Principles

1. **Type Safety First**: TypeScript everywhere (frontend + backend)
2. **Mobile-Ready**: Architecture that supports future React Native apps
3. **Developer Experience**: Fast HMR, great tooling, easy debugging
4. **Production Quality**: Battle-tested libraries, stable versions
5. **Scalability**: Support multi-level hierarchy with unlimited agents

---

## Technology Stack Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND LAYER                           │
├─────────────────────────────────────────────────────────────────┤
│ Build Tool            │ Vite 6.x                                 │
│ Framework             │ React 19.x                               │
│ Language              │ TypeScript 5.x                           │
│ Routing               │ React Router 7 (Framework Mode)          │
│ Data Fetching         │ TanStack Query v5                        │
│ State Management      │ Zustand v5 + TanStack Query              │
│ Forms                 │ React Hook Form v7 + Zod v3              │
│ Tables                │ TanStack Table v8                        │
│ Virtual Scrolling     │ TanStack Virtual v3                      │
│ UI Components         │ shadcn/ui (Radix UI + Tailwind)          │
│ Styling               │ Tailwind CSS v4                          │
│ Animations            │ Framer Motion v11                        │
│ Date/Time             │ date-fns v4                              │
│ Charts                │ Recharts v2 or Chart.js                  │
│ Icons                 │ Lucide React                             │
│ Notifications         │ React Hot Toast or Sonner                │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND LAYER                            │
├─────────────────────────────────────────────────────────────────┤
│ Runtime               │ Node.js v20 LTS                          │
│ Framework             │ NestJS v10.x                             │
│ Language              │ TypeScript 5.x                           │
│ API Spec              │ OpenAPI 3.0 (Swagger)                    │
│ Validation            │ class-validator + class-transformer      │
│ Authentication        │ Passport.js (JWT Strategy)               │
│ Authorization         │ CASL (RBAC)                              │
│ Job Queue             │ In-memory (node-schedule)                │
│ Logging               │ Winston v3 + Morgan                      │
│ Error Tracking        │ Sentry                                   │
│ Testing               │ Jest + Supertest                         │
│ API Client            │ Axios (for lottery result APIs)          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      DATABASE & CACHING                          │
├─────────────────────────────────────────────────────────────────┤
│ Primary Database      │ Azure SQL Database (SQL Server)          │
│ ORM                   │ Prisma v5.x (best SQL Server support)    │
│ Migrations            │ Prisma Migrate                           │
│ Cache                 │ In-Memory (NestJS cache-manager)         │
│ Future Cache          │ Azure Cache for Redis (optional)         │
│ Session Store         │ In-Memory (with Redis option later)      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                   DEPLOYMENT & INFRASTRUCTURE (AZURE)            │
├─────────────────────────────────────────────────────────────────┤
│ Frontend Hosting      │ Azure Static Web Apps                    │
│ Backend Hosting       │ Azure Functions (Node.js)                │
│ Database              │ Azure SQL Database                       │
│ Cache (Optional)      │ Azure Cache for Redis (Phase 2+)         │
│ File Storage          │ Azure Blob Storage                       │
│ CDN                   │ Azure CDN (integrated)                   │
│ Scheduled Jobs        │ Azure Functions Timer Triggers           │
│ CI/CD                 │ GitHub Actions → Azure                   │
│ Monitoring            │ Azure Application Insights + Sentry      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      FUTURE MOBILE STACK                         │
├─────────────────────────────────────────────────────────────────┤
│ Framework             │ React Native v0.75+                      │
│ Navigation            │ React Navigation v6                      │
│ Data Fetching         │ TanStack Query v5 (shared!)              │
│ Forms                 │ React Hook Form v7 (shared!)             │
│ UI Library            │ React Native Paper or NativeBase         │
│ State                 │ Zustand v5 (shared!)                     │
│ Storage               │ @react-native-async-storage              │
│ Push Notifications    │ Firebase Cloud Messaging                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Frontend Stack

### 1. Core Framework: Vite + React + TypeScript

#### 1.1 Vite 6.x
**Why Vite:**
- Fastest HMR (Hot Module Replacement)
- Optimized production builds
- Native ESM support
- Plugin ecosystem
- Perfect for React Router 7

**Configuration:**
```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { reactRouter } from '@react-router/dev/vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    reactRouter(),
    react(),
    tsconfigPaths(),
    tailwindcss(),
  ],
  server: {
    port: 3000,
    open: true,
  },
})
```

#### 1.2 React 19.x
**Features Used:**
- Server Components (via React Router 7)
- Suspense for data fetching
- Error Boundaries
- Concurrent rendering
- Hooks (useState, useEffect, useMemo, etc.)

#### 1.3 TypeScript 5.x
**Configuration:**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "paths": {
      "~/*": ["./app/*"]
    }
  }
}
```

### 2. Routing: React Router 7 (Framework Mode)

**Why React Router 7:**
- Framework mode with SSR support
- Type-safe routing with TypeScript
- Data loaders and actions (like Remix)
- Nested routing (perfect for agent hierarchy)
- Built on Vite
- Stable v7.0 (not RC like TanStack Start)

**Key Features:**
```typescript
// app/routes.ts
import { type RouteConfig, route } from '@react-router/dev/routes'

export default [
  // Public routes
  route('/', 'routes/home.tsx'),
  route('/login', 'routes/auth/login.tsx'),

  // Agent routes (protected)
  route('/app', 'routes/app/layout.tsx', [
    route('dashboard', 'routes/app/dashboard.tsx'),
    route('betting', 'routes/app/betting/index.tsx'),
    route('history', 'routes/app/history.tsx'),
    route('results', 'routes/app/results.tsx'),
    route('downlines', 'routes/app/downlines/index.tsx'),
  ]),

  // Admin routes
  route('/admin', 'routes/admin/layout.tsx', [
    route('agents', 'routes/admin/agents.tsx'),
    route('quotas', 'routes/admin/quotas.tsx'),
    route('reports', 'routes/admin/reports.tsx'),
  ]),
] satisfies RouteConfig
```

**Data Loading Example:**
```typescript
// routes/app/dashboard.tsx
import type { Route } from './+types/dashboard'

export async function loader({ request }: Route.LoaderArgs) {
  // Server-side data loading
  const user = await requireAuth(request)
  const stats = await getAgentStats(user.id)
  return { user, stats }
}

export default function Dashboard({ loaderData }: Route.ComponentProps) {
  const { user, stats } = loaderData
  return <div>Dashboard for {user.name}</div>
}
```

### 3. Data Fetching: TanStack Query v5

**Why TanStack Query:**
- Best-in-class data synchronization
- Automatic caching and refetching
- Optimistic updates
- 9.5M+ weekly downloads
- Perfect for real-time quota tracking
- Works seamlessly with React Router 7

**Usage:**
```typescript
// hooks/use-quota.ts
import { useQuery, useMutation } from '@tanstack/react-query'

export function useQuota(userId: string) {
  return useQuery({
    queryKey: ['quota', userId],
    queryFn: () => api.getQuota(userId),
    refetchInterval: 30000, // Refetch every 30s
    staleTime: 10000,
  })
}

export function usePlaceBet() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (bet: BetInput) => api.placeBet(bet),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quota'] })
      queryClient.invalidateQueries({ queryKey: ['bets'] })
    },
  })
}
```

### 4. State Management: Zustand v5

**Why Zustand (over Redux):**
- Lightweight (1kb vs 8kb)
- Simple API
- No boilerplate
- TypeScript-first
- Great for UI state (auth, theme, sidebar)
- TanStack Query handles server state

**Usage:**
```typescript
// stores/auth.store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  user: User | null
  token: string | null
  login: (user: User, token: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      login: (user, token) => set({ user, token }),
      logout: () => set({ user: null, token: null }),
    }),
    { name: 'auth-storage' }
  )
)
```

### 5. Forms: React Hook Form v7 + Zod v3

**Why This Combo:**
- Best performance (minimal re-renders)
- Type-safe validation with Zod
- Great DX with schema inference
- Works with shadcn/ui components

**Usage:**
```typescript
// components/bet-form.tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const betSchema = z.object({
  gameType: z.enum(['3D', '4D', '5D', '6D']),
  provider: z.enum(['M', 'P', 'T', 'S']),
  numbers: z.string().regex(/^\d{3,6}$/),
  amount: z.number().min(1).max(10000),
  betType: z.enum(['BIG', 'SMALL']),
})

type BetFormData = z.infer<typeof betSchema>

export function BetForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<BetFormData>({
    resolver: zodResolver(betSchema),
  })

  const onSubmit = (data: BetFormData) => {
    // Submit bet
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Form fields */}
    </form>
  )
}
```

### 6. UI Components: shadcn/ui + Tailwind CSS

**Why shadcn/ui:**
- Not a component library (you own the code)
- Built on Radix UI (accessible primitives)
- Styled with Tailwind CSS
- Fully customizable
- TypeScript support
- Copy/paste components you need

**Components Used:**
- Button, Input, Select, Checkbox, Radio
- Table, Dialog, Sheet, Popover
- Form, Tabs, Card, Badge
- Calendar, Date Picker
- Toast, Alert

**Tailwind CSS v4:**
- Utility-first CSS
- Responsive design
- Dark mode support
- Custom design system

### 7. Tables: TanStack Table v8

**Perfect for:**
- Agent hierarchy tables
- Bet history tables
- Commission reports
- Result displays

**Features:**
- Headless (unstyled)
- Sorting, filtering, pagination
- Row selection
- Grouping and aggregation
- Virtual scrolling support
- TypeScript-first

### 8. Additional Libraries

| Library | Purpose | Version |
|---------|---------|---------|
| date-fns | Date manipulation | v4 |
| Recharts | Charts and graphs | v2 |
| Lucide React | Icons | latest |
| Sonner | Toast notifications | latest |
| Framer Motion | Animations | v11 |
| react-hot-toast | Alternative toast | v2 |
| clsx + tailwind-merge | Class utilities | latest |

---

## Backend Stack

### 1. NestJS v10.x (Node.js v20)

**Why NestJS:**
- Enterprise-grade framework
- TypeScript-first
- Dependency injection
- Modular architecture (perfect for complex business logic)
- Built-in validation
- Swagger/OpenAPI documentation
- Great for multi-level agent system

**Project Structure:**
```
backend/
├── src/
│   ├── modules/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── agents/
│   │   ├── bets/
│   │   ├── quotas/
│   │   ├── results/
│   │   ├── commissions/
│   │   ├── reports/
│   │   └── hierarchy/
│   ├── common/
│   │   ├── guards/
│   │   ├── decorators/
│   │   ├── filters/
│   │   └── interceptors/
│   ├── config/
│   ├── database/
│   └── main.ts
├── test/
├── prisma/ (or typeorm migrations/)
└── package.json
```

### 2. Authentication: Passport.js + JWT

**Strategy:**
```typescript
// auth/jwt.strategy.ts
import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    })
  }

  async validate(payload: any) {
    return { userId: payload.sub, role: payload.role, level: payload.level }
  }
}
```

### 3. Validation: class-validator + class-transformer

**DTOs:**
```typescript
// bets/dto/create-bet.dto.ts
import { IsEnum, IsNumber, IsString, Min, Max } from 'class-validator'

export class CreateBetDto {
  @IsEnum(['3D', '4D', '5D', '6D'])
  gameType: string

  @IsEnum(['M', 'P', 'T', 'S'])
  provider: string

  @IsString()
  numbers: string

  @IsNumber()
  @Min(1)
  @Max(10000)
  amount: number

  @IsEnum(['BIG', 'SMALL'])
  betType: string
}
```

### 4. Job Queue: Bull v4 (Redis)

**Use Cases:**
- Result synchronization (scheduled)
- Commission calculation (async)
- Weekly quota reset
- Report generation
- Email notifications

**Example:**
```typescript
// results/results.processor.ts
import { Processor, Process } from '@nestjs/bull'
import { Job } from 'bull'

@Processor('results')
export class ResultsProcessor {
  @Process('sync-results')
  async syncResults(job: Job) {
    const { provider } = job.data
    // Fetch results from API
    // Save to database
    // Calculate winnings
  }
}
```

### 5. Testing: Jest + Supertest

**Test Structure:**
```
backend/
├── test/
│   ├── unit/
│   │   ├── auth.service.spec.ts
│   │   ├── bets.service.spec.ts
│   │   └── commission.service.spec.ts
│   ├── integration/
│   │   ├── auth.e2e-spec.ts
│   │   └── bets.e2e-spec.ts
│   └── fixtures/
```

---

## Database & Caching

### 1. PostgreSQL 16.x

**Why PostgreSQL:**
- ACID compliance (critical for betting data)
- JSON/JSONB support
- Recursive CTEs (for unlimited hierarchy)
- Window functions (for commissions)
- Mature and reliable
- Strong TypeScript ORM support

**Key Features Used:**
- **Recursive CTEs**: Agent hierarchy queries
- **Materialized Views**: Report performance
- **Row-Level Security**: Moderator isolation
- **Triggers**: Audit logging
- **Partitioning**: Bet history (by date)
- **Indexes**: Optimized queries

### 2. Database & ORM: Azure SQL with Prisma

#### 2.1 Why Azure SQL Database?

**Advantages:**
- Fully managed SQL Server (no maintenance)
- Excellent Azure ecosystem integration
- Built-in security features
- Automatic backups (7-35 days retention)
- Point-in-time restore
- Easy scaling (DTU or vCore models)
- Lower cost than PostgreSQL Flexible Server
- Enterprise-grade reliability
- Geo-replication available
- Advanced threat protection

**Pricing Tiers:**

| Tier | DTU | Cost/Month | Use Case |
|------|-----|------------|----------|
| Basic | 5 | ~$5 | Development, small workloads |
| Standard S0 | 10 | ~$15 | Production (1K users) |
| Standard S1 | 20 | ~$30 | Production (5K users) |
| Standard S2 | 50 | ~$75 | Production (10K+ users) |

#### 2.2 Why Prisma for Azure SQL?

**Best ORM for SQL Server in Node.js:**
- Native SQL Server support (`provider = "sqlserver"`)
- Type-safe database client
- Automatic migrations
- Better DX than TypeORM
- Introspection for existing databases
- Studio for database management
- Active development

**Prisma Configuration:**

```prisma
// prisma/schema.prisma
datasource db {
  provider = "sqlserver"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
  previewFeatures = ["fullTextSearch"] // SQL Server features
}

model User {
  id              Int       @id @default(autoincrement())
  username        String    @unique @db.NVarChar(50)
  passwordHash    String    @db.NVarChar(255)
  role            String    @db.NVarChar(20)
  fullName        String    @db.NVarChar(100)

  // Hierarchy (self-referential)
  upline          User?     @relation("UserHierarchy", fields: [uplineId], references: [id], onDelete: NoAction, onUpdate: NoAction)
  uplineId        Int?
  downlines       User[]    @relation("UserHierarchy")

  // Weekly limits
  weeklyLimit     Decimal   @db.Money
  weeklyUsed      Decimal   @default(0) @db.Money
  commissionRate  Decimal   @db.Decimal(5,2) // 0.00 to 100.00

  // Metadata
  active          Boolean   @default(true)
  createdAt       DateTime  @default(now()) @db.DateTime
  updatedAt       DateTime  @updatedAt @db.DateTime

  // Relations
  bets            Bet[]
  commissions     Commission[]

  @@index([uplineId])
  @@index([username])
}
```

**Connection String:**
```
DATABASE_URL="sqlserver://lottery-server.database.windows.net:1433;database=lottery;user=sqladmin;password=YourPassword123!;encrypt=true;trustServerCertificate=false;hostNameInCertificate=*.database.windows.net;loginTimeout=30"
```

**Alternative (TypeORM):**
```typescript
// entities/user.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm'

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  username: string

  @Column()
  role: string

  @Column()
  level: number

  @ManyToOne(() => User, { nullable: true })
  upline: User
}
```

**Option B: Prisma v5.x** (Recommended)
```prisma
// schema.prisma
model User {
  id        Int      @id @default(autoincrement())
  username  String   @unique
  role      String
  level     Int
  upline    User?    @relation("UserHierarchy", fields: [uplineId], references: [id])
  uplineId  Int?
  downlines User[]   @relation("UserHierarchy")
  bets      Bet[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Recommendation: Prisma**
- Better DX
- Automatic migrations
- Type-safe client
- Better performance
- Active development

### 3. Caching Strategy

#### Phase 1: In-Memory Cache (MVP)

**NestJS Cache Manager:**
```typescript
// app.module.ts
import { CacheModule } from '@nestjs/cache-manager'

@Module({
  imports: [
    CacheModule.register({
      isGlobal: true,
      ttl: 300, // 5 minutes default
      max: 100, // Max items in cache
    }),
  ],
})
export class AppModule {}
```

**Use Cases:**

| Use Case | TTL | Implementation |
|----------|-----|----------------|
| Session storage | 24h | In-memory (MVP), migrate to Redis later |
| JWT blacklist | Token exp | In-memory or database table |
| Quota cache | 5min | In-memory cache |
| API rate limiting | 1min | In-memory (simple) or Azure API Management |
| Result cache | 1h | In-memory cache |

**Why In-Memory for MVP:**
- Zero infrastructure cost
- Simple setup
- Sufficient for initial load (<1000 users)
- Easy migration path to Redis later

#### Phase 2+: Azure Cache for Redis (Optional)

**When to Add Redis:**
- User base > 1000 active users
- Multiple backend instances (horizontal scaling)
- Need persistent sessions across restarts
- Distributed rate limiting required

**Migration is simple:**
```typescript
// Just change cache store
import * as redisStore from 'cache-manager-redis-store'

CacheModule.register({
  store: redisStore,
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
  ttl: 300,
})
```

---

## Deployment & Infrastructure

### 1. Primary Stack: Azure (Recommended)

**Frontend: Azure Static Web Apps**
- Automatic CI/CD from GitHub
- Global CDN
- Free SSL certificates
- Preview environments
- Built-in authentication
- Standard: $9/month

**Backend: Azure Functions**
- Serverless Node.js
- Consumption plan
- First 1M executions free
- Good integration with Azure services

**Database: Azure SQL Database**
- Fully managed SQL Server
- DTU or vCore pricing models
- Auto-scaling and high availability
- Built-in backups (7-35 days retention)
- Point-in-time restore
- Geo-replication available
- Basic tier: ~$5/month (5 DTU)
- Standard S0: ~$15/month (10 DTU)
- Excellent Prisma support

**Cache: In-Memory (Initial)**
- NestJS built-in cache-manager
- In-memory store (development & MVP)
- Zero cost, simple setup
- Easy migration to Redis later

**Cache: Azure Cache for Redis (Optional - Phase 2+)**
- Fully managed Redis
- High availability
- Basic: $15/month (250MB)
- Only enable when scaling needs it

**File Storage: Azure Blob Storage**
- S3-compatible
- $0.02 per GB/month
- CDN integration

**Cron Jobs: Azure Functions Timer Triggers**
- Built-in timer triggers
- No additional cost

### 6. Monitoring & Error Tracking

| Service | Purpose | Cost |
|---------|---------|------|
| Sentry | Error tracking | Free tier |
| Vercel Analytics | Frontend monitoring | Free |
| Better Uptime | Uptime monitoring | Free tier |
| LogTail | Log aggregation | Free tier |

---

## Development Tools

### 1. Version Control
- **Git** + **GitHub**
- Branch strategy: GitFlow
- PR reviews required
- Conventional commits

### 2. CI/CD: GitHub Actions

**Workflows:**
```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run build
      - uses: vercel/action@v25

  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm test
      - # Deploy to Railway
```

### 3. Code Quality

| Tool | Purpose |
|------|---------|
| ESLint | Linting |
| Prettier | Code formatting |
| Husky | Git hooks |
| lint-staged | Staged files linting |
| TypeScript | Type checking |
| Jest | Testing |

### 4. Development Environment

**Required:**
- Node.js v20 LTS
- npm v10+ or pnpm v9+
- Docker Desktop
- VS Code (or preferred IDE)

**VS Code Extensions:**
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- Prisma
- Error Lens
- GitLens

---

## Architecture Patterns

### 1. Frontend Architecture

**Pattern: Feature-Based**
```
app/
├── routes/           # React Router 7 routes
├── components/       # Shared components
│   ├── ui/          # shadcn/ui components
│   └── features/    # Feature-specific components
├── hooks/           # Custom hooks
├── lib/             # Utilities
├── stores/          # Zustand stores
├── api/             # API client
└── types/           # TypeScript types
```

### 2. Backend Architecture

**Pattern: Domain-Driven Design (DDD)**
```
src/
├── modules/         # Feature modules
│   ├── bets/
│   │   ├── bets.controller.ts
│   │   ├── bets.service.ts
│   │   ├── bets.repository.ts
│   │   ├── entities/
│   │   ├── dto/
│   │   └── bets.module.ts
├── common/          # Shared utilities
└── config/          # Configuration
```

### 3. API Design

**RESTful API:**
```
GET    /api/bets
POST   /api/bets
GET    /api/bets/:id
DELETE /api/bets/:id

GET    /api/agents
POST   /api/agents
GET    /api/agents/:id/hierarchy

GET    /api/quota/balance
POST   /api/quota/allocate
```

**Authentication:**
```
Authorization: Bearer {jwt_token}
```

---

## Migration Path

### Phase 1: Foundation (Weeks 1-2)

**Setup:**
```bash
# Frontend
npm create vite@latest lottery-web -- --template react-ts
cd lottery-web
npm install react-router@7 @tanstack/react-query zustand
npm install -D tailwindcss postcss autoprefixer
npx shadcn@latest init

# Backend
npm i -g @nestjs/cli
nest new lottery-api
cd lottery-api
npm install @nestjs/jwt @nestjs/passport passport-jwt
npm install prisma @prisma/client
```

### Phase 2: Core Features (Weeks 3-8)

1. Authentication system
2. Agent hierarchy
3. Betting module
4. Quota system

### Phase 3: Advanced Features (Weeks 9-16)

1. Result synchronization
2. Commission calculation
3. Reports
4. Admin panel

### Phase 4: Polish (Weeks 17-20)

1. Performance optimization
2. Testing
3. Documentation
4. Deployment

---

## Future Mobile Strategy

### React Native Migration (Phase 5+)

**Shared Code:**
```
packages/
├── shared/
│   ├── api/           # API client (shared)
│   ├── utils/         # Utilities (shared)
│   ├── validation/    # Zod schemas (shared)
│   └── types/         # TypeScript types (shared)
├── web/               # React web app
└── mobile/            # React Native app
```

**Benefits:**
- Same business logic
- Same API client (TanStack Query)
- Same validation (Zod)
- Same state management (Zustand)
- Same form handling (React Hook Form)

**Timeline:** 6-8 weeks after web launch

---

## Cost Estimation

### Azure Stack Cost (Primary)

**Development Phase (With Free Tiers):**
| Service | Plan | Cost |
|---------|------|------|
| Azure Static Web Apps | Free | $0 |
| Azure Functions | Consumption | $0 (1M free executions) |
| Azure SQL Database | Basic (5 DTU) | $5/mo |
| In-Memory Cache | Built-in | $0 |
| Azure Blob Storage | Standard | $0 (free tier 5GB) |
| GitHub | Free | $0 |
| **Total** | | **~$5/month** |

**Production Phase (1,000 daily active users):**
| Service | Plan | Cost | Notes |
|---------|------|------|-------|
| Azure Static Web Apps | Standard | $9/mo | Custom domains, SLA |
| Azure Functions | Consumption | ~$0-5/mo | 1M free, then $0.20/M |
| Azure SQL Database | Standard S0 (10 DTU) | $15/mo | Auto-scaling |
| In-Memory Cache | Built-in | $0 | No Redis needed yet |
| Azure Blob Storage | Standard | $2/mo | Reports, receipts |
| Sentry | Team (optional) | $26/mo | Error tracking |
| **Total (without Sentry)** | | **~$31/month** |
| **Total (with Sentry)** | | **~$57/month** |

**With Redis (When Scaling Up - 5,000+ users):**
| Service | Plan | Cost |
|---------|------|------|
| Azure Cache for Redis | Basic C0 (250MB) | $15/mo |
| Azure SQL Database | Standard S1 (20 DTU) | $30/mo |
| Other services | Same | $16/mo |
| **Total** | | **~$61/month** |

---

## Security Considerations

### 1. Authentication
- JWT with refresh tokens
- Password hashing (bcrypt)
- Rate limiting on login
- CSRF protection

### 2. Authorization
- Role-based access control (RBAC)
- Row-level security (PostgreSQL)
- Moderator data isolation
- API endpoint guards

### 3. Data Protection
- HTTPS only (TLS 1.3)
- SQL injection prevention (parameterized queries)
- XSS protection (input sanitization)
- CORS configuration
- Environment variables for secrets

### 4. Audit & Compliance
- Audit logs for critical operations
- Data retention policies
- Regular security audits
- Dependency scanning (npm audit)

---

## Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Page Load Time | < 2s | Lighthouse |
| API Response | < 200ms | p95 |
| Database Query | < 50ms | p95 |
| HMR Update | < 100ms | Vite |
| Time to Interactive | < 3s | Lighthouse |
| Lighthouse Score | > 90 | All categories |

---

## Summary

This tech stack is chosen to:

1. ✅ **Support future mobile apps** (React Native path)
2. ✅ **Production-ready** (stable, not RC)
3. ✅ **Type-safe** (TypeScript everywhere)
4. ✅ **Developer-friendly** (great DX, fast HMR)
5. ✅ **Cost-effective** (~$100/month for production)
6. ✅ **Scalable** (supports unlimited agent hierarchy)
7. ✅ **Maintainable** (popular libraries, large community)

**Next Steps:**
1. Review and approve this tech stack
2. Set up development environment
3. Initialize projects (frontend + backend)
4. Begin Phase 1 development

---

**Document Status:**
- ✅ Tech stack finalized
- ✅ Architecture patterns defined
- ✅ Cost estimation completed
- ⏳ Awaiting project initialization
