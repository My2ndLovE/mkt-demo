# Security Documentation

## Overview

This document outlines the security measures implemented in the Multi-Level Agent Lottery Sandbox System.

## Authentication & Authorization

### JWT Authentication
- **Access Tokens**: 15-minute expiry, signed with HS256
- **Refresh Tokens**: 7-day expiry, stored in database with revocation support
- **Token Rotation**: Refresh tokens are rotated on use
- **Secure Storage**: Tokens should be stored in httpOnly cookies (frontend implementation)

### Password Security
- **Hashing**: bcrypt with cost factor 12
- **Requirements**: Minimum 8 characters (configurable in DTO validators)
- **Storage**: Only password hashes stored, never plain text
- **Reset**: Implement password reset with time-limited tokens (TODO)

### Role-Based Access Control (RBAC)
```typescript
// Three roles with hierarchical permissions
ADMIN > MODERATOR > AGENT

// Guards applied globally
- JwtAuthGuard: Validates JWT on all routes (except @Public())
- RolesGuard: Checks user roles against @Roles() decorator
```

### Row-Level Security (RLS)
Implemented via Prisma middleware:
```typescript
// Agents see only their own data
where.userId = currentUser.id

// Moderators see data in their organization
where.moderatorId = currentUser.id

// Admins see all data (no filtering)
```

## Data Protection

### Encryption at Rest
- **Database**: Azure SQL with TDE (Transparent Data Encryption)
- **API Keys**: AES-256-GCM encryption
  - 32-byte encryption key (256 bits)
  - Random IV per encryption operation
  - Authentication tag for integrity
- **Backups**: Encrypted by Azure

### Encryption in Transit
- **HTTPS**: Required for production (Azure handles SSL/TLS)
- **Database Connection**: Encrypted connection to Azure SQL
- **API Communication**: TLS 1.2+ enforced

### Sensitive Data Handling
```typescript
// API keys are never returned in plaintext
provider.apiKey = provider.apiKey ? '[ENCRYPTED]' : null;

// Passwords never returned via API
// Commission rates and limits visible based on role
```

## Input Validation

### DTO Validation
All endpoints use class-validator:
```typescript
@IsString()
@MinLength(3)
@MaxLength(50)
@Matches(/^[a-zA-Z0-9_]+$/)
username: string;
```

### Sanitization
- **SQL Injection**: Protected via Prisma ORM (parameterized queries)
- **XSS**: Frontend should sanitize HTML (DOMPurify recommended)
- **Path Traversal**: No file upload endpoints (reduced risk)

## API Security

### Rate Limiting
```typescript
// 100 requests per minute per IP
ThrottlerModule.forRoot([{
  ttl: 60000, // 60 seconds
  limit: 100
}])
```

### CORS Policy
```typescript
// Only allow configured origins
CORS_ORIGINS="http://localhost:5173,https://app.example.com"

// Credentials allowed (for cookies)
credentials: true
```

### Security Headers (Helmet.js)
```typescript
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000
```

## Audit Logging

### What We Log
- **Authentication**: Login, logout, token refresh
- **Bets**: Place, cancel (with amounts and users)
- **Results**: Create, update, delete (admin actions)
- **Providers**: All CRUD operations
- **Users**: Create, update, delete agents
- **Commissions**: Calculated automatically (no manual edit)

### Audit Log Structure
```typescript
{
  userId: number,
  action: string,
  entity: string,
  entityId: number,
  details: JSON,
  ipAddress: string,
  userAgent: string,
  moderatorId: number,
  timestamp: DateTime
}
```

### Retention
- Audit logs are append-only (immutable)
- Recommended retention: 7 years for financial data
- Implement archival process for old logs

## Session Management

### Refresh Token Handling
```typescript
// Store in database
RefreshToken {
  token: string (hashed),
  expiresAt: DateTime,
  revokedAt: DateTime?,
  userId: number
}

// Revoke on logout
UPDATE RefreshToken SET revokedAt = NOW() WHERE token = ?

// Cleanup expired tokens (scheduled job)
DELETE FROM RefreshToken WHERE expiresAt < NOW()
```

### Concurrent Sessions
- Multiple refresh tokens allowed per user
- Each token is independent
- Revoke all tokens on password change (TODO)

## Database Security

### Connection Security
```env
# Encrypted connection required
DATABASE_URL="sqlserver://...;encrypt=true;trustServerCertificate=false"
```

### Access Control
- Service accounts with minimum required permissions
- Read/write separation for reporting queries (optional)
- Regular credential rotation

