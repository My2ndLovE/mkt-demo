# Deployment Guide

Complete deployment guide for the Multi-Level Agent Lottery Sandbox System on Azure.

## Prerequisites

### Required Accounts
- Azure subscription with billing enabled
- GitHub account (for CI/CD)
- Domain name (optional, for custom domain)

### Required Tools
```bash
# Azure CLI
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
az login

# Node.js & pnpm
node --version  # v20+
pnpm --version  # v8.15+

# Azure Functions Core Tools
npm install -g azure-functions-core-tools@4
```

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│                  Azure Cloud                     │
├─────────────────────────────────────────────────┤
│                                                  │
│  ┌──────────────────┐      ┌─────────────────┐ │
│  │  Static Web App  │      │   App Service   │ │
│  │   (Frontend)     │◄────►│   (Backend)     │ │
│  └──────────────────┘      └─────────────────┘ │
│                                     │            │
│                            ┌────────▼─────────┐ │
│                            │   Azure SQL DB   │ │
│                            └──────────────────┘ │
│                                                  │
│  ┌──────────────────┐      ┌─────────────────┐ │
│  │ Azure Functions  │      │  Key Vault      │ │
│  │ (Scheduled Jobs) │◄────►│  (Secrets)      │ │
│  └──────────────────┘      └─────────────────┘ │
│                                                  │
└─────────────────────────────────────────────────┘
```

## Step 1: Azure Resource Setup

### Create Resource Group
```bash
az group create \
  --name lottery-rg \
  --location eastasia
```

### Create Azure SQL Database
```bash
# Create SQL Server
az sql server create \
  --name lottery-sql-server \
  --resource-group lottery-rg \
  --location eastasia \
  --admin-user sqladmin \
  --admin-password 'YourStrong!Passw0rd123'

# Configure firewall (allow Azure services)
az sql server firewall-rule create \
  --resource-group lottery-rg \
  --server lottery-sql-server \
  --name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0

# Create database
az sql db create \
  --resource-group lottery-rg \
  --server lottery-sql-server \
  --name lottery-db \
  --service-objective S0 \
  --backup-storage-redundancy Zone

# Get connection string
az sql db show-connection-string \
  --client ado.net \
  --name lottery-db \
  --server lottery-sql-server
```

### Create Key Vault
```bash
az keyvault create \
  --name lottery-keyvault \
  --resource-group lottery-rg \
  --location eastasia

# Store secrets
az keyvault secret set \
  --vault-name lottery-keyvault \
  --name DatabaseUrl \
  --value "Server=tcp:lottery-sql-server.database.windows.net,1433;Database=lottery-db;..."

az keyvault secret set \
  --vault-name lottery-keyvault \
  --name JwtSecret \
  --value "$(openssl rand -hex 32)"

az keyvault secret set \
  --vault-name lottery-keyvault \
  --name EncryptionKey \
  --value "$(openssl rand -hex 32)"
```

## Step 2: Backend Deployment (App Service)

### Create App Service Plan
```bash
az appservice plan create \
  --name lottery-app-plan \
  --resource-group lottery-rg \
  --location eastasia \
  --sku B1 \
  --is-linux
```

### Create Web App
```bash
az webapp create \
  --name lottery-backend \
  --resource-group lottery-rg \
  --plan lottery-app-plan \
  --runtime "NODE:20-lts"
```

### Configure App Settings
```bash
# Set environment variables
az webapp config appsettings set \
  --name lottery-backend \
  --resource-group lottery-rg \
  --settings \
    NODE_ENV=production \
    PORT=8080 \
    DATABASE_URL="@Microsoft.KeyVault(SecretUri=https://lottery-keyvault.vault.azure.net/secrets/DatabaseUrl/)" \
    JWT_SECRET="@Microsoft.KeyVault(SecretUri=https://lottery-keyvault.vault.azure.net/secrets/JwtSecret/)" \
    JWT_ACCESS_EXPIRY="15m" \
    JWT_REFRESH_EXPIRY="7d" \
    ENCRYPTION_KEY="@Microsoft.KeyVault(SecretUri=https://lottery-keyvault.vault.azure.net/secrets/EncryptionKey/)" \
    CORS_ORIGINS="https://lottery-frontend.azurestaticapps.net" \
    RATE_LIMIT_TTL=60 \
    RATE_LIMIT_MAX=100
```

### Enable Managed Identity
```bash
# Enable system-assigned managed identity
az webapp identity assign \
  --name lottery-backend \
  --resource-group lottery-rg

# Get principal ID
PRINCIPAL_ID=$(az webapp identity show \
  --name lottery-backend \
  --resource-group lottery-rg \
  --query principalId \
  --output tsv)

# Grant Key Vault access
az keyvault set-policy \
  --name lottery-keyvault \
  --object-id $PRINCIPAL_ID \
  --secret-permissions get list
