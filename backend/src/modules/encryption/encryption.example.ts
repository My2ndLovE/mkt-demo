/**
 * Encryption Service Usage Examples
 *
 * @description
 * This file demonstrates common patterns for using the EncryptionService
 * to protect sensitive data in your NestJS application.
 *
 * @note This is an example file for reference - not meant to be imported or executed directly.
 */

import { Injectable } from '@nestjs/common';
import { EncryptionService } from './encryption.service';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Example 1: Encrypting API Keys for Service Providers
 *
 * This example shows how to encrypt API keys before storing them in the database
 * and decrypt them when needed for API calls.
 */
@Injectable()
export class ServiceProviderExampleService {
  constructor(
    private readonly encryptionService: EncryptionService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Store a service provider with encrypted API key
   */
  async createServiceProvider(name: string, apiKey: string): Promise<void> {
    // Encrypt the API key before storing
    const encryptedApiKey = await this.encryptionService.encrypt(apiKey);

    await this.prisma.serviceProvider.create({
      data: {
        name,
        apiKeyEncrypted: encryptedApiKey,
        isActive: true,
      },
    });
  }

  /**
   * Retrieve and use the decrypted API key
   */
  async callExternalApi(providerId: string, endpoint: string): Promise<any> {
    // Fetch the provider with encrypted API key
    const provider = await this.prisma.serviceProvider.findUnique({
      where: { id: providerId },
    });

    if (!provider) {
      throw new Error('Provider not found');
    }

    // Decrypt the API key for use
    const apiKey = await this.encryptionService.decrypt(provider.apiKeyEncrypted);

    // Use the decrypted API key to call external API
    const response = await fetch(endpoint, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    return response.json();
  }

  /**
   * Update API key with encryption
   */
  async updateApiKey(providerId: string, newApiKey: string): Promise<void> {
    const encryptedApiKey = await this.encryptionService.encrypt(newApiKey);

    await this.prisma.serviceProvider.update({
      where: { id: providerId },
      data: {
        apiKeyEncrypted: encryptedApiKey,
      },
    });
  }
}

/**
 * Example 2: Encrypting User Tokens
 *
 * This example demonstrates encrypting OAuth tokens or refresh tokens.
 */
@Injectable()
export class UserTokenExampleService {
  constructor(
    private readonly encryptionService: EncryptionService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Store encrypted OAuth tokens
   */
  async storeOAuthTokens(userId: string, accessToken: string, refreshToken: string): Promise<void> {
    const encryptedAccessToken = await this.encryptionService.encrypt(accessToken);
    const encryptedRefreshToken = await this.encryptionService.encrypt(refreshToken);

    await this.prisma.userToken.create({
      data: {
        userId,
        accessTokenEncrypted: encryptedAccessToken,
        refreshTokenEncrypted: encryptedRefreshToken,
        expiresAt: new Date(Date.now() + 3600000), // 1 hour
      },
    });
  }

  /**
   * Retrieve decrypted tokens for API calls
   */
  async getAccessToken(userId: string): Promise<string> {
    const token = await this.prisma.userToken.findFirst({
      where: {
        userId,
        expiresAt: { gt: new Date() }, // Not expired
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!token) {
      throw new Error('No valid token found');
    }

    return await this.encryptionService.decrypt(token.accessTokenEncrypted);
  }
}

/**
 * Example 3: Batch Encryption Operations
 *
 * This example shows how to encrypt multiple values efficiently.
 */
@Injectable()
export class BatchEncryptionExampleService {
  constructor(private readonly encryptionService: EncryptionService) {}

  /**
   * Encrypt multiple API keys in parallel
   */
  async encryptMultipleKeys(keys: string[]): Promise<string[]> {
    // Encrypt all keys in parallel for better performance
    const encryptPromises = keys.map((key) => this.encryptionService.encrypt(key));
    return await Promise.all(encryptPromises);
  }

  /**
   * Decrypt multiple values in parallel
   */
  async decryptMultipleValues(encryptedValues: string[]): Promise<string[]> {
    const decryptPromises = encryptedValues.map((value) => this.encryptionService.decrypt(value));
    return await Promise.all(decryptPromises);
  }
}

/**
 * Example 4: Validation Before Decryption
 *
 * This example demonstrates checking if data is encrypted before attempting decryption.
 */
@Injectable()
export class ValidationExampleService {
  constructor(private readonly encryptionService: EncryptionService) {}

  /**
   * Safely get decrypted value with validation
   */
  async getDecryptedValue(data: string): Promise<string> {
    // Check if the data is encrypted
    if (!this.encryptionService.isEncrypted(data)) {
      throw new Error('Data is not encrypted - potential security issue');
    }

    // Decrypt the validated encrypted data
    return await this.encryptionService.decrypt(data);
  }

  /**
   * Handle both encrypted and plaintext data (migration scenario)
   */
  async getValueWithMigrationSupport(data: string): Promise<string> {
    if (this.encryptionService.isEncrypted(data)) {
      // Data is already encrypted, decrypt it
      return await this.encryptionService.decrypt(data);
    } else {
      // Data is plaintext, return as-is (but log for migration tracking)
      console.warn('Found unencrypted data - needs migration');
      return data;
    }
  }
}

/**
 * Example 5: Error Handling Best Practices
 *
 * This example shows proper error handling for encryption operations.
 */
@Injectable()
export class ErrorHandlingExampleService {
  constructor(private readonly encryptionService: EncryptionService) {}

  /**
   * Encrypt with proper error handling
   */
  async encryptWithErrorHandling(data: string): Promise<string | null> {
    try {
      return await this.encryptionService.encrypt(data);
    } catch (error) {
      console.error('Failed to encrypt data:', error);
      // Log to monitoring service
      // Alert security team
      return null;
    }
  }

  /**
   * Decrypt with proper error handling
   */
  async decryptWithErrorHandling(encryptedData: string): Promise<string | null> {
    try {
      return await this.encryptionService.decrypt(encryptedData);
    } catch (error) {
      console.error('Failed to decrypt data:', error);

      // Different error handling based on error type
      if (error.message.includes('Authentication tag verification failed')) {
        // Data was tampered with - security incident!
        console.error('SECURITY ALERT: Data tampering detected');
        // Alert security team
        // Log to security audit system
      } else if (error.message.includes('Invalid ciphertext format')) {
        // Data format is wrong - possible corruption
        console.error('Data corruption detected');
      }

      return null;
    }
  }
}

/**
 * Example 6: Testing Encrypted Data
 *
 * This example shows how to test services that use encryption.
 */
describe('Testing with EncryptionService', () => {
  let service: ServiceProviderExampleService;
  let encryptionService: EncryptionService;

  beforeEach(async () => {
    // Create test module with real EncryptionService
    const module = await Test.createTestingModule({
      providers: [
        ServiceProviderExampleService,
        EncryptionService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(() => '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'),
          },
        },
        PrismaService,
      ],
    }).compile();

    service = module.get<ServiceProviderExampleService>(ServiceProviderExampleService);
    encryptionService = module.get<EncryptionService>(EncryptionService);
  });

  it('should encrypt and store API key', async () => {
    const apiKey = 'test-api-key-123';

    await service.createServiceProvider('Test Provider', apiKey);

    // Verify the key is encrypted in database (not plaintext)
    const provider = await prisma.serviceProvider.findFirst({
      where: { name: 'Test Provider' },
    });

    expect(provider.apiKeyEncrypted).not.toBe(apiKey);
    expect(encryptionService.isEncrypted(provider.apiKeyEncrypted)).toBe(true);

    // Verify we can decrypt it back
    const decrypted = await encryptionService.decrypt(provider.apiKeyEncrypted);
    expect(decrypted).toBe(apiKey);
  });
});
