import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EncryptionModule } from '../encryption/encryption.module';
import { ProvidersService } from './providers.service';
import { ProvidersController } from './providers.controller';

/**
 * Providers Module
 *
 * Manages lottery game providers and configurations (T090-T096)
 *
 * Features:
 * - Provider CRUD operations
 * - Game type management
 * - Provider settings and rules
 * - Draw schedule configuration
 * - Provider status monitoring
 * - Provider integration and API management
 * - Encrypted API key storage (T237)
 *
 * Dependencies:
 * - EncryptionModule: For API key encryption/decryption
 * - PrismaService: Database access
 *
 * @module ProvidersModule
 */
@Module({
  imports: [EncryptionModule],
  controllers: [ProvidersController],
  providers: [PrismaService, ProvidersService],
  exports: [ProvidersService],
})
export class ProvidersModule {}