### Injection Prevention
```typescript
// ✅ Safe: Prisma parameterized queries
await prisma.user.findMany({ where: { username } })

// ❌ Unsafe: Raw queries with string interpolation
await prisma.$executeRaw`SELECT * FROM users WHERE username = '${username}'`

// ✅ Safe: Raw queries with parameters
await prisma.$queryRaw`SELECT * FROM users WHERE username = ${username}`
```

## Azure Functions Security

### Managed Identity
```typescript
// Use Azure Managed Identity instead of connection strings
// TODO: Implement for production deployment
```

### Secrets Management
```typescript
// Production: Use Azure Key Vault
ENCRYPTION_KEY: Stored in Key Vault
JWT_SECRET: Stored in Key Vault
DATABASE_URL: Stored in Key Vault
```

### Function Access
- HTTP triggers use function keys (for admin endpoints)
- Timer triggers run automatically (no authentication needed)

## Environment Variables

### Critical Variables
```env
# Must be strong random values
JWT_SECRET=          # 256+ bits entropy
ENCRYPTION_KEY=      # Exactly 64 hex characters (32 bytes)

# Database credentials
DATABASE_URL=        # Use managed identity in production

# API keys
MAGAYO_API_KEY=      # Third-party lottery API
```

### Variable Management
- **Development**: .env files (gitignored)
- **Staging/Production**: Azure App Configuration or Key Vault
- **CI/CD**: GitHub Secrets or Azure DevOps Variables

## Vulnerability Management

### Dependencies
```bash
# Regular security audits
pnpm audit

# Automatic updates
# Use Dependabot or Renovate for dependency updates
```

### Known Vulnerabilities
- Monitor CVEs for NestJS, Prisma, and other dependencies
- Subscribe to security advisories
- Update promptly when patches available

## Incident Response

### Security Incident Checklist
1. **Detect**: Monitor audit logs, error logs, unusual activity
2. **Contain**: Revoke affected tokens, disable compromised accounts
3. **Investigate**: Review audit logs, check for data exfiltration
4. **Remediate**: Patch vulnerabilities, force password resets
5. **Document**: Create incident report, update procedures

### Emergency Procedures
```typescript
// Revoke all refresh tokens (force re-login)
await prisma.refreshToken.updateMany({
  where: {},
  data: { revokedAt: new Date() }
});

// Disable user account
await prisma.user.update({
  where: { id: userId },
  data: { active: false }
});

// Check audit logs for suspicious activity
await prisma.auditLog.findMany({
  where: {
    userId,
    timestamp: { gte: suspiciousDate }
  }
});
```

## Compliance

### Data Privacy
- **GDPR**: User data export and deletion on request (TODO)
- **PII**: Minimize collection, encrypt sensitive fields
- **Consent**: Terms of service acceptance (TODO)

### Financial Regulations
- **Audit Trail**: Complete, immutable logs
- **Transaction Records**: 7-year retention recommended
- **Anti-Money Laundering**: Weekly limit checks, unusual activity alerts (TODO)

## Security Best Practices

### For Developers
1. ✅ Never commit secrets to git
2. ✅ Use environment variables for configuration
3. ✅ Validate all inputs (DTO validators)
4. ✅ Use Prisma ORM (prevents SQL injection)
5. ✅ Check authorization on every endpoint
6. ✅ Log security-relevant events
7. ✅ Use HTTPS in production
8. ✅ Keep dependencies updated
9. ✅ Review code for security issues
10. ✅ Run security tests (npm audit)

### For Operators
1. ✅ Use strong passwords (admins)
2. ✅ Enable 2FA (TODO: implement)
3. ✅ Monitor audit logs regularly
4. ✅ Backup database regularly
5. ✅ Test restore procedures
6. ✅ Rotate credentials periodically
7. ✅ Use managed identities (Azure)
8. ✅ Enable Azure Security Center
9. ✅ Set up monitoring alerts
10. ✅ Review access permissions

## Security Checklist (Production)

- [ ] HTTPS enforced (redirect HTTP -> HTTPS)
- [ ] Database connection encrypted
- [ ] Secrets in Azure Key Vault
- [ ] Managed Identity enabled
- [ ] CORS configured for production domain
- [ ] Rate limiting enabled
- [ ] Audit logging working
- [ ] Error logging to Application Insights
- [ ] Security headers configured
- [ ] SQL injection testing completed
- [ ] XSS protection verified
- [ ] Authentication testing completed
- [ ] Authorization testing completed
- [ ] Penetration testing scheduled
- [ ] Incident response plan documented
- [ ] Backup and recovery tested

## Reporting Security Issues

If you discover a security vulnerability:

1. **DO NOT** create a public GitHub issue
2. Email: security@yourcompany.com
3. Include: Description, steps to reproduce, impact
4. Allow 90 days for fix before public disclosure

---

**Last Updated**: 2025-01-18
**Next Review**: 2025-04-18 (Quarterly)
