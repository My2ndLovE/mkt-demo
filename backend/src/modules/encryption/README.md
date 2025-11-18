# Encryption Module

Secure encryption/decryption service for sensitive data storage using AES-256-GCM authenticated encryption.

## Overview

The Encryption Module provides enterprise-grade encryption services for protecting sensitive data such as API keys, tokens, and confidential information before storing them in the database.

**Key Features:**
- AES-256-GCM authenticated encryption (AEAD)
- Unique IV generation for each encryption operation
- Tamper detection via authentication tags
- Secure key management with environment variable fallback
- Comprehensive error handling and logging
- 100% test coverage

## Architecture

### Algorithm: AES-256-GCM

**Why AES-256-GCM?**
- **AES-256**: Industry-standard symmetric encryption with 256-bit keys
- **GCM Mode**: Galois/Counter Mode provides both encryption and authentication
- **AEAD**: Authenticated Encryption with Associated Data prevents tampering
- **Performance**: Hardware-accelerated on modern CPUs

**Security Properties:**
- **Confidentiality**: Data cannot be read without the key
- **Integrity**: Any tampering is detected via authentication tag
- **Authenticity**: Verifies data hasn't been modified or replaced

### Encrypted Data Format

```
IV:CIPHERTEXT:AUTHTAG
```

All components are base64-encoded and separated by colons.

**Example:**
```
YWJjZGVmZ2hpams=:ZW5jcnlwdGVkZGF0YQ==:YXV0aHRhZzEyMzQ1Ng==
```

**Components:**
- **IV**: 12 bytes (96 bits) - Random initialization vector, unique per encryption
- **CIPHERTEXT**: Variable length - Encrypted plaintext
- **AUTHTAG**: 16 bytes (128 bits) - Authentication tag for tamper detection

## Setup

### 1. Environment Configuration

Add to your `.env` file:

```bash
# Generate a secure 32-byte (256-bit) key
# Linux/Mac:
openssl rand -hex 32

# Node.js:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Add to .env:
ENCRYPTION_KEY=your-64-character-hex-string-here
```

**CRITICAL:**
- The key MUST be exactly 32 bytes (64 hex characters)
- Never commit the key to version control
- Use different keys for dev/staging/production
- Store production keys in Azure Key Vault

### 2. Module Registration

The `EncryptionModule` is marked as `@Global()`, so it's automatically available throughout the application:

```typescript
// app.module.ts
import { EncryptionModule } from './modules/encryption';

@Module({
  imports: [
    ConfigModule.forRoot(),
    EncryptionModule, // Add this
    // ... other modules
  ],
})
export class AppModule {}
```

## Usage

### Basic Encryption/Decryption

```typescript
import { Injectable } from '@nestjs/common';
import { EncryptionService } from '@modules/encryption';

@Injectable()
export class ServiceProviderService {
  constructor(private readonly encryptionService: EncryptionService) {}

  async saveApiKey(providerId: string, apiKey: string): Promise<void> {
    // Encrypt before storing in database
    const encryptedKey = await this.encryptionService.encrypt(apiKey);

    await this.prisma.serviceProvider.update({
      where: { id: providerId },
      data: { apiKeyEncrypted: encryptedKey },
    });
  }

  async getApiKey(providerId: string): Promise<string> {
    const provider = await this.prisma.serviceProvider.findUnique({
      where: { id: providerId },
    });

    // Decrypt when reading from database
    return await this.encryptionService.decrypt(provider.apiKeyEncrypted);
  }
}
```

### Checking If Data Is Encrypted

```typescript
const data = 'YWJjZGVmZ2hpams=:ZW5jcnlwdGVkZGF0YQ==:YXV0aHRhZzEyMzQ1Ng==';

if (this.encryptionService.isEncrypted(data)) {
  const plaintext = await this.encryptionService.decrypt(data);
  console.log('Decrypted:', plaintext);
} else {
  console.log('Data is not encrypted');
}
```

### Error Handling

```typescript
try {
  const encrypted = await this.encryptionService.encrypt(apiKey);
  // Store encrypted data
} catch (error) {
  this.logger.error('Failed to encrypt API key', error.stack);
  throw new InternalServerErrorException('Failed to secure API key');
}

try {
  const decrypted = await this.encryptionService.decrypt(encryptedData);
  return decrypted;
} catch (error) {
  this.logger.error('Failed to decrypt data', error.stack);
  throw new InternalServerErrorException('Failed to retrieve secure data');
}
```

## Security Best Practices

### Key Management

**Development/Testing:**
```bash
# Generate a new key for local development
openssl rand -hex 32 > .encryption-key
export ENCRYPTION_KEY=$(cat .encryption-key)

# Add .encryption-key to .gitignore
echo ".encryption-key" >> .gitignore
```

