# Lottery Sandbox Backend

NestJS-based backend for the Multi-Level Agent Lottery Sandbox System.

## Prerequisites

- Node.js 20 LTS or higher
- pnpm (recommended) or npm
- Azure SQL Database or local SQL Server

## Setup

1. Install dependencies:
```bash
pnpm install
```

2. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

3. Run database migrations:
```bash
pnpm prisma:migrate
```

4. Seed the database:
```bash
pnpm prisma:seed
```

## Development

Start the development server:
```bash
pnpm start:dev
```

The API will be available at `http://localhost:3000/api/v1`
API documentation at `http://localhost:3000/api/docs`

## Default Credentials

After seeding:
- **Admin**: username: `admin`, password: `Admin123!`
- **Moderator** (dev only): username: `moderator1`, password: `Moderator123!`
- **Agent** (dev only): username: `agent1`, password: `Agent123!`

## Testing

```bash
# Unit tests
pnpm test

# E2E tests
pnpm test:e2e

# Test coverage
pnpm test:cov
```

## Database

```bash
# Generate Prisma client
pnpm prisma:generate

# Create migration
pnpm prisma migrate dev --name migration_name

# Open Prisma Studio
pnpm prisma:studio
```

## Architecture

- **Framework**: NestJS v10
- **ORM**: Prisma v5
- **Database**: Azure SQL Database (SQL Server)
- **Authentication**: JWT (15min access, 7day refresh)
- **Validation**: class-validator
- **Documentation**: Swagger/OpenAPI

## Project Structure

```
src/
├── modules/           # Feature modules
│   ├── auth/         # Authentication
│   ├── users/        # User management
│   ├── providers/    # Service providers
│   ├── bets/         # Betting system
│   ├── limits/       # Weekly limits
│   ├── results/      # Draw results
│   ├── commissions/  # Commission calculations
│   └── reports/      # Reporting
├── common/           # Shared utilities
│   ├── decorators/
│   ├── filters/
│   ├── guards/
│   ├── interceptors/
│   └── pipes/
├── config/           # Configuration
├── prisma/           # Prisma service
├── app.module.ts     # Root module
└── main.ts           # Bootstrap
```

## Key Features

### Row-Level Security (RLS)
Automatic data isolation via Prisma middleware. Moderators can only access their organization's data.

### Multi-Provider Betting
Single bet can target multiple lottery providers simultaneously (Architecture Decision AD-001).

### Caching
In-memory caching with @nestjs/cache-manager. Redis migration available for scaling.

### Rate Limiting
Throttle guards on authentication endpoints (5 login attempts per minute).

## Environment Variables

See `.env.example` for all available configuration options.

## Deployment

Configured for Azure Functions deployment. See `host.json` for Azure-specific settings.

## License

UNLICENSED
