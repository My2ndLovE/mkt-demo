import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BetsController } from './bets.controller';
import { BetsService } from './bets.service';
import { LimitsModule } from '../limits/limits.module';
import { AuditModule } from '../audit/audit.module';

/**
 * Bets Module
 *
 * Handles lottery betting operations (T051-T073, T220, T249-T254, T276-T289, T310-T311, T330, T337):
 * - Bet placement with multi-provider support (OPTION A)
 * - Bet validation (providers, game types, limits, draw dates)
 * - Receipt number generation
 * - Bet history and tracking with filtering
 * - Bet cancellation and refunds
 * - Win/loss calculation (processed by Results module)
 * - Weekly limit enforcement
 * - Comprehensive audit logging
 *
 * Integration Points:
 * - LimitsModule: checkLimit(), deductLimit(), refundLimit()
 * - AuditModule: log() for BET_PLACED and BET_CANCELLED events
 * - ResultsModule: Will call bets service to update bet statuses after draw
 * - CommissionsModule: Will calculate commissions based on bet outcomes
 *
 * @module BetsModule
 */
@Module({
  imports: [LimitsModule, AuditModule],
  controllers: [BetsController],
  providers: [PrismaService, BetsService],
  exports: [BetsService],
})
export class BetsModule {}
