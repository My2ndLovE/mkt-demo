# Tech Stack Recommendation
## TanStack-Based Multi-Level Lottery Sandbox System

**Version:** 1.0
**Date:** 2025-11-17
**For:** Multi-Level Agent Lottery Sandbox Platform

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [TanStack Ecosystem Overview](#tanstack-ecosystem-overview)
3. [Recommended Stack Option 1: Cloudflare](#recommended-stack-option-1-cloudflare)
4. [Recommended Stack Option 2: Azure](#recommended-stack-option-2-azure)
5. [Detailed Comparison](#detailed-comparison)
6. [Architecture Diagrams](#architecture-diagrams)
7. [Implementation Roadmap](#implementation-roadmap)
8. [Migration Path](#migration-path)
9. [Final Recommendation](#final-recommendation)

---

## Executive Summary

### Research Findings

Based on comprehensive research of the TanStack ecosystem and cloud hosting options, here are the **two optimal stack combinations** for your lottery sandbox system:

#### **Option 1: Cloudflare Stack (RECOMMENDED)**
```
TanStack Start + Cloudflare Workers + Neon PostgreSQL + Drizzle ORM + Redis
```
**Best for:** Global performance, edge computing, cost-effectiveness

#### **Option 2: Azure Stack**
```
TanStack Start + Azure Static Web Apps + Azure Functions + Azure PostgreSQL + Drizzle ORM
```
**Best for:** Enterprise features, Azure ecosystem integration

### Quick Recommendation

**🎯 I recommend Option 1 (Cloudflare Stack)** for your lottery sandbox system because:

1. **Better TanStack Start Support:** Native Cloudflare Workers integration with official adapters
2. **Global Edge Performance:** Deploy to 300+ cities worldwide
3. **Cost-Effective:** Generous free tier, pay-as-you-go pricing
4. **Serverless PostgreSQL:** Neon provides excellent Cloudflare Workers integration
5. **Simpler DevOps:** Single platform for all services
6. **Modern Architecture:** Built for edge-first applications

---

## TanStack Ecosystem Overview

### What is TanStack?

TanStack is a suite of high-quality, framework-agnostic JavaScript libraries created by Tanner Linsley. In 2025, the ecosystem includes:

#### **Core Libraries**

1. **TanStack Start** (Released RC Nov 2024)
   - Full-stack React framework
   - Built on TanStack Router + Vite
   - SSR, streaming, server functions
   - **Client-first architecture** (different from Next.js)
   - Universal deployment support
   - **Status:** Release Candidate (production-ready)

2. **TanStack Query** (formerly React Query)
   - Async state management
   - Server-state caching
   - 9.5M weekly downloads
   - Auto refetching, caching, deduplication
   - Optimistic updates
   - **Perfect for real-time quota tracking**

3. **TanStack Router**
   - Type-safe routing
   - Search params as state
   - Nested routes with data loading
   - Built-in loaders and actions
   - **Core of TanStack Start**

4. **TanStack Table**
   - Headless table/datagrid
   - Sorting, filtering, pagination
   - Virtual scrolling support
   - **Perfect for admin panel tables**

5. **TanStack Form** (V1 Released May 2025)
   - Type-safe form handling
   - SSR support
   - Framework-agnostic
   - **Perfect for betting forms**

6. **TanStack Virtual**
   - Virtual scrolling
   - Performance for large lists
   - **Perfect for long bet histories**

### Why TanStack for Your Project?

✅ **Type Safety:** End-to-end TypeScript
✅ **Performance:** Optimized for modern web
✅ **Developer Experience:** Great DX with hot reload
✅ **Ecosystem:** All libraries work together seamlessly
✅ **Community:** Strong community support
✅ **Future-Proof:** Active development, modern patterns

---

## Recommended Stack Option 1: Cloudflare

### 🏆 THE RECOMMENDED STACK

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLOUDFLARE STACK                              │
├─────────────────────────────────────────────────────────────────┤
│ Frontend Framework    │ TanStack Start (React)                  │
│ Hosting               │ Cloudflare Workers + Pages              │
│ Database (Primary)    │ Neon PostgreSQL (Serverless)            │
│ Database (Cache)      │ Cloudflare Workers KV / Durable Objects │
│ ORM                   │ Drizzle ORM                              │
│ Data Fetching         │ TanStack Query                           │
│ Routing               │ TanStack Router (built into Start)      │
│ Forms                 │ TanStack Form                            │
│ Tables                │ TanStack Table                           │
│ Virtual Lists         │ TanStack Virtual                         │
│ Styling               │ Tailwind CSS                             │
│ UI Components         │ shadcn/ui (Radix UI + Tailwind)         │
│ State Management      │ TanStack Query + React Context          │
│ Real-time             │ Cloudflare Durable Objects              │
│ File Storage          │ Cloudflare R2                            │
│ Email                 │ Resend / SendGrid                        │
│ SMS (optional)        │ Twilio                                   │
│ Cron Jobs             │ Cloudflare Cron Triggers                │
│ Analytics             │ Cloudflare Web Analytics                │
└─────────────────────────────────────────────────────────────────┘
```

### Architecture Details

#### **Frontend Layer**

**TanStack Start Configuration:**

```typescript
// app.config.ts
import { defineConfig } from '@tanstack/start/config'

export default defineConfig({
  server: {
    preset: 'cloudflare-module',
  },
})
```

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import { cloudflare } from '@cloudflare/vite-plugin'
import { tanstackStart } from '@tanstack/start/plugin'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    cloudflare({ viteEnvironment: { name: 'ssr' } }),
    tanstackStart(),
    tailwindcss(),
  ],
})
```

**Key Features:**
- ✅ SSR (Server-Side Rendering) at the edge
- ✅ Streaming for progressive page loading
- ✅ Type-safe server functions
- ✅ Built-in data fetching with loaders
- ✅ Hot Module Replacement (HMR)

#### **Backend Layer**

**Cloudflare Workers:**
- Serverless compute at the edge
- ~0ms cold starts
- Deploy to 300+ cities globally
- Built-in DDoS protection
- Automatic scaling

**Server Functions Example:**
```typescript
// app/server/auth.ts
import { createServerFn } from '@tanstack/start'
import { db } from './db'

export const loginUser = createServerFn()
  .validator(/* zod schema */)
  .handler(async ({ data }) => {
    // This runs on Cloudflare Workers edge
    const user = await db.query.users.findFirst({
      where: eq(users.username, data.username)
    })

    // Type-safe, validated, and secure
    return user
  })
```

#### **Database Layer**

**Neon PostgreSQL (Recommended):**

**Why Neon?**
- ✅ Serverless PostgreSQL designed for edge
- ✅ Excellent Cloudflare Workers integration
- ✅ Hyperdrive support for connection pooling
- ✅ Database branching (perfect for testing)
- ✅ Auto-scaling and auto-suspend
- ✅ Pay-per-use pricing
- ✅ Recently acquired by Databricks ($1B - May 2025)

**Connection via Hyperdrive:**
```typescript
// wrangler.jsonc
{
  "name": "lottery-sandbox",
  "compatibility_date": "2025-11-17",
  "compatibility_flags": ["nodejs_compat"],
  "main": "@tanstack/start/server-entry",
  "hyperdrive": [
    {
      "binding": "HYPERDRIVE",
      "id": "your-hyperdrive-id"
    }
  ]
}
```

**Drizzle ORM Configuration:**
```typescript
// db/schema.ts
import { pgTable, serial, text, integer, timestamp, boolean } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  email: text('email').notNull(),
  role: text('role').notNull(), // 'moderator' | 'agent'
  level: integer('level').notNull(), // 0-5
  uplineId: integer('upline_id').references(() => users.id),
  quotaDaily: integer('quota_daily').notNull(),
  quotaWeekly: integer('quota_weekly').notNull(),
  quotaMonthly: integer('quota_monthly').notNull(),
  quotaUsed: integer('quota_used').default(0),
  commissionRate: integer('commission_rate').default(0),
  status: text('status').default('active'), // 'active' | 'suspended' | 'inactive'
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export const bets = pgTable('bets', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  betDate: timestamp('bet_date').notNull(),
  drawDate: timestamp('draw_date').notNull(),
  gameType: text('game_type').notNull(), // '4D', '5D', '6D', 'TOTO', etc.
  provider: text('provider').notNull(), // 'M', 'P', 'T', 'S'
  betType: text('bet_type').notNull(), // 'BIG', 'SMALL', 'IBOX', etc.
  numbers: text('numbers').notNull(), // JSON array
  betAmounts: text('bet_amounts').notNull(), // JSON object
  totalAmount: integer('total_amount').notNull(),
  status: text('status').default('pending'), // 'pending', 'won', 'lost', 'cancelled'
  resultId: integer('result_id'),
  winningAmount: integer('winning_amount').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// ... more tables (results, commissions, quota_transactions, etc.)
```

```typescript
// db/index.ts
import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import * as schema from './schema'

export function getDB(env: Env) {
  const sql = neon(env.DATABASE_URL)
  return drizzle(sql, { schema })
}
```

**Why Drizzle ORM?**
- ✅ Lightweight (7.4kb minified)
- ✅ Zero dependencies
- ✅ SQL-like syntax (easy to learn)
- ✅ Full TypeScript type safety
- ✅ Perfect for Cloudflare Workers
- ✅ Fastest ORM for 2025
- ✅ Migrations built-in
- ✅ Tree-shakeable

#### **Caching Layer**

**Option A: Cloudflare Workers KV (Simple cache)**
```typescript
// For simple key-value caching
await env.KV_CACHE.put('quota:user:123', JSON.stringify(quotaData), {
  expirationTtl: 300 // 5 minutes
})
```

**Option B: Cloudflare Durable Objects (Real-time state)**
```typescript
// For real-time quota tracking with consistency
export class QuotaManager implements DurableObject {
  state: DurableObjectState

  async fetch(request: Request) {
    const userId = new URL(request.url).searchParams.get('userId')
    const quota = await this.state.storage.get(`quota:${userId}`)
    // Guaranteed consistency per user
    return new Response(JSON.stringify(quota))
  }

  async deductQuota(userId: string, amount: number) {
    const current = await this.state.storage.get(`quota:${userId}`) || 0
    const newQuota = current - amount
    await this.state.storage.put(`quota:${userId}`, newQuota)
    return newQuota
  }
}
```

**Recommendation:** Use **Durable Objects** for quota management (real-time, consistent) and **Workers KV** for result caching.

#### **Real-time Features**

**Cloudflare Durable Objects for:**
- Real-time quota updates
- Live bet tracking
- Result synchronization locks
- User session management

**Example:**
```typescript
// app/durable-objects/quota-manager.ts
export class QuotaManager implements DurableObject {
  private state: DurableObjectState
  private sessions: Set<WebSocket>

  constructor(state: DurableObjectState) {
    this.state = state
    this.sessions = new Set()
  }

  async fetch(request: Request) {
    // Handle WebSocket connections for real-time updates
    const upgradeHeader = request.headers.get('Upgrade')
    if (upgradeHeader === 'websocket') {
      const pair = new WebSocketPair()
      this.sessions.add(pair[1])

      pair[1].addEventListener('close', () => {
        this.sessions.delete(pair[1])
      })

      return new Response(null, { status: 101, webSocket: pair[0] })
    }

    // Handle regular HTTP requests
    return await this.handleRequest(request)
  }

  // Broadcast quota updates to all connected clients
  broadcast(message: any) {
    const data = JSON.stringify(message)
    this.sessions.forEach(ws => ws.send(data))
  }
}
```

#### **File Storage**

**Cloudflare R2:**
- S3-compatible object storage
- Zero egress fees
- Perfect for storing:
  - Bet receipts (PDF)
  - Reports (Excel, PDF)
  - User uploads
  - System backups

#### **Scheduled Jobs**

**Cloudflare Cron Triggers:**
```typescript
// wrangler.jsonc
{
  "triggers": {
    "crons": [
      "0 19 * * 3,6,0", // 7 PM Wed, Sat, Sun (Malaysia draws)
      "0 18 * * 3,6,0", // 6 PM Wed, Sat, Sun (Singapore draws)
      "0 0 * * *",       // Daily quota reset at midnight
      "0 0 * * 1"        // Weekly quota reset on Monday
    ]
  }
}
```

```typescript
// src/cron.ts
export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    switch (event.cron) {
      case '0 19 * * 3,6,0':
        await syncMalaysiaResults(env)
        break
      case '0 18 * * 3,6,0':
        await syncSingaporeResults(env)
        break
      case '0 0 * * *':
        await resetDailyQuotas(env)
        break
      case '0 0 * * 1':
        await resetWeeklyQuotas(env)
        break
    }
  }
}
```

### Technology Stack Details

#### **1. Frontend Framework: TanStack Start**

**Installation:**
```bash
npm create cloudflare@latest lottery-sandbox -- --framework=tanstack-start
cd lottery-sandbox
npm install
```

**Project Structure:**
```
lottery-sandbox/
├── app/
│   ├── routes/
│   │   ├── __root.tsx          # Root layout
│   │   ├── index.tsx            # Home page
│   │   ├── auth/
│   │   │   ├── login.tsx
│   │   │   └── register.tsx
│   │   ├── betting/
│   │   │   ├── simple.tsx       # Simple betting mode
│   │   │   └── detailed.tsx     # Detailed betting mode
│   │   ├── admin/
│   │   │   ├── _layout.tsx      # Admin layout
│   │   │   ├── dashboard.tsx
│   │   │   ├── agents.tsx
│   │   │   └── settings.tsx
│   │   └── ...
│   ├── server/                  # Server-side code
│   │   ├── auth.ts              # Auth functions
│   │   ├── bets.ts              # Bet operations
│   │   ├── agents.ts            # Agent management
│   │   └── ...
│   ├── components/              # React components
│   ├── lib/                     # Utilities
│   └── styles/                  # CSS/Tailwind
├── db/
│   ├── schema.ts                # Drizzle schema
│   ├── migrations/              # DB migrations
│   └── index.ts                 # DB connection
├── durable-objects/
│   ├── quota-manager.ts
│   └── session-manager.ts
├── public/                      # Static assets
├── wrangler.jsonc               # Cloudflare config
├── drizzle.config.ts            # Drizzle config
└── package.json
```

#### **2. Data Fetching: TanStack Query**

```typescript
// app/hooks/use-bets.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { placeBet, getBets, cancelBet } from '../server/bets'

export function useBets(userId: string) {
  return useQuery({
    queryKey: ['bets', userId],
    queryFn: () => getBets(userId),
    refetchInterval: 5000, // Auto-refetch every 5s
  })
}

export function usePlaceBet() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: placeBet,
    onSuccess: () => {
      // Invalidate and refetch bets
      queryClient.invalidateQueries({ queryKey: ['bets'] })
      // Update quota cache
      queryClient.invalidateQueries({ queryKey: ['quota'] })
    },
  })
}

export function useCancelBet() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: cancelBet,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bets'] })
      queryClient.invalidateQueries({ queryKey: ['quota'] })
    },
  })
}
```

**Usage in Component:**
```typescript
// app/routes/betting/history.tsx
import { useBets } from '~/hooks/use-bets'

export default function BettingHistory() {
  const { data: bets, isLoading, error } = useBets(userId)

  if (isLoading) return <LoadingSpinner />
  if (error) return <ErrorMessage error={error} />

  return (
    <div>
      {bets.map(bet => <BetCard key={bet.id} bet={bet} />)}
    </div>
  )
}
```

#### **3. Tables: TanStack Table**

```typescript
// app/components/admin/agent-table.tsx
import { useReactTable, getCoreRowModel, getSortedRowModel } from '@tanstack/react-table'

const columns = [
  { accessorKey: 'username', header: 'Username' },
  { accessorKey: 'level', header: 'Level' },
  { accessorKey: 'quotaUsed', header: 'Quota Used' },
  { accessorKey: 'quotaRemaining', header: 'Quota Remaining' },
  // ... more columns
]

export function AgentTable({ agents }) {
  const table = useReactTable({
    data: agents,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <table>
      <thead>
        {table.getHeaderGroups().map(headerGroup => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map(header => (
              <th key={header.id}>
                {header.isPlaceholder ? null : (
                  <div onClick={header.column.getToggleSortingHandler()}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </div>
                )}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map(row => (
          <tr key={row.id}>
            {row.getVisibleCells().map(cell => (
              <td key={cell.id}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
```

#### **4. Forms: TanStack Form**

```typescript
// app/components/betting/bet-form.tsx
import { useForm } from '@tanstack/react-form'
import { zodValidator } from '@tanstack/zod-form-adapter'
import { z } from 'zod'

const betSchema = z.object({
  gameType: z.enum(['4D', '5D', '6D', 'TOTO']),
  provider: z.enum(['M', 'P', 'T', 'S']),
  betType: z.enum(['BIG', 'SMALL', 'IBOX', 'SYSTEM']),
  numbers: z.array(z.string().length(4)),
  amount: z.number().min(1).max(10000),
})

export function BetForm() {
  const form = useForm({
    defaultValues: {
      gameType: '4D',
      provider: 'M',
      betType: 'BIG',
      numbers: [],
      amount: 1,
    },
    validatorAdapter: zodValidator,
    validators: {
      onChange: betSchema,
    },
    onSubmit: async ({ value }) => {
      await placeBet(value)
    },
  })

  return (
    <form onSubmit={(e) => {
      e.preventDefault()
      form.handleSubmit()
    }}>
      {/* Form fields with validation */}
    </form>
  )
}
```

### Deployment Configuration

**wrangler.jsonc (Complete):**
```jsonc
{
  "$schema": "./node_modules/wrangler/config-schema.json",
  "name": "lottery-sandbox",
  "compatibility_date": "2025-11-17",
  "compatibility_flags": ["nodejs_compat"],
  "main": "@tanstack/start/server-entry",

  // Hyperdrive for PostgreSQL connection pooling
  "hyperdrive": [
    {
      "binding": "HYPERDRIVE",
      "id": "your-hyperdrive-id"
    }
  ],

  // KV for caching
  "kv_namespaces": [
    {
      "binding": "KV_CACHE",
      "id": "your-kv-id"
    }
  ],

  // Durable Objects for real-time state
  "durable_objects": {
    "bindings": [
      {
        "name": "QUOTA_MANAGER",
        "class_name": "QuotaManager",
        "script_name": "lottery-sandbox"
      }
    ]
  },
  "migrations": [
    {
      "tag": "v1",
      "new_classes": ["QuotaManager"]
    }
  ],

  // R2 for file storage
  "r2_buckets": [
    {
      "binding": "R2_STORAGE",
      "bucket_name": "lottery-sandbox-files"
    }
  ],

  // Environment variables
  "vars": {
    "ENVIRONMENT": "production"
  },

  // Secrets (set via CLI)
  // wrangler secret put DATABASE_URL
  // wrangler secret put JWT_SECRET

  // Cron triggers
  "triggers": {
    "crons": [
      "0 19 * * 3,6,0",
      "0 18 * * 3,6,0",
      "0 0 * * *",
      "0 0 * * 1"
    ]
  }
}
```

### Cost Estimate (Cloudflare)

**Free Tier Limits:**
- Workers: 100,000 requests/day
- KV: 100,000 reads/day, 1,000 writes/day
- Durable Objects: 1M requests/month (free tier now available)
- R2: 10 GB storage, 1M Class A operations/month
- Pages: Unlimited requests

**Paid Tier (Workers Paid ~$5/month):**
- Workers: $0.50 per million requests
- KV: $0.50 per million reads
- Durable Objects: $0.15 per million requests
- R2: $0.015 per GB/month storage

**Neon PostgreSQL:**
- Free tier: 512 MB storage, 3 GB data transfer
- Pro: $19/month for 8 GB storage

**Estimated Monthly Cost (1,000 daily active users):**
- Cloudflare Workers Paid: $5
- Neon Pro: $19
- Email (Resend): $20 (for 50k emails)
- **Total: ~$44/month**

### Pros & Cons

**Pros:**
✅ Excellent TanStack Start integration (official support)
✅ Global edge deployment (300+ cities)
✅ Near-zero cold starts
✅ Cost-effective (generous free tier)
✅ Serverless PostgreSQL with Neon
✅ Built-in DDoS protection
✅ Durable Objects for real-time features
✅ Simple deployment (`wrangler deploy`)
✅ Great developer experience
✅ Automatic scaling
✅ Zero egress fees with R2

**Cons:**
❌ Learning curve for Cloudflare ecosystem
❌ Workers have 10ms CPU time limit per request (usually not an issue)
❌ Durable Objects can be complex for beginners
❌ Limited to Cloudflare ecosystem
❌ D1 (Cloudflare's SQLite) has limitations for multi-tenant (so we use Neon instead)

---

## Recommended Stack Option 2: Azure

### THE AZURE ALTERNATIVE

```
┌─────────────────────────────────────────────────────────────────┐
│                      AZURE STACK                                 │
├─────────────────────────────────────────────────────────────────┤
│ Frontend Framework    │ TanStack Start (React)                  │
│ Hosting               │ Azure Static Web Apps                   │
│ Backend               │ Azure Functions (Node.js)               │
│ Database              │ Azure Database for PostgreSQL           │
│ ORM                   │ Drizzle ORM                              │
│ Data Fetching         │ TanStack Query                           │
│ Routing               │ TanStack Router (built into Start)      │
│ Forms                 │ TanStack Form                            │
│ Tables                │ TanStack Table                           │
│ Virtual Lists         │ TanStack Virtual                         │
│ Styling               │ Tailwind CSS                             │
│ UI Components         │ shadcn/ui                                │
│ State Management      │ TanStack Query + React Context          │
│ Cache                 │ Azure Cache for Redis                   │
│ File Storage          │ Azure Blob Storage                      │
│ Email                 │ Azure Communication Services            │
│ SMS                   │ Azure Communication Services            │
│ Cron Jobs             │ Azure Functions Timer Triggers          │
│ Analytics             │ Azure Application Insights              │
└─────────────────────────────────────────────────────────────────┘
```

### Architecture Details

#### **Frontend: Azure Static Web Apps**

Azure Static Web Apps provides:
- Automatic CI/CD from GitHub
- Global CDN distribution
- Free SSL certificates
- Preview environments
- Custom domains
- Built-in authentication

**Configuration:**
```json
// staticwebapp.config.json
{
  "platform": {
    "apiRuntime": "node:20"
  },
  "routes": [
    {
      "route": "/api/*",
      "allowedRoles": ["authenticated"]
    },
    {
      "route": "/admin/*",
      "allowedRoles": ["admin"]
    }
  ],
  "navigationFallback": {
    "rewrite": "/index.html"
  }
}
```

#### **Backend: Azure Functions**

**TanStack Start Adapter for Azure:**
```typescript
// api/[[...routes]]/index.ts
import { createRequestHandler } from '@tanstack/start/server'
import { app } from '../../app/server'

export default createRequestHandler({
  build: app,
  mode: process.env.NODE_ENV,
})
```

**Function Configuration:**
```json
// host.json
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

#### **Database: Azure Database for PostgreSQL**

**Options:**

1. **Azure Database for PostgreSQL - Flexible Server** (Recommended)
   - Fully managed PostgreSQL
   - Auto-scaling
   - High availability
   - Backup and restore
   - VNet integration

2. **Azure Cosmos DB for PostgreSQL** (If you need horizontal scaling)
   - Distributed PostgreSQL
   - Uses Citus extension
   - Scales to 100s of TB

**Connection:**
```typescript
// db/index.ts
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

const pool = new Pool({
  host: process.env.PGHOST,
  port: parseInt(process.env.PGPORT || '5432'),
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  ssl: {
    rejectUnauthorized: false
  }
})

export const db = drizzle(pool, { schema })
```

#### **Caching: Azure Cache for Redis**

```typescript
import { createClient } from 'redis'

const redis = createClient({
  url: process.env.REDIS_URL,
  password: process.env.REDIS_PASSWORD
})

await redis.connect()

// Cache quota data
await redis.set(`quota:${userId}`, JSON.stringify(quotaData), {
  EX: 300 // 5 minutes
})
```

#### **Scheduled Jobs: Azure Functions Timer Triggers**

```typescript
// api/sync-results/index.ts
import { app, Timer } from '@azure/functions'

app.timer('syncMalaysiaResults', {
  schedule: '0 19 * * 3,6,0', // 7 PM Wed, Sat, Sun
  handler: async (timer: Timer, context) => {
    await syncMalaysiaResults()
  }
})

app.timer('syncSingaporeResults', {
  schedule: '0 18 * * 3,6,0', // 6 PM Wed, Sat, Sun
  handler: async (timer: Timer, context) => {
    await syncSingaporeResults()
  }
})
```

### Deployment

**GitHub Actions Workflow:**
```yaml
# .github/workflows/azure-static-web-apps.yml
name: Azure Static Web Apps CI/CD

on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main

jobs:
  build_and_deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Build And Deploy
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          repo_token: ${{ secrets.GITHUB_TOKEN }}
          action: "upload"
          app_location: "/"
          api_location: "api"
          output_location: "dist"
```

### Cost Estimate (Azure)

**Azure Static Web Apps:**
- Free tier: 100 GB bandwidth/month
- Standard: $9/month per app

**Azure Functions:**
- Consumption plan: $0.20 per million executions
- First 1M executions free

**Azure Database for PostgreSQL:**
- Flexible Server (Burstable): $15-50/month
- General Purpose: $100+/month

**Azure Cache for Redis:**
- Basic: $15/month (250 MB)
- Standard: $55/month (1 GB)

**Azure Blob Storage:**
- $0.02 per GB/month

**Estimated Monthly Cost (1,000 DAU):**
- Static Web Apps: $9
- Functions: ~Free (under 1M)
- PostgreSQL Flexible: $30
- Redis Basic: $15
- Blob Storage: $2
- **Total: ~$56/month**

### Pros & Cons

**Pros:**
✅ Enterprise-grade security and compliance
✅ Integrated with Microsoft ecosystem
✅ Excellent monitoring (Application Insights)
✅ Built-in authentication
✅ VNet integration for security
✅ Free SSL and custom domains
✅ Automatic CI/CD from GitHub
✅ Strong SLA guarantees

**Cons:**
❌ More expensive than Cloudflare
❌ Slower cold starts (Azure Functions)
❌ More complex configuration
❌ Less optimal TanStack Start integration
❌ Requires more DevOps knowledge
❌ Regional deployment (not global edge)

---

## Detailed Comparison

### Feature Comparison Matrix

| Feature | Cloudflare Stack | Azure Stack |
|---------|------------------|-------------|
| **Deployment** | ⭐⭐⭐⭐⭐ Single command | ⭐⭐⭐⭐ GitHub Actions |
| **Global Performance** | ⭐⭐⭐⭐⭐ Edge (300+ cities) | ⭐⭐⭐ Regional CDN |
| **Cold Starts** | ⭐⭐⭐⭐⭐ ~0ms | ⭐⭐⭐ ~1-3s |
| **TanStack Start Support** | ⭐⭐⭐⭐⭐ Official adapter | ⭐⭐⭐ Custom setup |
| **Database** | ⭐⭐⭐⭐⭐ Neon (serverless) | ⭐⭐⭐⭐ Managed PostgreSQL |
| **Real-time** | ⭐⭐⭐⭐⭐ Durable Objects | ⭐⭐⭐ SignalR/WebSockets |
| **Cost (1K DAU)** | ⭐⭐⭐⭐⭐ ~$44/month | ⭐⭐⭐⭐ ~$56/month |
| **Developer Experience** | ⭐⭐⭐⭐⭐ Excellent | ⭐⭐⭐⭐ Good |
| **Monitoring** | ⭐⭐⭐⭐ Good | ⭐⭐⭐⭐⭐ Excellent |
| **Enterprise Features** | ⭐⭐⭐⭐ Good | ⭐⭐⭐⭐⭐ Excellent |
| **Scaling** | ⭐⭐⭐⭐⭐ Automatic | ⭐⭐⭐⭐ Automatic |
| **Learning Curve** | ⭐⭐⭐⭐ Medium | ⭐⭐⭐ Steeper |

### Performance Comparison

**Cloudflare:**
- First byte: ~50ms (edge)
- Database query (Neon via Hyperdrive): ~20-50ms
- Total API response: ~70-100ms

**Azure:**
- First byte: ~100-200ms (regional)
- Database query: ~10-30ms (same region)
- Total API response: ~110-230ms

**Winner:** Cloudflare (global edge performance)

### Cost Comparison (Projected)

**Scenario: 1,000 Daily Active Users**

| Service | Cloudflare | Azure |
|---------|------------|-------|
| Compute | $5 | $9 |
| Database | $19 | $30 |
| Cache | Included | $15 |
| Storage | $2 | $2 |
| Email | $20 | $20 |
| **Total** | **$46/month** | **$76/month** |

**Scenario: 10,000 Daily Active Users**

| Service | Cloudflare | Azure |
|---------|------------|-------|
| Compute | $15 | $50 |
| Database | $49 | $100 |
| Cache | Included | $55 |
| Storage | $5 | $5 |
| Email | $50 | $50 |
| **Total** | **$119/month** | **$260/month** |

**Winner:** Cloudflare (more cost-effective at scale)

---

## Architecture Diagrams

### Cloudflare Stack Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER DEVICE                              │
│                    (Browser / Mobile)                            │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ HTTPS
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                  CLOUDFLARE GLOBAL NETWORK                       │
│                     (300+ Edge Locations)                        │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              CLOUDFLARE WORKERS + PAGES                  │  │
│  │                                                           │  │
│  │  ┌─────────────────────────────────────────┐            │  │
│  │  │        TanStack Start SSR                │            │  │
│  │  │  ┌─────────────────────────────────┐    │            │  │
│  │  │  │  Routes / Loaders / Actions     │    │            │  │
│  │  │  │  - /api/auth/*                   │    │            │  │
│  │  │  │  - /api/bets/*                   │    │            │  │
│  │  │  │  - /api/agents/*                 │    │            │  │
│  │  │  └─────────────────────────────────┘    │            │  │
│  │  └─────────────────────────────────────────┘            │  │
│  │                                                           │  │
│  └──────────────┬────────────────────────┬──────────────────┘  │
│                 │                        │                      │
└─────────────────┼────────────────────────┼──────────────────────┘
                  │                        │
        ┌─────────▼──────────┐   ┌────────▼─────────────┐
        │  Workers KV        │   │  Durable Objects     │
        │  (Result Cache)    │   │  (Quota Manager)     │
        │                    │   │  (Session State)     │
        └────────────────────┘   └──────────────────────┘
                  │
        ┌─────────▼──────────────────────┐
        │    HYPERDRIVE                  │
        │  (Connection Pooling)          │
        └─────────┬──────────────────────┘
                  │
        ┌─────────▼──────────────────────┐
        │    NEON POSTGRESQL             │
        │  (Serverless Database)         │
        │  ┌──────────────────────────┐  │
        │  │ Tables:                  │  │
        │  │ - users / agents         │  │
        │  │ - bets                   │  │
        │  │ - results                │  │
        │  │ - commissions            │  │
        │  │ - quota_transactions     │  │
        │  └──────────────────────────┘  │
        └────────────────────────────────┘

        ┌────────────────────────────────┐
        │    CLOUDFLARE R2               │
        │  (Object Storage)              │
        │  - Bet receipts (PDF)          │
        │  - Reports (Excel, PDF)        │
        │  - Backups                     │
        └────────────────────────────────┘

        ┌────────────────────────────────┐
        │    EXTERNAL SERVICES           │
        │  - Result APIs (Lottery)       │
        │  - Resend (Email)              │
        │  - Twilio (SMS)                │
        └────────────────────────────────┘

        ┌────────────────────────────────┐
        │    CRON TRIGGERS               │
        │  - Result sync (7PM MY/SG)     │
        │  - Quota reset (Daily/Weekly)  │
        └────────────────────────────────┘
```

### Data Flow - Place Bet (Cloudflare)

```
USER                WORKERS           DURABLE OBJECT      NEON DB
  │                    │                     │               │
  │ POST /api/bet      │                     │               │
  ├───────────────────>│                     │               │
  │                    │                     │               │
  │                    │ Check quota         │               │
  │                    ├────────────────────>│               │
  │                    │                     │               │
  │                    │ Quota available     │               │
  │                    │<────────────────────┤               │
  │                    │                     │               │
  │                    │ Deduct quota        │               │
  │                    ├────────────────────>│               │
  │                    │                     │               │
  │                    │ Quota deducted      │               │
  │                    │<────────────────────┤               │
  │                    │                     │               │
  │                    │ Save bet            │               │
  │                    ├─────────────────────────────────────>│
  │                    │                     │               │
  │                    │ Bet saved           │               │
  │                    │<─────────────────────────────────────┤
  │                    │                     │               │
  │                    │ Log quota txn       │               │
  │                    ├─────────────────────────────────────>│
  │                    │                     │               │
  │ Bet receipt        │                     │               │
  │<───────────────────┤                     │               │
  │                    │                     │               │
```

---

## Implementation Roadmap

### Phase 1: Setup & Foundation (Week 1-2)

**Cloudflare Path:**

1. **Initialize Project**
   ```bash
   npm create cloudflare@latest lottery-sandbox -- --framework=tanstack-start
   cd lottery-sandbox
   npm install
   ```

2. **Install Dependencies**
   ```bash
   npm install drizzle-orm @neondatabase/serverless
   npm install -D drizzle-kit
   npm install @tanstack/react-query @tanstack/react-table @tanstack/react-form
   npm install tailwindcss @tailwindcss/vite
   npm install shadcn-ui zod
   ```

3. **Setup Database**
   - Create Neon account
   - Create PostgreSQL database
   - Setup Hyperdrive connection
   - Define Drizzle schema
   - Run migrations

4. **Configure Cloudflare**
   - Setup KV namespace
   - Setup Durable Objects
   - Setup R2 bucket
   - Configure environment variables
   - Setup cron triggers

5. **Deploy Hello World**
   ```bash
   wrangler deploy
   ```

**Azure Path:**

1. **Initialize Project**
   ```bash
   npm create tanstack-start@latest lottery-sandbox
   cd lottery-sandbox
   npm install
   ```

2. **Install Dependencies** (same as Cloudflare)

3. **Setup Azure Resources**
   ```bash
   az group create --name lottery-sandbox --location eastasia
   az postgres flexible-server create --resource-group lottery-sandbox
   az redis create --resource-group lottery-sandbox
   az storage account create --resource-group lottery-sandbox
   ```

4. **Setup Static Web Apps**
   - Connect GitHub repository
   - Configure build settings
   - Setup API functions

5. **Deploy**
   - Push to GitHub (auto-deploy via Actions)

### Phase 2: Core Features (Week 3-8)

See PRD_LOTTERY_SANDBOX_SYSTEM.md Milestone 1-2

### Phase 3: Advanced Features (Week 9-16)

See PRD_LOTTERY_SANDBOX_SYSTEM.md Milestone 3-4

### Phase 4: Production Ready (Week 17-24)

See PRD_LOTTERY_SANDBOX_SYSTEM.md Milestone 5-6

---

## Migration Path

### From Current Astro + Alpine.js

**Current Stack:**
- Astro (static site generator)
- Alpine.js (lightweight reactivity)
- Tailwind CSS
- Mock data

**Migration Strategy:**

#### **Step 1: Keep Astro Temporarily**

You can actually use TanStack Router and Query with Astro:

```typescript
// astro.config.mjs
import { defineConfig } from 'astro/config'
import react from '@astrojs/react'

export default defineConfig({
  integrations: [react()],
})
```

Then use React islands for interactive parts:

```astro
---
// src/pages/betting.astro
import BettingForm from '../components/BettingForm'
---

<Layout>
  <BettingForm client:load />
</Layout>
```

#### **Step 2: Migrate to TanStack Start** (Recommended)

**Component Migration:**
- Alpine.js → React hooks
- Astro pages → TanStack Start routes
- Mock data → API calls with TanStack Query

**Example:**

**Before (Astro + Alpine):**
```astro
<div x-data="{ count: 0 }">
  <button @click="count++">Count: <span x-text="count"></span></button>
</div>
```

**After (TanStack Start + React):**
```tsx
export default function Counter() {
  const [count, setCount] = useState(0)
  return (
    <button onClick={() => setCount(c => c + 1)}>
      Count: {count}
    </button>
  )
}
```

**Styling:**
- Keep Tailwind CSS (no changes needed)
- Can use same CSS classes

**Timeline:**
- Week 1-2: Setup new TanStack Start project
- Week 3-4: Migrate components one by one
- Week 5-6: Migrate pages and routes
- Week 7-8: Add backend functionality
- Week 9: Parallel run both systems
- Week 10: Switch to new system

---

## Final Recommendation

### 🏆 WINNER: Cloudflare Stack

**Recommended Tech Stack:**

```
Frontend:     TanStack Start (React)
Hosting:      Cloudflare Workers + Pages
Database:     Neon PostgreSQL (via Hyperdrive)
ORM:          Drizzle ORM
Caching:      Cloudflare Durable Objects + Workers KV
Storage:      Cloudflare R2
Data Fetch:   TanStack Query
Tables:       TanStack Table
Forms:        TanStack Form
Virtual:      TanStack Virtual
Styling:      Tailwind CSS
UI:           shadcn/ui
Email:        Resend
SMS:          Twilio (optional)
Cron:         Cloudflare Cron Triggers
```

### Why Cloudflare?

1. **🚀 Best Performance**
   - Global edge deployment (lowest latency worldwide)
   - ~0ms cold starts
   - Fastest time-to-first-byte

2. **💰 Most Cost-Effective**
   - $44/month for 1K users
   - $119/month for 10K users
   - Generous free tier for development

3. **🛠️ Best DX (Developer Experience)**
   - Official TanStack Start support
   - Simple deployment (`wrangler deploy`)
   - Excellent local development
   - Hot Module Replacement

4. **🏗️ Perfect for Your Use Case**
   - Durable Objects ideal for quota management
   - Hyperdrive perfect for database connection pooling
   - Cron triggers for result syncing
   - KV for result caching

5. **📈 Future-Proof**
   - Modern edge-first architecture
   - Active development and support
   - Growing ecosystem

### When to Choose Azure Instead

Choose Azure if you:
- Already have Azure infrastructure
- Need enterprise compliance (SOC 2, HIPAA, etc.)
- Require VNet integration
- Want Microsoft support contracts
- Need Azure AD integration
- Prefer traditional server architecture

---

## Quick Start Guide

### Get Started with Cloudflare Stack (30 minutes)

```bash
# 1. Create project
npm create cloudflare@latest lottery-sandbox -- --framework=tanstack-start
cd lottery-sandbox

# 2. Install dependencies
npm install drizzle-orm @neondatabase/serverless
npm install @tanstack/react-query @tanstack/react-table @tanstack/react-form
npm install tailwindcss @tailwindcss/vite
npm install -D drizzle-kit

# 3. Run dev server
npm run dev

# 4. Deploy to Cloudflare
wrangler deploy
```

### Next Steps

1. ✅ Review and approve this tech stack
2. ✅ Create Cloudflare account
3. ✅ Create Neon account
4. ✅ Follow Phase 1 setup (Week 1-2)
5. ✅ Start building!

---

## Resources & Documentation

### Official Documentation

**TanStack:**
- TanStack Start: https://tanstack.com/start/latest
- TanStack Query: https://tanstack.com/query/latest
- TanStack Router: https://tanstack.com/router/latest
- TanStack Table: https://tanstack.com/table/latest
- TanStack Form: https://tanstack.com/form/latest

**Cloudflare:**
- Workers: https://developers.cloudflare.com/workers/
- Pages: https://developers.cloudflare.com/pages/
- Durable Objects: https://developers.cloudflare.com/durable-objects/
- KV: https://developers.cloudflare.com/kv/
- R2: https://developers.cloudflare.com/r2/

**Neon:**
- Docs: https://neon.tech/docs
- Cloudflare Integration: https://neon.tech/docs/guides/cloudflare-workers

**Drizzle ORM:**
- Docs: https://orm.drizzle.team/
- PostgreSQL: https://orm.drizzle.team/docs/get-started-postgresql

### Community & Support

- TanStack Discord: https://discord.com/invite/tanstack
- Cloudflare Discord: https://discord.gg/cloudflaredev
- Neon Discord: https://discord.gg/neon

### Learning Resources

- TanStack Start Course: Frontend Masters
- Cloudflare Workers Course: Cloudflare Learning Center
- Drizzle ORM Tutorials: YouTube

---

## Conclusion

The **TanStack + Cloudflare** stack provides the perfect combination of:
- 🎯 Modern development experience
- ⚡ Exceptional performance
- 💰 Cost-effectiveness
- 🚀 Easy deployment
- 📈 Scalability

This stack will serve your lottery sandbox system extremely well, from initial development through to production scale with thousands of users.

Ready to build? Let's go! 🚀

---

**Document Status:**
- ✅ Research completed
- ✅ Recommendations provided
- ✅ Architecture designed
- ⏳ Awaiting approval to proceed with implementation

**Next Action:** Review and approve this tech stack, then proceed to Phase 1 setup.
