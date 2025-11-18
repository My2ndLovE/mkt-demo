import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

/**
 * EncryptionService - Secure encryption/decryption service for sensitive data
 *
 * @description
 * Provides AES-256-GCM authenticated encryption for sensitive data such as API keys,
 * tokens, and other confidential information before storing in the database.
 *
 * **Security Considerations:**
 * - Uses AES-256-GCM for authenticated encryption (AEAD) to prevent tampering
 * - Generates a unique IV (Initialization Vector) for each encryption operation
 * - IV is 12 bytes (96 bits) as recommended for GCM mode
 * - Authentication tag is 16 bytes (128 bits) for maximum security
 * - Key must be 32 bytes (256 bits) for AES-256
 * - Format: IV:CIPHERTEXT:AUTHTAG (all base64 encoded, colon-separated)
 *
 * **Key Management:**
 * - Primary: Azure Key Vault (production)
 * - Fallback: ENCRYPTION_KEY environment variable (dev/testing)
 * - Key must be a 32-byte hex string (64 hex characters)
 * - Key rotation: Store key version in encrypted data for future support
 *
 * **Error Handling:**
 * - Throws on missing encryption key
 * - Throws on invalid ciphertext format
 * - Throws on authentication tag verification failure
 * - All errors are logged for security auditing
 *
 * @example
 * ```typescript
 * const encrypted = await encryptionService.encrypt('my-api-key');
 * // Returns: "iv-base64:ciphertext-base64:authtag-base64"
 *
 * const decrypted = await encryptionService.decrypt(encrypted);
 * // Returns: "my-api-key"
 * ```
 */
@Injectable()
export class EncryptionService implements OnModuleInit {
  private readonly logger = new Logger(EncryptionService.name);
  private encryptionKey!: Buffer;

  /**
   * AES-256-GCM algorithm identifier
   */
  private readonly ALGORITHM = 'aes-256-gcm';

  /**
   * IV length in bytes (12 bytes = 96 bits, recommended for GCM)
   */
  private readonly IV_LENGTH = 12;

  /**
   * Authentication tag length in bytes (16 bytes = 128 bits)
   */
  private readonly AUTH_TAG_LENGTH = 16;

  /**
   * Encryption key length in bytes (32 bytes = 256 bits for AES-256)
   */
  private readonly KEY_LENGTH = 32;

  /**
   * Separator for encrypted data components (IV:CIPHERTEXT:AUTHTAG)
   */
  private readonly SEPARATOR = ':';

  constructor(private readonly configService: ConfigService) {}

  /**
   * Initialize the encryption service and validate the encryption key
   *
   * @throws {Error} If encryption key is missing or invalid
   */
  async onModuleInit(): Promise<void> {
    await this.initializeEncryptionKey();
    this.logger.log('EncryptionService initialized successfully');
  }

  /**
   * Initialize and validate the encryption key from environment or Azure Key Vault
   *
   * @private
   * @throws {Error} If encryption key is missing or has invalid length
   */
  private async initializeEncryptionKey(): Promise<void> {
    // TODO: Add Azure Key Vault integration for production
    const encryptionKeyHex = this.configService.get<string>('ENCRYPTION_KEY');

    if (!encryptionKeyHex) {
      const errorMsg =
        'ENCRYPTION_KEY environment variable is not set. This is required for encrypting sensitive data.';
      this.logger.error(errorMsg);
      throw new Error(errorMsg);
    }

    // Validate hex string format
    if (!/^[0-9a-fA-F]+$/.test(encryptionKeyHex)) {
      const errorMsg = 'ENCRYPTION_KEY must be a valid hex string';
      this.logger.error(errorMsg);
      throw new Error(errorMsg);
    }

    // Convert hex string to buffer
    this.encryptionKey = Buffer.from(encryptionKeyHex, 'hex');

    // Validate key length
    if (this.encryptionKey.length !== this.KEY_LENGTH) {
      const errorMsg = `ENCRYPTION_KEY must be exactly ${this.KEY_LENGTH} bytes (${this.KEY_LENGTH * 2} hex characters). Got ${this.encryptionKey.length} bytes.`;
      this.logger.error(errorMsg);
      throw new Error(errorMsg);
    }

    this.logger.debug('Encryption key validated successfully');
  }

  /**
   * Encrypt plaintext using AES-256-GCM
   *
   * @param plaintext - The plaintext string to encrypt
   * @returns Promise resolving to encrypted string in format "IV:CIPHERTEXT:AUTHTAG" (base64 encoded)
   *
   * @throws {Error} If encryption fails or plaintext is empty
   *
   * @example
   * ```typescript
   * const encrypted = await encryptionService.encrypt('my-secret-api-key');
   * // Returns: "YWJjZGVmZ2hpams=:ZW5jcnlwdGVkZGF0YQ==:YXV0aHRhZzEyMzQ1Ng=="
   * ```
   */
  async encrypt(plaintext: string): Promise<string> {
    if (!plaintext || plaintext.length === 0) {
      throw new Error('Cannot encrypt empty plaintext');
    }

    try {
      // Generate a random IV for this encryption operation
      const iv = crypto.randomBytes(this.IV_LENGTH);

      // Create cipher with AES-256-GCM
      const cipher = crypto.createCipheriv(this.ALGORITHM, this.encryptionKey, iv);

      // Encrypt the plaintext
      let ciphertext = cipher.update(plaintext, 'utf8', 'base64');
      ciphertext += cipher.final('base64');

      // Get the authentication tag
      const authTag = cipher.getAuthTag();

      // Format: IV:CIPHERTEXT:AUTHTAG (all base64 encoded)
      const encrypted = [iv.toString('base64'), ciphertext, authTag.toString('base64')].join(
        this.SEPARATOR,
      );

      this.logger.debug('Data encrypted successfully');
      return encrypted;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Encryption failed', error instanceof Error ? error.stack : String(error));
      throw new Error(`Encryption failed: ${errorMessage}`);
    }
  }

