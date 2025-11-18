# Quickstart Guide: Multi-Level Agent Lottery Sandbox System

**Version**: 1.0.0
**Last Updated**: 2025-01-18
**Estimated Setup Time**: 45-60 minutes (local), 90 minutes (Azure deployment)

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Azure Deployment](#azure-deployment)
4. [Migration to Azure App Service](#migration-to-azure-app-service)
5. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

- **Node.js**: v20.11.0 or higher ([Download](https://nodejs.org/))
- **pnpm**: v8.15.0 or higher (install via `npm install -g pnpm`)
- **Git**: Latest version ([Download](https://git-scm.com/))
- **Azure CLI**: Latest version ([Download](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli))
- **VS Code**: Recommended IDE ([Download](https://code.visualstudio.com/))

### Azure Requirements

- **Azure Subscription**: Free tier or paid subscription ([Create Free Account](https://azure.microsoft.com/free/))
- **Azure Services Required**:
  - Azure Static Web Apps (Free tier)
  - Azure Functions (Consumption plan)
  - Azure SQL Database (Basic tier: ~$5/month)

### VS Code Extensions (Recommended)

```bash
# Install VS Code extensions via CLI
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension prisma.prisma
code --install-extension ms-azuretools.vscode-azurefunctions
code --install-extension ms-azuretools.vscode-azurestaticwebapps
code --install-extension bradlc.vscode-tailwindcss
```

---

## Local Development Setup

### Step 1: Clone Repository

```bash
# Clone the repository
git clone https://github.com/your-org/lottery-sandbox.git
cd lottery-sandbox

# Install all dependencies (monorepo uses pnpm workspaces)
pnpm install
```

### Step 2: Environment Configuration

#### Backend Environment (apps/backend/.env)

```bash
# Navigate to backend
cd apps/backend

# Create .env file from template
cp .env.example .env
```

Edit `apps/backend/.env`:

```env
# Database Configuration (Local Development uses SQL Server LocalDB or Docker)
DATABASE_URL="sqlserver://localhost:1433;database=lottery_dev;user=sa;password=YourStrong!Passw0rd;encrypt=true;trustServerCertificate=true"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_ACCESS_EXPIRY="15m"
JWT_REFRESH_EXPIRY="7d"

# Azure Functions Configuration (Local Development)
AzureWebJobsStorage="UseDevelopmentStorage=true"
FUNCTIONS_WORKER_RUNTIME="node"

# Lottery API Configuration
MAGAYO_API_KEY="your-magayo-api-key"
MAGAYO_API_ENDPOINT="https://api.magayo.com/lottery/results"

# CORS Origins (comma-separated)
CORS_ORIGINS="http://localhost:5173,http://localhost:4280"

# Rate Limiting
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100
```

#### Frontend Environment (apps/frontend/.env)

```bash
# Navigate to frontend
cd apps/frontend

# Create .env file
cp .env.example .env
```

Edit `apps/frontend/.env`:

```env
# API Endpoint (Local Development)
VITE_API_BASE_URL="http://localhost:3000/api/v1"

# Feature Flags
VITE_ENABLE_MOCK_DATA="false"
VITE_ENABLE_DEBUG="true"

# Analytics (Optional)
VITE_ENABLE_ANALYTICS="false"
```

### Step 3: Database Setup

#### Option A: SQL Server LocalDB (Windows Only)

```bash
# Install SQL Server Express LocalDB
# Download from: https://learn.microsoft.com/en-us/sql/database-engine/configure-windows/sql-server-express-localdb

# Verify installation
sqllocaldb info

# Create database instance
sqllocaldb create "LotteryDev" -s
```

Update `DATABASE_URL` in `apps/backend/.env`:

```env
DATABASE_URL="sqlserver://localhost:1433;database=lottery_dev;user=sa;password=YourStrong!Passw0rd;encrypt=true;trustServerCertificate=true"
```

#### Option B: SQL Server Docker (Cross-Platform)

```bash
# Run SQL Server in Docker
docker run -e "ACCEPT_EULA=Y" -e "MSSQL_SA_PASSWORD=YourStrong!Passw0rd" \
  -p 1433:1433 --name sql_server_dev -d \
  mcr.microsoft.com/mssql/server:2022-latest

# Verify container is running
docker ps
```

Update `DATABASE_URL` in `apps/backend/.env`:

```env
DATABASE_URL="sqlserver://localhost:1433;database=lottery_dev;user=sa;password=YourStrong!Passw0rd;encrypt=true;trustServerCertificate=true"
```

#### Run Prisma Migrations

```bash
# From apps/backend directory
cd apps/backend

# Generate Prisma Client
pnpm prisma generate

# Run migrations
pnpm prisma migrate dev --name init

# Seed database with initial data
pnpm prisma db seed
```

**Expected Seed Data**:
- 1 ADMIN user (username: `admin`, password: `Admin@123456`)
- 4 Service Providers (Magnum, Sports Toto, Damacai, Singapore Pools)
- 2 MODERATOR users
- 10 AGENT users with hierarchy

### Step 4: Start Development Servers

#### Terminal 1: Backend (NestJS + Azure Functions)

```bash
# From project root
cd apps/backend

# Start NestJS development server with hot reload
pnpm dev

# Expected output:
# [Nest] 12345  - 01/18/2025, 10:00:00 AM     LOG [NestFactory] Starting Nest application...
# [Nest] 12345  - 01/18/2025, 10:00:00 AM     LOG [InstanceLoader] AppModule dependencies initialized
# [Nest] 12345  - 01/18/2025, 10:00:00 AM     LOG [NestApplication] Nest application successfully started
# [Nest] 12345  - 01/18/2025, 10:00:00 AM     LOG Application is running on: http://localhost:3000
```

Verify backend health:

```bash
# Test API health endpoint
curl http://localhost:3000/api/v1/health

# Expected response:
# {"status":"ok","timestamp":"2025-01-18T02:00:00.000Z"}
```

#### Terminal 2: Frontend (Vite + React)

```bash
# From project root
cd apps/frontend

# Start Vite development server
pnpm dev

# Expected output:
# VITE v6.0.0  ready in 500 ms
# ➜  Local:   http://localhost:5173/
# ➜  Network: use --host to expose
```

Open browser: [http://localhost:5173](http://localhost:5173)

**Default Login Credentials**:
- Username: `admin`
- Password: `Admin@123456`

### Step 5: Verify Local Setup

Run the following tests to ensure everything works:

```bash
# From project root

# Run backend unit tests
cd apps/backend
pnpm test

# Run backend e2e tests
pnpm test:e2e

# Run frontend tests
cd ../frontend
pnpm test

# Type checking
pnpm type-check

# Linting
pnpm lint
```

---

## Azure Deployment

### Step 1: Azure CLI Login

```bash
# Login to Azure
az login

# Set subscription (if you have multiple)
az account list --output table
az account set --subscription "Your Subscription Name"

# Verify active subscription
az account show --output table
```

### Step 2: Create Resource Group

```bash
# Create resource group in Southeast Asia region
az group create \
  --name rg-lottery-sandbox-prod \
  --location southeastasia

# Verify resource group creation
az group show --name rg-lottery-sandbox-prod --output table
```

### Step 3: Create Azure SQL Database

```bash
# Create SQL Server
az sql server create \
  --name sql-lottery-prod \
  --resource-group rg-lottery-sandbox-prod \
  --location southeastasia \
  --admin-user sqladmin \
  --admin-password "YourStrong!Passw0rd123"

# Configure firewall (allow Azure services)
az sql server firewall-rule create \
  --resource-group rg-lottery-sandbox-prod \
  --server sql-lottery-prod \
  --name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0

# Create database (Basic tier: ~$5/month)
az sql db create \
  --resource-group rg-lottery-sandbox-prod \
  --server sql-lottery-prod \
  --name lottery-prod \
  --service-objective Basic \
  --max-size 2GB

# Get connection string
az sql db show-connection-string \
  --client ado.net \
  --server sql-lottery-prod \
  --name lottery-prod
```

**Copy the connection string** - you'll need it for environment variables.

Example connection string:

```
Server=tcp:sql-lottery-prod.database.windows.net,1433;Initial Catalog=lottery-prod;Persist Security Info=False;User ID=sqladmin;Password=YourStrong!Passw0rd123;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;
```

### Step 4: Run Prisma Migrations on Azure SQL

```bash
# From apps/backend directory
cd apps/backend

# Set Azure SQL connection string as environment variable
# Convert ADO.NET connection string to Prisma format:
export DATABASE_URL="sqlserver://sql-lottery-prod.database.windows.net:1433;database=lottery-prod;user=sqladmin;password=YourStrong!Passw0rd123;encrypt=true"

# Run migrations
pnpm prisma migrate deploy

# Seed production database
pnpm prisma db seed

# Verify migration
pnpm prisma studio
```

### Step 5: Create Azure Static Web App

```bash
# Create Static Web App with GitHub Actions integration
az staticwebapp create \
  --name swa-lottery-prod \
  --resource-group rg-lottery-sandbox-prod \
  --location eastasia \
  --sku Free \
  --branch main \
  --app-location "/apps/frontend" \
  --output-location "dist" \
  --login-with-github

# Get deployment token
az staticwebapp secrets list \
  --name swa-lottery-prod \
  --resource-group rg-lottery-sandbox-prod \
  --query "properties.apiKey" \
  --output tsv
```

**Save the deployment token** - you'll add it to GitHub Secrets.

### Step 6: Create Azure Functions App

```bash
# Create storage account (required for Azure Functions)
az storage account create \
  --name salotteryprod \
  --resource-group rg-lottery-sandbox-prod \
  --location southeastasia \
  --sku Standard_LRS

# Create Azure Functions app (Consumption plan: serverless)
az functionapp create \
  --name func-lottery-backend-prod \
  --resource-group rg-lottery-sandbox-prod \
  --consumption-plan-location southeastasia \
  --runtime node \
  --runtime-version 20 \
  --storage-account salotteryprod \
  --functions-version 4 \
  --os-type Linux

# Configure CORS (allow Static Web App origin)
STATIC_WEB_APP_URL=$(az staticwebapp show \
  --name swa-lottery-prod \
  --resource-group rg-lottery-sandbox-prod \
  --query "defaultHostname" \
  --output tsv)

az functionapp cors add \
  --name func-lottery-backend-prod \
  --resource-group rg-lottery-sandbox-prod \
  --allowed-origins "https://$STATIC_WEB_APP_URL"
```

### Step 7: Configure Application Settings (Environment Variables)

#### Azure Functions Environment Variables

```bash
# Database connection string
az functionapp config appsettings set \
  --name func-lottery-backend-prod \
  --resource-group rg-lottery-sandbox-prod \
  --settings \
    "DATABASE_URL=sqlserver://sql-lottery-prod.database.windows.net:1433;database=lottery-prod;user=sqladmin;password=YourStrong!Passw0rd123;encrypt=true;connection_limit=1;pool_timeout=20" \
    "JWT_SECRET=$(openssl rand -base64 32)" \
    "JWT_ACCESS_EXPIRY=15m" \
    "JWT_REFRESH_EXPIRY=7d" \
    "MAGAYO_API_KEY=your-production-api-key" \
    "MAGAYO_API_ENDPOINT=https://api.magayo.com/lottery/results" \
    "NODE_ENV=production"

# Enable Application Insights (optional but recommended)
az functionapp config appsettings set \
  --name func-lottery-backend-prod \
  --resource-group rg-lottery-sandbox-prod \
  --settings "APPLICATIONINSIGHTS_CONNECTION_STRING=$(az monitor app-insights component show --app func-lottery-backend-prod-ai --resource-group rg-lottery-sandbox-prod --query connectionString -o tsv)"
```

#### Static Web App Environment Variables

```bash
# Set API base URL
az staticwebapp appsettings set \
  --name swa-lottery-prod \
  --resource-group rg-lottery-sandbox-prod \
  --setting-names \
    "VITE_API_BASE_URL=https://func-lottery-backend-prod.azurewebsites.net/api/v1" \
    "VITE_ENABLE_DEBUG=false" \
    "VITE_ENABLE_ANALYTICS=true"
```

### Step 8: Deploy Backend (Azure Functions)

```bash
# From apps/backend directory
cd apps/backend

# Build for production
pnpm build

# Install Azure Functions Core Tools (if not already installed)
# Windows: choco install azure-functions-core-tools
# macOS: brew install azure-functions-core-tools
# Linux: npm install -g azure-functions-core-tools@4

# Deploy to Azure Functions
func azure functionapp publish func-lottery-backend-prod --node

# Expected output:
# Getting site publishing info...
# Uploading package...
# Deployment successful.
# Functions in func-lottery-backend-prod:
#   HttpTrigger - [httpTrigger]
#     Invoke url: https://func-lottery-backend-prod.azurewebsites.net/api/{route}
```

Verify deployment:

```bash
# Test health endpoint
curl https://func-lottery-backend-prod.azurewebsites.net/api/v1/health

# Expected response:
# {"status":"ok","timestamp":"2025-01-18T02:00:00.000Z"}
```

### Step 9: Configure GitHub Actions (CI/CD)

#### Add GitHub Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Add the following secrets:

| Secret Name | Value | How to Get |
|-------------|-------|-----------|
| `AZURE_STATIC_WEB_APPS_API_TOKEN` | Token from Step 5 | `az staticwebapp secrets list` |
| `AZURE_FUNCTIONAPP_PUBLISH_PROFILE` | Publish profile XML | `az functionapp deployment list-publishing-profiles --name func-lottery-backend-prod --resource-group rg-lottery-sandbox-prod --xml` |
| `DATABASE_URL` | Azure SQL connection string | From Step 3 |

#### GitHub Actions Workflow (Already Configured)

The repository includes `.github/workflows/azure-deploy.yml`:

```yaml
name: Deploy to Azure

on:
  push:
    branches:
      - main
  pull_request:
    types: [opened, synchronize, reopened, closed]
    branches:
      - main

jobs:
  build_and_deploy_frontend:
    if: github.event_name == 'push' || (github.event_name == 'pull_request' && github.event.action != 'closed')
    runs-on: ubuntu-latest
    name: Build and Deploy Frontend
    steps:
      - uses: actions/checkout@v4
        with:
          submodules: true

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install pnpm
        run: npm install -g pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build frontend
        run: pnpm --filter frontend build
        env:
          VITE_API_BASE_URL: https://func-lottery-backend-prod.azurewebsites.net/api/v1

      - name: Deploy to Azure Static Web Apps
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          repo_token: ${{ secrets.GITHUB_TOKEN }}
          action: "upload"
          app_location: "/apps/frontend"
          output_location: "dist"

  deploy_backend:
    runs-on: ubuntu-latest
    name: Deploy Backend
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install pnpm
        run: npm install -g pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build backend
        run: pnpm --filter backend build

      - name: Run Prisma migrations
        run: pnpm --filter backend prisma migrate deploy
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}

      - name: Deploy to Azure Functions
        uses: Azure/functions-action@v1
        with:
          app-name: 'func-lottery-backend-prod'
          publish-profile: ${{ secrets.AZURE_FUNCTIONAPP_PUBLISH_PROFILE }}
          package: 'apps/backend'
```

Push to `main` branch to trigger deployment:

```bash
git add .
git commit -m "Deploy to Azure"
git push origin main
```

### Step 10: Verify Production Deployment

1. **Frontend URL**: `https://swa-lottery-prod.azurestaticapps.net`
2. **Backend API**: `https://func-lottery-backend-prod.azurewebsites.net/api/v1`

**Health Checks**:

```bash
# Check backend health
curl https://func-lottery-backend-prod.azurewebsites.net/api/v1/health

# Check frontend (should return HTML)
curl https://swa-lottery-prod.azurestaticapps.net

# Test login API
curl -X POST https://func-lottery-backend-prod.azurewebsites.net/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin@123456"}'
```

---

## Migration to Azure App Service

If you need to migrate from **Azure Static Web Apps + Functions** to **Azure App Service** (e.g., for cold start optimization or simplified architecture), follow these steps:

### Why Migrate?

- **Cold Start Issues**: Azure Functions Consumption plan has 600ms-1.5s cold start
- **Simpler Architecture**: Single deployment instead of separate frontend + backend
- **WebSocket Support**: App Service has better WebSocket support (if needed)
- **Cost Predictability**: App Service has fixed cost vs. Functions pay-per-execution

**Trade-offs**:
- Higher cost: ~$70/month (Basic B1) vs. ~$31/month (Static Web Apps + Functions)
- No global CDN by default (can add Azure CDN separately)

### Migration Steps (4-5 hours)

#### Step 1: Create App Service Plan

```bash
# Create App Service Plan (Basic B1 tier: ~$13/month)
az appservice plan create \
  --name plan-lottery-prod \
  --resource-group rg-lottery-sandbox-prod \
  --location southeastasia \
  --sku B1 \
  --is-linux
```

#### Step 2: Create Web App

```bash
# Create Web App for backend
az webapp create \
  --name app-lottery-backend-prod \
  --resource-group rg-lottery-sandbox-prod \
  --plan plan-lottery-prod \
  --runtime "NODE:20-lts"

# Create Web App for frontend
az webapp create \
  --name app-lottery-frontend-prod \
  --resource-group rg-lottery-sandbox-prod \
  --plan plan-lottery-prod \
  --runtime "NODE:20-lts"
```

#### Step 3: Configure Environment Variables

```bash
# Backend environment variables
az webapp config appsettings set \
  --name app-lottery-backend-prod \
  --resource-group rg-lottery-sandbox-prod \
  --settings \
    "DATABASE_URL=sqlserver://sql-lottery-prod.database.windows.net:1433;database=lottery-prod;user=sqladmin;password=YourStrong!Passw0rd123;encrypt=true" \
    "JWT_SECRET=$(openssl rand -base64 32)" \
    "PORT=8080"

# Frontend environment variables
az webapp config appsettings set \
  --name app-lottery-frontend-prod \
  --resource-group rg-lottery-sandbox-prod \
  --settings \
    "VITE_API_BASE_URL=https://app-lottery-backend-prod.azurewebsites.net/api/v1"
```

#### Step 4: Update Deployment Scripts

Update `.github/workflows/azure-deploy.yml`:

```yaml
- name: Deploy Backend to App Service
  uses: azure/webapps-deploy@v2
  with:
    app-name: 'app-lottery-backend-prod'
    publish-profile: ${{ secrets.AZURE_WEBAPP_BACKEND_PUBLISH_PROFILE }}
    package: 'apps/backend/dist'

- name: Deploy Frontend to App Service
  uses: azure/webapps-deploy@v2
  with:
    app-name: 'app-lottery-frontend-prod'
    publish-profile: ${{ secrets.AZURE_WEBAPP_FRONTEND_PUBLISH_PROFILE }}
    package: 'apps/frontend/dist'
```

#### Step 5: Deploy and Test

```bash
# Deploy
git push origin main

# Verify
curl https://app-lottery-backend-prod.azurewebsites.net/api/v1/health
curl https://app-lottery-frontend-prod.azurewebsites.net
```

#### Step 6: Update DNS (Optional)

If you have a custom domain:

```bash
# Add custom domain to App Service
az webapp config hostname add \
  --webapp-name app-lottery-backend-prod \
  --resource-group rg-lottery-sandbox-prod \
  --hostname api.lottery-sandbox.com

# Enable SSL
az webapp config ssl bind \
  --name app-lottery-backend-prod \
  --resource-group rg-lottery-sandbox-prod \
  --certificate-thumbprint <thumbprint> \
  --ssl-type SNI
```

**Migration Complete** - No code changes required, only configuration!

---

## Troubleshooting

### Common Issues

#### Issue 1: Database Connection Timeout

**Error**: `Error: connect ETIMEDOUT`

**Solution**:

```bash
# Check firewall rules
az sql server firewall-rule list \
  --server sql-lottery-prod \
  --resource-group rg-lottery-sandbox-prod

# Add your IP address
az sql server firewall-rule create \
  --resource-group rg-lottery-sandbox-prod \
  --server sql-lottery-prod \
  --name AllowMyIP \
  --start-ip-address <your-ip> \
  --end-ip-address <your-ip>
```

#### Issue 2: Prisma Client Not Generated

**Error**: `@prisma/client did not initialize yet`

**Solution**:

```bash
cd apps/backend
pnpm prisma generate
pnpm build
```

#### Issue 3: CORS Errors in Browser

**Error**: `Access to fetch at '...' from origin '...' has been blocked by CORS policy`

**Solution**:

```bash
# Update CORS settings
az functionapp cors add \
  --name func-lottery-backend-prod \
  --resource-group rg-lottery-sandbox-prod \
  --allowed-origins "https://swa-lottery-prod.azurestaticapps.net"
```

#### Issue 4: Azure Functions Cold Start

**Error**: High latency (>2s) on first request

**Solution**:

Option 1: Enable Always On (requires Premium plan)

```bash
az functionapp config set \
  --name func-lottery-backend-prod \
  --resource-group rg-lottery-sandbox-prod \
  --always-on true
```

Option 2: Migrate to App Service (see [Migration to Azure App Service](#migration-to-azure-app-service))

#### Issue 5: Environment Variables Not Loading

**Error**: `process.env.DATABASE_URL is undefined`

**Solution**:

```bash
# Verify environment variables
az functionapp config appsettings list \
  --name func-lottery-backend-prod \
  --resource-group rg-lottery-sandbox-prod \
  --output table

# Restart the function app
az functionapp restart \
  --name func-lottery-backend-prod \
  --resource-group rg-lottery-sandbox-prod
```

### Useful Commands

```bash
# View Azure Functions logs
az functionapp log tail \
  --name func-lottery-backend-prod \
  --resource-group rg-lottery-sandbox-prod

# View Static Web App deployment logs
az staticwebapp show \
  --name swa-lottery-prod \
  --resource-group rg-lottery-sandbox-prod

# Check database connectivity
az sql db show \
  --resource-group rg-lottery-sandbox-prod \
  --server sql-lottery-prod \
  --name lottery-prod

# Monitor API performance
az monitor metrics list \
  --resource /subscriptions/{subscription-id}/resourceGroups/rg-lottery-sandbox-prod/providers/Microsoft.Web/sites/func-lottery-backend-prod \
  --metric "AverageResponseTime"
```

---

## Next Steps

1. **Configure Custom Domain**: [Azure Static Web Apps Custom Domain Guide](https://learn.microsoft.com/en-us/azure/static-web-apps/custom-domain)
2. **Set Up Monitoring**: [Application Insights Integration](https://learn.microsoft.com/en-us/azure/azure-functions/functions-monitoring)
3. **Enable Redis Cache**: When users exceed 1,000 ([Azure Cache for Redis Guide](https://learn.microsoft.com/en-us/azure/azure-cache-for-redis/quickstart-create-redis))
4. **Implement CI/CD**: Already configured in `.github/workflows/azure-deploy.yml`
5. **Run Load Tests**: [Azure Load Testing Guide](https://learn.microsoft.com/en-us/azure/load-testing/quickstart-create-and-run-load-test)

---

## Cost Estimation

### Development (Free Tier)

- Azure Static Web Apps: **Free** (100 GB bandwidth/month)
- Azure Functions: **Free** (1M requests/month)
- Azure SQL: **$5/month** (Basic tier)
- **Total**: ~$5/month

### Production (Basic Tier)

- Azure Static Web Apps: **$9/month** (Standard tier, 100 GB bandwidth)
- Azure Functions: **$17/month** (avg 5M requests/month)
- Azure SQL: **$5/month** (Basic tier, 2 GB storage)
- **Total**: ~$31/month

### Production (App Service Migration)

- App Service Plan B1: **$13/month** (1 core, 1.75 GB RAM)
- App Service (Backend): **$13/month**
- App Service (Frontend): **$13/month**
- Azure SQL: **$5/month**
- Azure CDN: **$30/month** (optional, for global CDN)
- **Total**: ~$44/month (without CDN) or ~$74/month (with CDN)

---

## Support

- **Documentation**: [docs/README.md](../../docs/README.md)
- **API Reference**: [OpenAPI Specification](./contracts/openapi.yaml)
- **GitHub Issues**: [Report a Bug](https://github.com/your-org/lottery-sandbox/issues)
- **Email**: support@lottery-sandbox.com