```

### Deploy Backend
```bash
cd apps/backend

# Build
pnpm build

# Create deployment package
zip -r deploy.zip dist node_modules package.json prisma

# Deploy
az webapp deployment source config-zip \
  --name lottery-backend \
  --resource-group lottery-rg \
  --src deploy.zip

# Run migrations
az webapp ssh \
  --name lottery-backend \
  --resource-group lottery-rg \
  --command "cd /home/site/wwwroot && npx prisma migrate deploy"
```

## Step 3: Frontend Deployment (Static Web App)

### Create Static Web App
```bash
az staticwebapp create \
  --name lottery-frontend \
  --resource-group lottery-rg \
  --location eastasia \
  --source https://github.com/yourusername/lottery-sandbox \
  --branch main \
  --app-location "/apps/frontend" \
  --api-location "" \
  --output-location "build/client"
```

### Configure Environment
Create `apps/frontend/staticwebapp.config.json`:
```json
{
  "routes": [
    {
      "route": "/api/*",
      "rewrite": "https://lottery-backend.azurewebsites.net/api/v1/*"
    },
    {
      "route": "/*",
      "serve": "/index.html",
      "statusCode": 200
    }
  ],
  "navigationFallback": {
    "rewrite": "/index.html",
    "exclude": ["/images/*.{png,jpg,gif}", "/css/*"]
  },
  "globalHeaders": {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "SAMEORIGIN",
    "X-XSS-Protection": "1; mode=block"
  }
}
```

### Deploy Frontend
```bash
cd apps/frontend

# Build
pnpm build

# Deploy (automatic via GitHub Actions)
# Or manually:
az staticwebapp deploy \
  --name lottery-frontend \
  --resource-group lottery-rg \
  --source build/client
```

## Step 4: Azure Functions Deployment

### Create Function App
```bash
# Create Storage Account (required for Functions)
az storage account create \
  --name lotterystorage \
  --resource-group lottery-rg \
  --location eastasia \
  --sku Standard_LRS

# Create Function App
az functionapp create \
  --name lottery-functions \
  --resource-group lottery-rg \
  --storage-account lotterystorage \
  --consumption-plan-location eastasia \
  --runtime node \
  --runtime-version 20 \
  --functions-version 4
```

### Configure Function Settings
```bash
az functionapp config appsettings set \
  --name lottery-functions \
  --resource-group lottery-rg \
  --settings \
    WEBSITE_TIME_ZONE="Asia/Kuala_Lumpur" \
    DATABASE_URL="@Microsoft.KeyVault(SecretUri=https://lottery-keyvault.vault.azure.net/secrets/DatabaseUrl/)" \
    MAGAYO_API_KEY="your-api-key" \
    MAGAYO_API_ENDPOINT="https://api.magayo.com/lottery/results"
```

### Deploy Functions
```bash
cd apps/functions

# Build
pnpm build

# Deploy
func azure functionapp publish lottery-functions
```

## Step 5: Database Migration

### Run Migrations
```bash
# From local machine (VPN or firewall rule required)
cd apps/backend

# Production DATABASE_URL in .env
export DATABASE_URL="Server=tcp:lottery-sql-server.database.windows.net,1433;..."

# Run migrations
pnpm prisma migrate deploy

# Seed initial data (optional)
pnpm prisma db seed
```

## Step 6: Monitoring & Logging

### Application Insights
```bash
# Create Application Insights
az monitor app-insights component create \
  --app lottery-insights \
  --location eastasia \
  --resource-group lottery-rg

# Get instrumentation key
INSIGHTS_KEY=$(az monitor app-insights component show \
  --app lottery-insights \
  --resource-group lottery-rg \
  --query instrumentationKey \
  --output tsv)

# Add to backend
az webapp config appsettings set \
  --name lottery-backend \
  --resource-group lottery-rg \
  --settings \
    APPINSIGHTS_INSTRUMENTATIONKEY=$INSIGHTS_KEY \
    APPLICATIONINSIGHTS_CONNECTION_STRING="InstrumentationKey=$INSIGHTS_KEY"
```

### Alerts
```bash
# Create alert for high error rate
az monitor metrics alert create \
  --name high-error-rate \
  --resource-group lottery-rg \
  --scopes /subscriptions/{subscription-id}/resourceGroups/lottery-rg/providers/Microsoft.Web/sites/lottery-backend \
  --condition "total requests/server errors > 10" \
  --description "Alert when error rate exceeds 10%" \
  --evaluation-frequency 5m \
  --window-size 15m
```

## Step 7: Custom Domain (Optional)

### Backend Custom Domain
```bash
# Add custom domain
az webapp config hostname add \
  --webapp-name lottery-backend \
  --resource-group lottery-rg \
  --hostname api.yourdomain.com

