# Multi-Level Agent Lottery Sandbox System - Backend API

NestJS backend API for the lottery practice management system.

## Tech Stack

- **Framework**: NestJS v10
- **Language**: TypeScript 5.x (strict mode)
- **Database**: Azure SQL Server
- **ORM**: Prisma v5
- **Authentication**: JWT (Passport.js)
- **Serverless**: Azure Functions
- **Testing**: Jest
- **Code Quality**: ESLint + Prettier (zero warnings requirement)

## Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Azure SQL Database instance
- Azure Functions Core Tools (for local development)

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Copy the example environment file and configure your settings:

```bash
cp .env.example .env
```

Edit `.env` with your actual configuration values (database connection, JWT secrets, Azure credentials).

### 3. Database Setup

Generate Prisma Client:

```bash
npm run prisma:generate
```

Run database migrations:

```bash
npm run prisma:migrate
```

Seed initial data (optional):

```bash
npm run prisma:seed
```

### 4. Development

Start the development server with hot reload:

```bash
npm run start:dev
```

The API will be available at `http://localhost:3000`.
Swagger documentation will be available at `http://localhost:3000/api/docs`.

## Available Scripts

### Development

- `npm run start` - Start the application
- `npm run start:dev` - Start with file watching
- `npm run start:debug` - Start in debug mode
- `npm run build` - Build for production

### Code Quality

- `npm run lint` - Run ESLint (fails on warnings)
- `npm run lint:fix` - Fix ESLint issues automatically
- `npm run format` - Format code with Prettier

### Testing

- `npm test` - Run unit tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:cov` - Run tests with coverage
- `npm run test:e2e` - Run end-to-end tests
- `npm run test:debug` - Run tests in debug mode

### Database

- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:migrate` - Run migrations
- `npm run prisma:studio` - Open Prisma Studio
- `npm run prisma:seed` - Seed database with initial data

## Project Structure

```
backend/
├── prisma/                 # Prisma schema and migrations
│   ├── schema.prisma      # Database schema
│   ├── seed.ts            # Seed data script
│   └── migrations/        # Migration files
├── src/
│   ├── modules/           # Feature modules
│   │   ├── auth/         # Authentication module
│   │   ├── users/        # User/Agent management
│   │   ├── bets/         # Betting system
│   │   ├── providers/    # Service provider management
│   │   ├── results/      # Result management
│   │   ├── commissions/  # Commission calculations
│   │   ├── reports/      # Reporting system
│   │   └── limits/       # Weekly limit management
│   ├── common/            # Shared utilities
│   │   ├── decorators/   # Custom decorators
│   │   ├── filters/      # Exception filters
│   │   ├── guards/       # Auth guards
│   │   ├── interceptors/ # HTTP interceptors
│   │   ├── pipes/        # Validation pipes
│   │   └── services/     # Shared services
│   ├── config/            # Configuration
│   ├── prisma/            # Prisma service
│   ├── functions/         # Azure Functions
│   ├── app.module.ts      # Root module
│   └── main.ts            # Application entry point
├── test/                   # Test files
│   ├── unit/              # Unit tests
│   ├── integration/       # Integration tests
│   └── setup.ts           # Test setup
├── .env.example           # Environment template
├── .eslintrc.js           # ESLint configuration
├── .prettierrc            # Prettier configuration
├── jest.config.js         # Jest configuration
├── nest-cli.json          # NestJS CLI configuration
├── package.json           # Dependencies
└── tsconfig.json          # TypeScript configuration
```

## API Documentation

Once the server is running, visit:

- Swagger UI: `http://localhost:3000/api/docs`
- OpenAPI JSON: `http://localhost:3000/api/docs-json`

## Testing Requirements

- **Overall Coverage**: 80% minimum
- **Critical Services**: 100% coverage required for:
  - `commissions.service.ts` (commission calculations)
  - `limits.service.ts` (weekly limit management)
  - `bets.service.ts` (bet validation and placement)

Run coverage report:

```bash
npm run test:cov
```

## Code Quality Standards

- **TypeScript Strict Mode**: Enabled (no implicit any, strict null checks)
- **ESLint**: Zero warnings requirement (build fails on warnings)
- **Prettier**: Automatic formatting enforced
- **Type Safety**: All functions must have explicit return types

## Architecture Principles

- **Row-Level Security**: Moderators can only access their organization's data
- **Data Isolation**: Implemented via Prisma middleware
- **Audit Logging**: All financial operations logged to AuditLog table
- **Transaction Safety**: All critical operations wrapped in database transactions
- **Caching Strategy**: In-memory cache for providers (5min), hierarchy (30min)

## Deployment

The application is designed to deploy to Azure Static Web Apps with Azure Functions.

Deployment is automated via GitHub Actions (see `.github/workflows/azure-deploy.yml`).

## Environment Variables

See `.env.example` for all required environment variables with descriptions.

## Security

- JWT tokens with 15-minute expiration (access) and 7-day expiration (refresh)
- Password hashing with bcrypt (cost factor 12)
- Rate limiting on authentication endpoints (5 attempts per 15 minutes)
- API key encryption using Azure Key Vault
- CORS configured with strict origin whitelist
- Helmet security headers enabled

## Support

For issues or questions, please refer to the main project documentation in `/docs`.

## License

UNLICENSED - Private project
