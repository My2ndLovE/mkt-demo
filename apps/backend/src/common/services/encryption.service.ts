import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

/**
 * Encryption service for sensitive data (API keys, etc.)
 * Uses AES-256-GCM with Azure Key Vault for key management
 *
 * For now, uses environment variable encryption key
 * TODO: Integrate with Azure Key Vault in production
 */
@Injectable()
export class EncryptionService {
  private readonly logger = new Logger(EncryptionService.name);
  private readonly algorithm = 'aes-256-gcm';
  private readonly encryptionKey: Buffer;

  constructor(private configService: ConfigService) {
    const keyString = this.configService.get<string>('ENCRYPTION_KEY');

    if (!keyString) {
      throw new Error('ENCRYPTION_KEY environment variable is required');
    }

    // Encryption key must be 32 bytes for AES-256
    this.encryptionKey = Buffer.from(keyString, 'hex');

    if (this.encryptionKey.length !== 32) {
      throw new Error('ENCRYPTION_KEY must be 32 bytes (64 hex characters)');
    }

    this.logger.log('🔐 Encryption service initialized');
  }

  /**
   * Encrypt sensitive data (e.g., API keys)
   * Returns base64-encoded string: iv:authTag:encryptedData
   */
  encrypt(plaintext: string): string {
    try {
      // Generate random initialization vector (12 bytes for GCM)
      const iv = crypto.randomBytes(12);

      // Create cipher
      const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);

      // Encrypt
      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      // Get authentication tag (16 bytes for GCM)
      const authTag = cipher.getAuthTag();

      // Return as: iv:authTag:encryptedData (all in hex)
      return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    } catch (error) {
      this.logger.error('Encryption failed', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt sensitive data
   * Expects base64-encoded string: iv:authTag:encryptedData
   */
  decrypt(ciphertext: string): string {
    try {
      // Parse the encrypted string
      const parts = ciphertext.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format');
      }

      const [ivHex, authTagHex, encryptedHex] = parts;
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');

      // Create decipher
      const decipher = crypto.createDecipheriv(this.algorithm, this.encryptionKey, iv);
      decipher.setAuthTag(authTag);

      // Decrypt
      let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      this.logger.error('Decryption failed', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Hash sensitive data (one-way, for comparison)
   * Uses SHA-256
   */
  hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Generate secure random token
   * @param length Number of random bytes (default 32)
   */
  generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }
}
