# Architecture Decisions

## AD-001: Multi-Provider Betting Architecture

**Decision Date**: 2025-11-18
**Status**: ✅ APPROVED
**Decision**: OPTION A - Single bet with provider array

### Context
Agents need to place bets on multiple providers simultaneously (e.g., Magnum + Sports Toto + Damacai for the same numbers).

### Options Considered
- **OPTION A**: Single Bet record with `providers` as JSON array
- **OPTION B**: Multiple Bet records, one per provider

### Decision: OPTION A

#### Rationale
1. **Single Receipt**: One bet = one receipt number (simpler for agents)
2. **Atomic Operations**: Easier transaction handling
3. **Simpler Commission Flow**: Commission calculated once per bet
4. **Better UX**: Single bet form, single confirmation
5. **Cleaner History**: Bet history shows one entry instead of 3+

#### Implementation
```prisma
model Bet {
  // Change providerId from String to String[]
  providers String @db.NVarChar(Max) // JSON: ["M", "P", "T"]

  // Amount is total across all providers
  amount Decimal @db.Money

  // Results tracked per provider
  results String @db.NVarChar(Max) // JSON: [{"provider": "M", "status": "WON", "amount": 2500}, ...]
}
```

#### Trade-offs
- ❌ More complex result processing (need to match multiple providers)
- ✅ Much simpler user experience
- ✅ Cleaner data model
- ✅ Easier weekly limit tracking

---

## AD-002: API Key Encryption Strategy

**Decision Date**: 2025-11-18
**Status**: ✅ APPROVED
**Decision**: AES-256-GCM with Azure Key Vault

### Context
Service provider API keys must be stored securely in the database.

### Decision
- Encryption Algorithm: AES-256-GCM
- Key Storage: Azure Key Vault (not in .env)
- Key Rotation: Manual procedure documented

#### Implementation
```typescript
// Encryption service
class EncryptionService {
  private async getEncryptionKey(): Promise<string> {
    // Fetch from Azure Key Vault
    const keyVaultUrl = process.env.KEY_VAULT_URL;
    const credential = new DefaultAzureCredential();
    const client = new SecretClient(keyVaultUrl, credential);
    const secret = await client.getSecret('encryption-key');
    return secret.value;
  }

  async encrypt(plaintext: string): Promise<string> {
    const key = await this.getEncryptionKey();
    // AES-256-GCM encryption logic
    return encryptedData;
  }

  async decrypt(ciphertext: string): Promise<string> {
    const key = await this.getEncryptionKey();
    // AES-256-GCM decryption logic
    return plaintext;
  }
}
```

---

## AD-003: Row-Level Security Implementation

**Decision Date**: 2025-11-18
**Status**: ✅ APPROVED
**Decision**: Prisma Middleware (not SQL Server RLS)

### Context
Moderators must only see their own organization's data.

### Decision
Implement data isolation using Prisma middleware instead of SQL Server Row-Level Security policies.

#### Rationale
1. **Better with Prisma**: Native TypeScript integration
2. **Easier Testing**: Can mock middleware in tests
3. **More Flexible**: Can add complex logic beyond simple filters
4. **Cross-Database**: Works if we migrate from SQL Server
5. **Better Debugging**: Clearer error messages

#### Implementation
```typescript
// Prisma middleware
prisma.$use(async (params, next) => {
  const user = getCurrentUser(); // From request context

  if (user.role === 'ADMIN') {
    return next(params); // Admins bypass RLS
  }

  if (user.role === 'MODERATOR' || user.role === 'AGENT') {
    const modelsWithIsolation = ['Bet', 'User', 'Commission'];

    if (modelsWithIsolation.includes(params.model)) {
      if (params.action.startsWith('find')) {
        params.args.where = {
          ...params.args.where,
          moderatorId: user.role === 'MODERATOR' ? user.id : user.moderatorId,
        };
      }

      if (['create', 'update'].includes(params.action)) {
        const moderatorId = user.role === 'MODERATOR' ? user.id : user.moderatorId;
        if (params.args.data.moderatorId && params.args.data.moderatorId !== moderatorId) {
          throw new ForbiddenException('Cannot access other moderator data');
        }
      }
    }
  }

  return next(params);
});
```

---

## AD-004: Caching Strategy

**Decision Date**: 2025-11-18
**Status**: ✅ APPROVED
**Decision**: In-memory cache with @nestjs/cache-manager

### Context
Need to cache service providers and hierarchy paths for performance.

### Decision
- **Phase 1 (MVP)**: In-memory cache with cache-manager
- **Phase 2 (Scale)**: Redis when concurrent users > 1000

#### TTL Strategy
- Service Providers: 5 minutes (rarely change)
- Hierarchy Paths: 30 minutes (change on agent creation)
- Draw Results: 24 hours (immutable after finalization)

#### Cache Invalidation
- Provider update/delete: Invalidate provider cache
- Agent creation: Invalidate hierarchy cache for affected agents
- Manual endpoint: `/api/v1/cache/clear` (admin only)

---

**Last Updated**: 2025-11-18
