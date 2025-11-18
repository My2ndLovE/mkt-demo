import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { LimitsService } from './limits.service';
import { LimitsController } from './limits.controller';

/**
 * Limits Module
 *
 * Manages betting limits and restrictions (T114-T125, T227)
 *
 * Features:
 * - Weekly betting limit management
 * - Limit checking and deduction
 * - Automatic weekly limit reset (Monday 00:00 MYT)
 * - Limit adjustment (admin)
 * - Limit monitoring and alerts
 * - Reset operation logging
 *
 * Business Rules:
 * - weeklyUsed cannot exceed weeklyLimit
 * - Sub-agents cannot have limit > parent limit
 * - Limits reset every Monday 00:00 Asia/Kuala_Lumpur
 * - All operations are audited
 *
 * Dependencies:
 * - ScheduleModule: For automated weekly resets
 * - PrismaService: Database access
 *
 * @module LimitsModule
 */
@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [LimitsController],
  providers: [PrismaService, LimitsService],
  exports: [LimitsService],
})
export class LimitsModule {}
