import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EncryptionService } from './encryption.service';

/**
 * EncryptionModule - Global module providing encryption services
 *
 * @description
 * This module provides encryption/decryption services for sensitive data across the application.
 * It is marked as @Global() so it can be injected anywhere without importing the module.
 *
 * **Usage:**
 * The EncryptionService is automatically available in all modules without explicit imports.
 * Simply inject it where needed:
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class ServiceProviderService {
 *   constructor(private readonly encryptionService: EncryptionService) {}
 *
 *   async saveApiKey(providerId: string, apiKey: string) {
 *     const encryptedKey = await this.encryptionService.encrypt(apiKey);
 *     // Store encryptedKey in database
 *   }
 * }
 * ```
 *
 * **Security Notes:**
 * - Encryption key is loaded from environment variable ENCRYPTION_KEY
 * - Key must be 32 bytes (64 hex characters) for AES-256
 * - Service validates key on module initialization
 * - Failures are logged for security auditing
 *
 * @see EncryptionService for encryption implementation details
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [EncryptionService],
  exports: [EncryptionService],
})
export class EncryptionModule {}
