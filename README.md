# Multi-Level Agent Lottery Sandbox System

A comprehensive lottery betting platform with unlimited agent hierarchy, multi-provider support, and automated commission calculations.

## 🎯 Features

### Core Functionality
- **Multi-Level Agent Hierarchy**: Unlimited depth with automatic commission cascading
- **Multi-Provider Betting**: Place bets across multiple lottery providers in single transaction
- **Automated Results Processing**: Automatic win/loss determination and commission calculation
- **Row-Level Security**: Data isolation by moderator with Prisma middleware
- **Comprehensive Reporting**: 6 different reports with Excel export

### User Roles
- **Admin**: Full system access, provider management, result entry
- **Moderator**: Manage agents within their organization
- **Agent**: Place bets, view own data, create sub-agents

### Business Logic
- **Weekly Betting Limits**: Per-user limits with auto-reset every Monday 00:00 MYT
- **Commission Calculation**: Recursive upline traversal with configurable rates
- **Audit Logging**: Complete audit trail for compliance

## 🏗️ Architecture

### Technology Stack

**Backend:**
- NestJS 10 (Node.js framework)
- Prisma 5 (ORM)
- Azure SQL Database
- Azure Functions (scheduled jobs)
- Passport.js (authentication)

**Frontend:**
- React 19
- React Router 7 (CSR mode)
- TanStack Query v5
- Zustand v5
- shadcn/ui + Tailwind CSS v4

**Infrastructure:**
- Azure Static Web Apps (frontend)
- Azure Functions Consumption (backend jobs)
- Azure Key Vault (encryption keys)

### Project Structure

```
lottery-sandbox/
├── apps/
│   ├── backend/          # NestJS API server
│   │   ├── prisma/       # Database schema & migrations
│   │   ├── src/
│   │   │   ├── modules/  # Feature modules
│   │   │   ├── common/   # Shared services
│   │   │   └── main.ts
│   │   └── package.json
│   ├── frontend/         # React Router 7 app
│   │   ├── app/
│   │   │   ├── routes/   # File-based routing
│   │   │   └── components/
│   │   └── package.json
│   └── functions/        # Azure Functions
│       ├── weekly-reset/ # Monday 00:00 MYT
│       └── sync-results/ # Wed/Sat/Sun 19:30 MYT
├── pnpm-workspace.yaml
└── package.json
```

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- pnpm 8.15+
- Azure SQL Database (or SQL Server 2022+)
- Azure account (for production deployment)

### Installation

```bash
# Clone repository
git clone <repository-url>
cd lottery-sandbox

# Install dependencies
pnpm install

# Setup backend
cd apps/backend

# Configure environment variables
cp .env.example .env
# Edit .env with your database connection string

# Generate Prisma client
pnpm prisma:generate

# Run migrations
pnpm prisma:migrate

# Seed database with demo data
pnpm prisma:seed

# Start development server
pnpm dev
```

The API will be available at `http://localhost:3000/api/v1`

Swagger documentation: `http://localhost:3000/api`

### Demo Users (from seed)

```
Admin:
  username: admin
  password: Admin@123456

Moderator 1:
  username: moderator1
  password: Mod1@123456

Agent (under moderator1):
  username: agent1
  password: Agent1@123456
```

## 📡 API Endpoints

### Authentication
```
POST   /api/v1/auth/login       # Login
POST   /api/v1/auth/refresh     # Refresh token
POST   /api/v1/auth/logout      # Logout
```

### Bets
```
POST   /api/v1/bets             # Place bet
POST   /api/v1/bets/:id/cancel  # Cancel bet
GET    /api/v1/bets             # Query bets (pagination)
GET    /api/v1/bets/:id         # Get bet details
```

### Users (Agents)
```
POST   /api/v1/users            # Create sub-agent
GET    /api/v1/users            # Query users
GET    /api/v1/users/hierarchy/tree  # Get hierarchy tree
GET    /api/v1/users/:id        # Get user details
PUT    /api/v1/users/:id        # Update user
DELETE /api/v1/users/:id        # Deactivate user
```

### Providers
```
POST   /api/v1/providers        # Create provider (admin)
GET    /api/v1/providers        # List providers (public)
GET    /api/v1/providers/:id    # Get provider
PUT    /api/v1/providers/:id    # Update provider (admin)
DELETE /api/v1/providers/:id    # Delete provider (admin)
```

### Results
```
POST   /api/v1/results          # Create result (admin)
GET    /api/v1/results          # Query results (public)
GET    /api/v1/results/:id      # Get result
PUT    /api/v1/results/:id      # Update result (admin)
DELETE /api/v1/results/:id      # Delete result (admin)
```

