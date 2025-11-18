import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CommissionsService } from './commissions.service';
import { CommissionsController } from './commissions.controller';

/**
 * Commissions Module
 *
 * Handles multi-level commission calculations and distribution (T126-T141)
 *
 * Features:
 * - Multi-level commission calculation using recursive CTE
 * - Precise decimal arithmetic using decimal.js
 * - Commission history and tracking
 * - Downline commission reporting
 * - Commission statistics
 * - Automatic commission generation on bet settlement
 *
 * Business Rules:
 * - Commissions calculated on both wins and losses
 * - Each upline level gets commission from remaining P/L
 * - Calculation stops when remaining < 0.01
 * - Uses decimal.js to prevent floating point errors
 * - Batch insert for performance
 *
 * Algorithm:
 * 1. Get upline chain via recursive CTE
 * 2. For each level: commission = remaining * (rate / 100)
 * 3. Subtract commission from remaining for next level
 * 4. Batch insert all commissions
 *
 * Dependencies:
 * - PrismaService: Database access
 * - decimal.js: Precise decimal arithmetic
 *
 * @module CommissionsModule
 */
@Module({
  imports: [],
  controllers: [CommissionsController],
  providers: [PrismaService, CommissionsService],
  exports: [CommissionsService],
})
export class CommissionsModule {}