  /**
   * Decrypt ciphertext using AES-256-GCM
   *
   * @param ciphertext - The encrypted string in format "IV:CIPHERTEXT:AUTHTAG" (base64 encoded)
   * @returns Promise resolving to decrypted plaintext string
   *
   * @throws {Error} If ciphertext format is invalid, authentication fails, or decryption fails
   *
   * @example
   * ```typescript
   * const decrypted = await encryptionService.decrypt(
   *   "YWJjZGVmZ2hpams=:ZW5jcnlwdGVkZGF0YQ==:YXV0aHRhZzEyMzQ1Ng=="
   * );
   * // Returns: "my-secret-api-key"
   * ```
   */
  async decrypt(ciphertext: string): Promise<string> {
    if (!ciphertext || ciphertext.length === 0) {
      throw new Error('Cannot decrypt empty ciphertext');
    }

    try {
      // Parse the encrypted data format: IV:CIPHERTEXT:AUTHTAG
      const parts = ciphertext.split(this.SEPARATOR);

      if (parts.length !== 3) {
        throw new Error(
          `Invalid ciphertext format. Expected format: IV${this.SEPARATOR}CIPHERTEXT${this.SEPARATOR}AUTHTAG. Got ${parts.length} parts.`,
        );
      }

      const [ivBase64, encryptedData, authTagBase64] = parts;

      // Decode base64 components
      const iv = Buffer.from(ivBase64, 'base64');
      const authTag = Buffer.from(authTagBase64, 'base64');

      // Validate IV length
      if (iv.length !== this.IV_LENGTH) {
        throw new Error(
          `Invalid IV length. Expected ${this.IV_LENGTH} bytes, got ${iv.length} bytes.`,
        );
      }

      // Validate auth tag length
      if (authTag.length !== this.AUTH_TAG_LENGTH) {
        throw new Error(
          `Invalid authentication tag length. Expected ${this.AUTH_TAG_LENGTH} bytes, got ${authTag.length} bytes.`,
        );
      }

      // Create decipher with AES-256-GCM
      const decipher = crypto.createDecipheriv(this.ALGORITHM, this.encryptionKey, iv);

      // Set the authentication tag for verification
      decipher.setAuthTag(authTag);

      // Decrypt the ciphertext
      let plaintext = decipher.update(encryptedData, 'base64', 'utf8');
      plaintext += decipher.final('utf8');

      this.logger.debug('Data decrypted successfully');
      return plaintext;
    } catch (error: unknown) {
      // Don't log the actual ciphertext for security reasons
      this.logger.error('Decryption failed', error instanceof Error ? error.stack : String(error));

      const errorMessage = error instanceof Error ? error.message : String(error);

      // Provide more specific error messages for common issues
      if (errorMessage.includes('Unsupported state or unable to authenticate data')) {
        throw new Error(
          'Decryption failed: Authentication tag verification failed. Data may have been tampered with.',
        );
      }

      if (errorMessage.includes('Invalid ciphertext format')) {
        throw error; // Re-throw our own format errors
      }

      throw new Error(`Decryption failed: ${errorMessage}`);
    }
  }

  /**
   * Rotate encryption key (future implementation)
   *
   * @description
   * This method will support key rotation by:
   * 1. Decrypting data with old key
   * 2. Re-encrypting with new key
   * 3. Updating key version metadata
   *
   * @param oldCiphertext - Data encrypted with old key
   * @param newKeyVersion - Version identifier for new key
   * @returns Promise resolving to re-encrypted data with new key
   *
   * @todo Implement key versioning in encrypted data format
   * @todo Add Azure Key Vault key rotation support
   */
  async rotateKey(_oldCiphertext: string, _newKeyVersion: string): Promise<string> {
    // Placeholder for future key rotation implementation
    throw new Error('Key rotation not yet implemented');
  }

  /**
   * Validate that a string is properly encrypted
   *
   * @param data - The string to validate
   * @returns true if data appears to be encrypted in correct format
   */
  isEncrypted(data: string): boolean {
    if (!data || typeof data !== 'string') {
      return false;
    }

    const parts = data.split(this.SEPARATOR);
    if (parts.length !== 3) {
      return false;
    }

    try {
      // Validate that all parts are valid base64
      const [ivBase64, _ciphertext, authTagBase64] = parts;
      const iv = Buffer.from(ivBase64, 'base64');
      const authTag = Buffer.from(authTagBase64, 'base64');

      // Check expected lengths
      return iv.length === this.IV_LENGTH && authTag.length === this.AUTH_TAG_LENGTH;
    } catch {
      return false;
    }
  }
}
