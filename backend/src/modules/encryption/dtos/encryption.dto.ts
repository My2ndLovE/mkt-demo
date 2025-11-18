import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for encryption requests
 *
 * @description
 * Used when explicitly encrypting data through an API endpoint.
 * In most cases, encryption is handled internally by services.
 */
export class EncryptDto {
  @ApiProperty({
    description: 'The plaintext data to encrypt',
    example: 'my-secret-api-key',
  })
  @IsString()
  @IsNotEmpty()
  plaintext!: string;
}

/**
 * DTO for decryption requests
 *
 * @description
 * Used when explicitly decrypting data through an API endpoint.
 * In most cases, decryption is handled internally by services.
 */
export class DecryptDto {
  @ApiProperty({
    description: 'The encrypted data to decrypt (format: IV:CIPHERTEXT:AUTHTAG)',
    example: 'YWJjZGVmZ2hpams=:ZW5jcnlwdGVkZGF0YQ==:YXV0aHRhZzEyMzQ1Ng==',
  })
  @IsString()
  @IsNotEmpty()
  ciphertext!: string;
}

/**
 * DTO for encrypted data response
 *
 * @description
 * Returned when data is successfully encrypted.
 */
export class EncryptedDataDto {
  @ApiProperty({
    description: 'The encrypted data in format: IV:CIPHERTEXT:AUTHTAG (base64 encoded)',
    example: 'YWJjZGVmZ2hpams=:ZW5jcnlwdGVkZGF0YQ==:YXV0aHRhZzEyMzQ1Ng==',
  })
  encrypted!: string;

  @ApiProperty({
    description: 'Timestamp when the encryption was performed',
    example: '2025-11-18T10:30:00.000Z',
  })
  timestamp!: Date;
}

/**
 * DTO for decrypted data response
 *
 * @description
 * Returned when data is successfully decrypted.
 * WARNING: This should only be used in secure, internal contexts.
 */
export class DecryptedDataDto {
  @ApiProperty({
    description: 'The decrypted plaintext data',
    example: 'my-secret-api-key',
  })
  plaintext!: string;

  @ApiProperty({
    description: 'Timestamp when the decryption was performed',
    example: '2025-11-18T10:30:00.000Z',
  })
  timestamp!: Date;
}

/**
 * DTO for key rotation request
 *
 * @description
 * Used when rotating encryption keys (future implementation).
 */
export class RotateKeyDto {
  @ApiProperty({
    description: 'The data encrypted with the old key',
    example: 'YWJjZGVmZ2hpams=:ZW5jcnlwdGVkZGF0YQ==:YXV0aHRhZzEyMzQ1Ng==',
  })
  @IsString()
  @IsNotEmpty()
  oldCiphertext!: string;

  @ApiProperty({
    description: 'The version identifier for the new key',
    example: 'v2',
  })
  @IsString()
  @IsNotEmpty()
  newKeyVersion!: string;
}