### Commissions
```
GET    /api/v1/commissions      # Query commissions
GET    /api/v1/commissions/stats # Get statistics
```

### Reports
```
GET    /api/v1/reports?reportType=bets&format=excel
GET    /api/v1/reports?reportType=win_loss&format=json
GET    /api/v1/reports?reportType=commissions&format=excel
GET    /api/v1/reports?reportType=agent_performance&format=excel
GET    /api/v1/reports?reportType=weekly_summary&format=excel
GET    /api/v1/reports?reportType=draw_results&format=excel
```

## 🔒 Security Features

1. **Authentication**: JWT with 15min access tokens, 7-day refresh tokens
2. **Authorization**: Role-based access control (RBAC)
3. **Row-Level Security**: Data isolation via Prisma middleware
4. **API Key Encryption**: AES-256-GCM for provider API keys
5. **Password Hashing**: bcrypt with cost factor 12
6. **Rate Limiting**: 100 requests/minute per IP
7. **Input Validation**: class-validator on all DTOs
8. **Audit Logging**: Complete audit trail
9. **CORS**: Configurable allowed origins
10. **Security Headers**: Helmet.js

## 📊 Database Schema

### Core Models
- **User**: Self-referential hierarchy (agents/moderators/admins)
- **ServiceProvider**: Lottery operators (Magnum, Sports Toto, etc.)
- **Bet**: Multi-provider bets with JSON provider arrays
- **DrawResult**: Winning numbers for each draw
- **Commission**: Upline commission records
- **RefreshToken**: JWT session management
- **AuditLog**: Security audit trail
- **LimitResetLog**: Weekly reset tracking

### Key Relationships
```
User (1) -> (*) Bet
ServiceProvider (1) -> (*) Bet
DrawResult (1) -> (*) Bet
Bet (1) -> (*) Commission
User (1) -> (*) Commission
```

## ⚙️ Configuration

### Environment Variables

**Backend (.env):**
```env
# Database
DATABASE_URL="sqlserver://localhost:1433;database=lottery_dev;user=sa;password=YourPassword;encrypt=true;trustServerCertificate=true"

# JWT
JWT_SECRET="your-secret-key"
JWT_ACCESS_EXPIRY="15m"
JWT_REFRESH_EXPIRY="7d"

# Encryption (32 bytes = 64 hex chars for AES-256)
ENCRYPTION_KEY="0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"

# CORS
CORS_ORIGINS="http://localhost:5173,http://localhost:4280"

# Rate Limiting
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100

# Server
PORT=3000
NODE_ENV=development
```

**Azure Functions (.env):**
```env
DATABASE_URL="<same-as-backend>"
WEBSITE_TIME_ZONE="Asia/Kuala_Lumpur"
MAGAYO_API_KEY="your-api-key"
MAGAYO_API_ENDPOINT="https://api.magayo.com/lottery/results"
```

## 🚢 Deployment

### Backend (Azure App Service)

```bash
# Build
pnpm build

# Deploy to Azure
az webapp up --name lottery-backend --resource-group lottery-rg
```

### Frontend (Azure Static Web Apps)

```bash
cd apps/frontend
pnpm build

# Deploy
az staticwebapp create \
  --name lottery-frontend \
  --resource-group lottery-rg \
  --source . \
  --location eastasia
```

### Azure Functions

```bash
cd apps/functions
pnpm build

# Deploy
func azure functionapp publish lottery-functions
```

### Database Migrations (Production)

```bash
cd apps/backend
pnpm prisma:deploy  # Run migrations without prompts
```

## 🧪 Testing

```bash
# Unit tests
pnpm test

# E2E tests
pnpm test:e2e

# Test coverage
pnpm test:cov
```

## 📈 Monitoring

- **Application Insights**: Track API performance
- **Audit Logs**: Review security events in database
- **Function Logs**: Monitor scheduled jobs
- **Error Tracking**: All exceptions logged

## 🔧 Development

### Database Migrations

```bash
# Create new migration
pnpm prisma:migrate

# Generate Prisma client
pnpm prisma:generate

# Open Prisma Studio (database GUI)
pnpm prisma:studio

# Reset database (dev only)
pnpm prisma migrate reset
```

### Code Quality

```bash
# Linting
pnpm lint

# Format code
pnpm format

# Type checking
pnpm type-check
```

## 📝 License

UNLICENSED - Private/Proprietary

## 👥 Support

For issues and questions:
- Check documentation
- Review API documentation at `/api`
- Contact system administrator

---

**Built with ❤️ using NestJS, Prisma, React, and Azure**