**Production:**
- Store keys in Azure Key Vault
- Use managed identities for access
- Rotate keys regularly (quarterly)
- Audit key access logs

### Database Schema

**DO:**
```typescript
// Store encrypted data as TEXT or VARCHAR
apiKeyEncrypted  String  // Encrypted: IV:CIPHERTEXT:AUTHTAG
```

**DON'T:**
```typescript
// Never store plaintext sensitive data
apiKey  String  // Plaintext - INSECURE!
```

### Migration from Plaintext

If you have existing plaintext data:

```typescript
async migrateToEncrypted(): Promise<void> {
  const providers = await this.prisma.serviceProvider.findMany({
    where: {
      apiKey: { not: null },           // Has plaintext key
      apiKeyEncrypted: null,           // No encrypted key yet
    },
  });

  for (const provider of providers) {
    const encrypted = await this.encryptionService.encrypt(provider.apiKey);

    await this.prisma.serviceProvider.update({
      where: { id: provider.id },
      data: {
        apiKeyEncrypted: encrypted,
        apiKey: null, // Clear plaintext
      },
    });
  }
}
```

## Testing

### Running Tests

```bash
# Run encryption service tests
npm test -- encryption.service.spec.ts

# With coverage
npm run test:cov -- encryption.service.spec.ts
```

### Test Coverage

The module includes comprehensive tests covering:

✅ Module initialization and key validation
✅ Encryption/decryption round trips
✅ Invalid ciphertext handling
✅ Authentication tag verification
✅ Tamper detection
✅ Edge cases (empty strings, unicode, long data)
✅ Concurrent operations
✅ Error conditions

**Current Coverage: 100%**

### Sample Test

```typescript
describe('EncryptionService', () => {
  it('should perform encryption/decryption round trip', async () => {
    const plaintext = 'my-secret-api-key';

    // Encrypt
    const encrypted = await service.encrypt(plaintext);
    expect(encrypted).toBeDefined();
    expect(encrypted).not.toBe(plaintext);

    // Decrypt
    const decrypted = await service.decrypt(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  it('should detect tampered data', async () => {
    const encrypted = await service.encrypt('original-data');

    // Tamper with ciphertext
    const parts = encrypted.split(':');
    parts[1] = 'tampered';
    const tampered = parts.join(':');

    // Should throw on authentication failure
    await expect(service.decrypt(tampered)).rejects.toThrow(
      'Authentication tag verification failed'
    );
  });
});
```

## Troubleshooting

### Error: ENCRYPTION_KEY environment variable is not set

**Solution:** Add `ENCRYPTION_KEY` to your `.env` file:
```bash
ENCRYPTION_KEY=<64-character-hex-string>
```

### Error: ENCRYPTION_KEY must be exactly 32 bytes

**Solution:** Ensure your key is a valid 64-character hex string:
```bash
# Generate a valid key
openssl rand -hex 32
```

### Error: Authentication tag verification failed

**Possible Causes:**
- Data was tampered with
- Using wrong encryption key
- Data corruption during storage/transmission
- Key was rotated without re-encrypting data

**Solution:**
- Verify you're using the correct key
- Check data integrity in database
- Re-encrypt data if key was changed

### Error: Invalid ciphertext format

**Possible Causes:**
- Data is not encrypted
- Data format is corrupted
- Wrong data type (not a string)

**Solution:**
```typescript
if (!this.encryptionService.isEncrypted(data)) {
  throw new Error('Data is not encrypted');
}
```

## Future Enhancements

### Planned Features

- [ ] **Azure Key Vault Integration** (T237)
  - Fetch encryption keys from Azure Key Vault
  - Support for managed identities
  - Automatic key rotation

- [ ] **Key Rotation** (T239)
  - Seamless key rotation without downtime
  - Version tracking in encrypted data
  - Batch re-encryption jobs

- [ ] **Audit Logging** (T240)
  - Log all encryption/decryption operations
  - Integration with audit module
  - Compliance reporting

- [ ] **Multiple Key Support**
  - Support for different keys per tenant
  - Key hierarchy (master + data keys)
  - Key derivation functions

## References

- [NIST SP 800-38D: GCM Mode](https://csrc.nist.gov/publications/detail/sp/800-38d/final)
- [Node.js Crypto Documentation](https://nodejs.org/api/crypto.html)
- [OWASP Cryptographic Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)
- [Azure Key Vault Best Practices](https://learn.microsoft.com/en-us/azure/key-vault/general/best-practices)

## Support

For questions or issues:
- Check the troubleshooting section above
- Review the test suite for usage examples
- Contact the security team for key management questions
- See `encryption.service.ts` JSDoc comments for detailed API documentation
