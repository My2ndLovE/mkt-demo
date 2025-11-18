import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { ResultsService } from './results.service';
import { ResultsController } from './results.controller';

/**
 * Results Module
 *
 * Manages lottery draw results (T142-T158, T215-T224)
 *
 * Features:
 * - Manual result entry (admin/moderator)
 * - Automatic result synchronization from external API
 * - Result validation and editing
 * - Bet processing and winner determination
 * - Commission generation integration
 * - Scheduled result sync (Wed/Sat/Sun 19:30 MYT)
 *
 * Business Rules:
 * - Draw number must be unique per provider/game/date
 * - Results can only be edited before processing
 * - Bet processing is atomic (transaction)
 * - Win amounts calculated based on prize tiers
 * - Commissions auto-generated after processing
 *
 * Dependencies:
 * - ScheduleModule: For automated result syncing
 * - PrismaService: Database access
 * - CommissionsService: Commission calculation (injected when needed)
 *
 * @module ResultsModule
 */
@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [ResultsController],
  providers: [PrismaService, ResultsService],
  exports: [ResultsService],
})
export class ResultsModule {}