# Enable HTTPS
az webapp config ssl bind \
  --name lottery-backend \
  --resource-group lottery-rg \
  --certificate-thumbprint {thumbprint} \
  --ssl-type SNI
```

### Frontend Custom Domain
```bash
# Add custom domain to Static Web App
az staticwebapp hostname set \
  --name lottery-frontend \
  --resource-group lottery-rg \
  --hostname www.yourdomain.com

# HTTPS is automatic with Static Web Apps
```

## Step 8: Backup & Disaster Recovery

### Database Backup
```bash
# Azure SQL automatic backups (enabled by default)
# Retention: 7 days (Basic/Standard), 35 days (Premium)

# Manual backup
az sql db export \
  --resource-group lottery-rg \
  --server lottery-sql-server \
  --name lottery-db \
  --admin-user sqladmin \
  --admin-password 'YourStrong!Passw0rd123' \
  --storage-key-type SharedAccessKey \
  --storage-key {storage-key} \
  --storage-uri https://lotterystorage.blob.core.windows.net/backups/lottery-db.bacpac
```

### Restore from Backup
```bash
az sql db import \
  --resource-group lottery-rg \
  --server lottery-sql-server \
  --name lottery-db-restored \
  --admin-user sqladmin \
  --admin-password 'YourStrong!Passw0rd123' \
  --storage-key-type SharedAccessKey \
  --storage-key {storage-key} \
  --storage-uri https://lotterystorage.blob.core.windows.net/backups/lottery-db.bacpac
```

## Step 9: CI/CD Pipeline (GitHub Actions)

### Backend Workflow
Create `.github/workflows/backend-deploy.yml`:
```yaml
name: Deploy Backend

on:
  push:
    branches: [main]
    paths: ['apps/backend/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install pnpm
        run: npm install -g pnpm@8.15.0

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build
        run: cd apps/backend && pnpm build

      - name: Deploy to Azure
        uses: azure/webapps-deploy@v2
        with:
          app-name: lottery-backend
          publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
          package: apps/backend
```

### Frontend Workflow
```yaml
name: Deploy Frontend

on:
  push:
    branches: [main]
    paths: ['apps/frontend/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Build And Deploy
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          repo_token: ${{ secrets.GITHUB_TOKEN }}
          action: "upload"
          app_location: "/apps/frontend"
          output_location: "build/client"
```

## Step 10: Verification

### Health Checks
```bash
# Backend health
curl https://lottery-backend.azurewebsites.net/api/v1/health

# Frontend health
curl https://lottery-frontend.azurestaticapps.net/health

# Functions health (weekly reset)
az functionapp function show \
  --name lottery-functions \
  --resource-group lottery-rg \
  --function-name weekly-reset
```

### Test Endpoints
```bash
# Login
curl -X POST https://lottery-backend.azurewebsites.net/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin@123456"}'

# Get providers (public)
curl https://lottery-backend.azurewebsites.net/api/v1/providers
```

## Troubleshooting

### Common Issues

**Database Connection Failed**
```bash
# Check firewall rules
az sql server firewall-rule list \
  --resource-group lottery-rg \
  --server lottery-sql-server

# Add your IP
az sql server firewall-rule create \
  --resource-group lottery-rg \
  --server lottery-sql-server \
  --name MyIP \
  --start-ip-address YOUR_IP \
  --end-ip-address YOUR_IP
```

**Application Won't Start**
```bash
# Check logs
az webapp log tail \
  --name lottery-backend \
  --resource-group lottery-rg

# Check environment variables
az webapp config appsettings list \
  --name lottery-backend \
  --resource-group lottery-rg
```

**Functions Not Triggering**
```bash
# Check function logs
func azure functionapp logstream lottery-functions

# Verify timezone
az functionapp config show \
  --name lottery-functions \
  --resource-group lottery-rg \
  --query timeZone
```

## Cost Estimation (Monthly)

- **Azure SQL Database (S0)**: ~$15
- **App Service (B1)**: ~$13
- **Static Web App (Standard)**: $9
- **Functions (Consumption)**: ~$0-5
- **Application Insights**: ~$2-10
- **Key Vault**: ~$0.03
- **Storage**: ~$1

**Total**: ~$40-60/month

## Security Checklist

- [ ] HTTPS enabled on all endpoints
- [ ] Managed Identity configured
- [ ] Key Vault secrets configured
- [ ] Database firewall configured
- [ ] CORS configured for production domain
- [ ] Application Insights monitoring enabled
- [ ] Alerts configured
- [ ] Backup schedule verified
- [ ] Disaster recovery tested

## Support

For deployment issues:
- Azure Support Portal
- GitHub Issues
- Internal DevOps team

---

**Last Updated**: 2025-01-18
