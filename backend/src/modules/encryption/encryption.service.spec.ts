import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EncryptionService } from './encryption.service';
import * as crypto from 'crypto';

describe('EncryptionService', () => {
  let service: EncryptionService;
  let configService: ConfigService;

  // Generate a valid 32-byte (256-bit) encryption key for testing
  const VALID_ENCRYPTION_KEY = crypto.randomBytes(32).toString('hex');

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EncryptionService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'ENCRYPTION_KEY') {
                return VALID_ENCRYPTION_KEY;
              }
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<EncryptionService>(EncryptionService);
    configService = module.get<ConfigService>(ConfigService);

    // Initialize the service
    await service.onModuleInit();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Module Initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should initialize successfully with valid encryption key', async () => {
      const newService = new EncryptionService(configService);
      await expect(newService.onModuleInit()).resolves.not.toThrow();
    });

    it('should throw error if ENCRYPTION_KEY is not set', async () => {
      const mockConfigService = {
        get: jest.fn(() => null),
      } as any;

      const newService = new EncryptionService(mockConfigService);

      await expect(newService.onModuleInit()).rejects.toThrow(
        'ENCRYPTION_KEY environment variable is not set',
      );
    });

    it('should throw error if ENCRYPTION_KEY is not valid hex', async () => {
      const mockConfigService = {
        get: jest.fn(() => 'not-a-valid-hex-string!!!'),
      } as any;

      const newService = new EncryptionService(mockConfigService);

      await expect(newService.onModuleInit()).rejects.toThrow(
        'ENCRYPTION_KEY must be a valid hex string',
      );
    });

    it('should throw error if ENCRYPTION_KEY has invalid length', async () => {
      const mockConfigService = {
        get: jest.fn(() => 'abcd1234'), // Only 4 bytes
      } as any;

      const newService = new EncryptionService(mockConfigService);

      await expect(newService.onModuleInit()).rejects.toThrow(
        'ENCRYPTION_KEY must be exactly 32 bytes',
      );
    });

    it('should throw error if ENCRYPTION_KEY is too short', async () => {
      const shortKey = crypto.randomBytes(16).toString('hex'); // Only 16 bytes
      const mockConfigService = {
        get: jest.fn(() => shortKey),
      } as any;

      const newService = new EncryptionService(mockConfigService);

      await expect(newService.onModuleInit()).rejects.toThrow(
        'ENCRYPTION_KEY must be exactly 32 bytes (64 hex characters). Got 16 bytes.',
      );
    });
  });

  describe('encrypt()', () => {
    it('should encrypt plaintext successfully', async () => {
      const plaintext = 'my-secret-api-key';
      const encrypted = await service.encrypt(plaintext);

      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe('string');
      expect(encrypted).not.toBe(plaintext);
    });

    it('should return encrypted string in correct format (IV:CIPHERTEXT:AUTHTAG)', async () => {
      const plaintext = 'test-data';
      const encrypted = await service.encrypt(plaintext);

      const parts = encrypted.split(':');
      expect(parts).toHaveLength(3);

      // Validate base64 encoding
      expect(() => Buffer.from(parts[0], 'base64')).not.toThrow();
      expect(() => Buffer.from(parts[1], 'base64')).not.toThrow();
      expect(() => Buffer.from(parts[2], 'base64')).not.toThrow();

      // Validate IV length (12 bytes)
      const iv = Buffer.from(parts[0], 'base64');
      expect(iv.length).toBe(12);

      // Validate auth tag length (16 bytes)
      const authTag = Buffer.from(parts[2], 'base64');
      expect(authTag.length).toBe(16);
    });

    it('should generate different IV for each encryption', async () => {
      const plaintext = 'same-plaintext';
      const encrypted1 = await service.encrypt(plaintext);
      const encrypted2 = await service.encrypt(plaintext);

      expect(encrypted1).not.toBe(encrypted2);

      // Verify IVs are different
      const iv1 = encrypted1.split(':')[0];
      const iv2 = encrypted2.split(':')[0];
      expect(iv1).not.toBe(iv2);
    });

    it('should encrypt different plaintexts to different ciphertexts', async () => {
      const plaintext1 = 'api-key-1';
      const plaintext2 = 'api-key-2';

      const encrypted1 = await service.encrypt(plaintext1);
      const encrypted2 = await service.encrypt(plaintext2);

      expect(encrypted1).not.toBe(encrypted2);
    });

    it('should throw error when encrypting empty string', async () => {
      await expect(service.encrypt('')).rejects.toThrow('Cannot encrypt empty plaintext');
    });

    it('should throw error when encrypting null', async () => {
      await expect(service.encrypt(null as any)).rejects.toThrow('Cannot encrypt empty plaintext');
    });

    it('should throw error when encrypting undefined', async () => {
      await expect(service.encrypt(undefined as any)).rejects.toThrow(
        'Cannot encrypt empty plaintext',
      );
    });

    it('should encrypt long strings successfully', async () => {
      const longPlaintext = 'a'.repeat(10000);
      const encrypted = await service.encrypt(longPlaintext);

      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe('string');
    });

    it('should encrypt special characters successfully', async () => {
      const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`';
      const encrypted = await service.encrypt(specialChars);

      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe('string');
    });

    it('should encrypt unicode characters successfully', async () => {
      const unicode = '你好世界 🚀 مرحبا العالم';
      const encrypted = await service.encrypt(unicode);

      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe('string');
    });
  });

  describe('decrypt()', () => {
    it('should decrypt ciphertext successfully', async () => {
      const plaintext = 'my-secret-api-key';
      const encrypted = await service.encrypt(plaintext);
      const decrypted = await service.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should perform encryption/decryption round trip successfully', async () => {
      const testCases = [
        'simple-api-key',
        'complex-api-key-with-special-chars-!@#$%',
        'very-long-api-key-'.repeat(100),
        '123456789',
        'MixedCaseAPIKey123',
        'unicode-你好-🚀',
      ];

      for (const plaintext of testCases) {
        const encrypted = await service.encrypt(plaintext);
        const decrypted = await service.decrypt(encrypted);
        expect(decrypted).toBe(plaintext);
      }
    });

    it('should throw error when decrypting empty string', async () => {
      await expect(service.decrypt('')).rejects.toThrow('Cannot decrypt empty ciphertext');
    });

    it('should throw error when decrypting null', async () => {
      await expect(service.decrypt(null as any)).rejects.toThrow('Cannot decrypt empty ciphertext');
    });

    it('should throw error when decrypting undefined', async () => {
      await expect(service.decrypt(undefined as any)).rejects.toThrow(
        'Cannot decrypt empty ciphertext',
      );
    });

    it('should throw error when ciphertext has invalid format (missing parts)', async () => {
      const invalidCiphertext = 'only-one-part';

      await expect(service.decrypt(invalidCiphertext)).rejects.toThrow('Invalid ciphertext format');
    });

    it('should throw error when ciphertext has only two parts', async () => {
      const invalidCiphertext = 'part1:part2';

      await expect(service.decrypt(invalidCiphertext)).rejects.toThrow(
        'Invalid ciphertext format. Expected format: IV:CIPHERTEXT:AUTHTAG. Got 2 parts.',
      );
    });

    it('should throw error when ciphertext has too many parts', async () => {
      const invalidCiphertext = 'part1:part2:part3:part4';

      await expect(service.decrypt(invalidCiphertext)).rejects.toThrow('Invalid ciphertext format');
    });

    it('should throw error when IV has invalid length', async () => {
      const shortIV = Buffer.from('short').toString('base64');
      const validCiphertext = 'YWJjZGVm';
      const validAuthTag = Buffer.from('a'.repeat(16)).toString('base64');

      const invalidCiphertext = `${shortIV}:${validCiphertext}:${validAuthTag}`;

      await expect(service.decrypt(invalidCiphertext)).rejects.toThrow('Invalid IV length');
    });

    it('should throw error when auth tag has invalid length', async () => {
      const validIV = Buffer.from('a'.repeat(12)).toString('base64');
      const validCiphertext = 'YWJjZGVm';
      const shortAuthTag = Buffer.from('short').toString('base64');

      const invalidCiphertext = `${validIV}:${validCiphertext}:${shortAuthTag}`;

      await expect(service.decrypt(invalidCiphertext)).rejects.toThrow(
        'Invalid authentication tag length',
      );
    });

    it('should throw error when authentication tag verification fails (tampered data)', async () => {
      const plaintext = 'original-data';
      const encrypted = await service.encrypt(plaintext);

      // Tamper with the ciphertext portion
      const parts = encrypted.split(':');
      parts[1] = Buffer.from('tampered-data').toString('base64');
      const tamperedCiphertext = parts.join(':');

      await expect(service.decrypt(tamperedCiphertext)).rejects.toThrow(
        'Authentication tag verification failed',
      );
    });

    it('should throw error when IV is tampered', async () => {
      const plaintext = 'original-data';
      const encrypted = await service.encrypt(plaintext);

      // Tamper with the IV
      const parts = encrypted.split(':');
      const tamperedIV = Buffer.from('a'.repeat(12)).toString('base64');
      parts[0] = tamperedIV;
      const tamperedCiphertext = parts.join(':');

      await expect(service.decrypt(tamperedCiphertext)).rejects.toThrow('Decryption failed');
    });

    it('should throw error when auth tag is tampered', async () => {
      const plaintext = 'original-data';
      const encrypted = await service.encrypt(plaintext);

      // Tamper with the auth tag
      const parts = encrypted.split(':');
      const tamperedAuthTag = Buffer.from('b'.repeat(16)).toString('base64');
      parts[2] = tamperedAuthTag;
      const tamperedCiphertext = parts.join(':');

      await expect(service.decrypt(tamperedCiphertext)).rejects.toThrow(
        'Authentication tag verification failed',
      );
    });

    it('should throw error when base64 encoding is invalid', async () => {
      const invalidCiphertext = 'not-base64!!!:also-not-base64!!!:invalid!!!';

      await expect(service.decrypt(invalidCiphertext)).rejects.toThrow('Decryption failed');
    });
  });

  describe('isEncrypted()', () => {
    it('should return true for properly encrypted data', async () => {
      const plaintext = 'test-data';
      const encrypted = await service.encrypt(plaintext);

      expect(service.isEncrypted(encrypted)).toBe(true);
    });

    it('should return false for plaintext', () => {
      expect(service.isEncrypted('plaintext-api-key')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(service.isEncrypted('')).toBe(false);
    });

    it('should return false for null', () => {
      expect(service.isEncrypted(null as any)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(service.isEncrypted(undefined as any)).toBe(false);
    });

    it('should return false for non-string values', () => {
      expect(service.isEncrypted(123 as any)).toBe(false);
      expect(service.isEncrypted({} as any)).toBe(false);
      expect(service.isEncrypted([] as any)).toBe(false);
    });

    it('should return false for invalid format (missing parts)', () => {
      expect(service.isEncrypted('only-one-part')).toBe(false);
      expect(service.isEncrypted('two:parts')).toBe(false);
    });

    it('should return false for invalid IV length', () => {
      const shortIV = Buffer.from('short').toString('base64');
      const validCiphertext = 'YWJjZGVm';
      const validAuthTag = Buffer.from('a'.repeat(16)).toString('base64');

      expect(service.isEncrypted(`${shortIV}:${validCiphertext}:${validAuthTag}`)).toBe(false);
    });

    it('should return false for invalid auth tag length', () => {
      const validIV = Buffer.from('a'.repeat(12)).toString('base64');
      const validCiphertext = 'YWJjZGVm';
      const shortAuthTag = Buffer.from('short').toString('base64');

      expect(service.isEncrypted(`${validIV}:${validCiphertext}:${shortAuthTag}`)).toBe(false);
    });

    it('should return false for invalid base64', () => {
      expect(service.isEncrypted('not-base64!!!:also-not!!!:invalid!!!')).toBe(false);
    });
  });

  describe('rotateKey()', () => {
    it('should throw error as key rotation is not yet implemented', async () => {
      const plaintext = 'test-data';
      const encrypted = await service.encrypt(plaintext);

      await expect(service.rotateKey(encrypted, 'v2')).rejects.toThrow(
        'Key rotation not yet implemented',
      );
    });
  });

  describe('Security Tests', () => {
    it('should use different IVs for encrypting the same data twice', async () => {
      const plaintext = 'same-data';
      const encrypted1 = await service.encrypt(plaintext);
      const encrypted2 = await service.encrypt(plaintext);

      // IVs should be different
      const iv1 = encrypted1.split(':')[0];
      const iv2 = encrypted2.split(':')[0];
      expect(iv1).not.toBe(iv2);

      // Both should decrypt to the same plaintext
      expect(await service.decrypt(encrypted1)).toBe(plaintext);
      expect(await service.decrypt(encrypted2)).toBe(plaintext);
    });

    it('should detect any tampering with ciphertext components', async () => {
      const plaintext = 'sensitive-data';
      const encrypted = await service.encrypt(plaintext);
      const parts = encrypted.split(':');

      // Test tampering with each component
      const tamperTests = [
        { index: 0, name: 'IV' },
        { index: 1, name: 'ciphertext' },
        { index: 2, name: 'auth tag' },
      ];

      for (const test of tamperTests) {
        const tamperedParts = [...parts];
        // Flip one bit in the base64 encoded component
        const original = tamperedParts[test.index];
        const firstChar = original[0];
        const tamperedChar = firstChar === 'A' ? 'B' : 'A';
        tamperedParts[test.index] = tamperedChar + original.slice(1);

        const tamperedCiphertext = tamperedParts.join(':');
        await expect(service.decrypt(tamperedCiphertext)).rejects.toThrow();
      }
    });

    it('should maintain data integrity for binary data converted to string', async () => {
      // Test with data that might contain null bytes or special characters
      const binaryData = Buffer.from([0, 1, 2, 255, 254, 253]).toString('base64');
      const encrypted = await service.encrypt(binaryData);
      const decrypted = await service.decrypt(encrypted);

      expect(decrypted).toBe(binaryData);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long plaintexts', async () => {
      const longPlaintext = 'x'.repeat(100000);
      const encrypted = await service.encrypt(longPlaintext);
      const decrypted = await service.decrypt(encrypted);

      expect(decrypted).toBe(longPlaintext);
    });

    it('should handle single character plaintext', async () => {
      const singleChar = 'x';
      const encrypted = await service.encrypt(singleChar);
      const decrypted = await service.decrypt(encrypted);

      expect(decrypted).toBe(singleChar);
    });

    it('should handle plaintexts with only whitespace', async () => {
      const whitespace = '   \t\n  ';
      const encrypted = await service.encrypt(whitespace);
      const decrypted = await service.decrypt(encrypted);

      expect(decrypted).toBe(whitespace);
    });

    it('should handle plaintexts with newlines and special formatting', async () => {
      const formatted = 'Line 1\nLine 2\r\nLine 3\tTabbed';
      const encrypted = await service.encrypt(formatted);
      const decrypted = await service.decrypt(encrypted);

      expect(decrypted).toBe(formatted);
    });
  });

  describe('Performance', () => {
    it('should encrypt and decrypt 100 times without errors', async () => {
      const plaintext = 'performance-test-data';

      for (let i = 0; i < 100; i++) {
        const encrypted = await service.encrypt(plaintext);
        const decrypted = await service.decrypt(encrypted);
        expect(decrypted).toBe(plaintext);
      }
    });

    it('should handle concurrent encryption operations', async () => {
      const plaintexts = Array.from({ length: 50 }, (_, i) => `plaintext-${i}`);

      const encryptPromises = plaintexts.map((p) => service.encrypt(p));
      const encrypted = await Promise.all(encryptPromises);

      const decryptPromises = encrypted.map((e) => service.decrypt(e));
      const decrypted = await Promise.all(decryptPromises);

      expect(decrypted).toEqual(plaintexts);
    });
  });
});
