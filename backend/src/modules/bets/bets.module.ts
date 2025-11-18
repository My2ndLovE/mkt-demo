import { Module } from '@nestjs/common';
import { BetsService } from './bets.service';
import { BetsController } from './bets.controller';
import { LimitsModule } from '../limits/limits.module';
import { ProvidersModule } from '../providers/providers.module';
import { BetNumberValidator } from './validators/bet-number.validator';
import { DrawCutoffValidator } from './validators/draw-cutoff.validator';
import { IBoxValidator } from './validators/ibox.validator';

@Module({
  imports: [LimitsModule, ProvidersModule],
  controllers: [BetsController],
  providers: [
    BetsService,
    BetNumberValidator,
    DrawCutoffValidator,
    IBoxValidator,
  ],
  exports: [BetsService],
})
export class BetsModule {}
