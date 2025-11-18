import { Module, Global } from '@nestjs/common';
import { EncryptionService } from './services/encryption.service';
import { AuditService } from './services/audit.service';

/**
 * Common module for shared services
 * Marked as @Global so it's available throughout the app
 */
@Global()
@Module({
  providers: [EncryptionService, AuditService],
  exports: [EncryptionService, AuditService],
})
export class CommonModule {}
