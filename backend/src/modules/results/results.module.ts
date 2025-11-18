import { Module, forwardRef } from '@nestjs/common';
import { ResultsService } from './results.service';
import { ResultsController } from './results.controller';
import { ProvidersModule } from '../providers/providers.module';
import { BetsModule } from '../bets/bets.module';
import { CommissionsModule } from '../commissions/commissions.module';
import { PrizeCalculator } from './prize-calculator.service';

@Module({
  imports: [ProvidersModule, BetsModule, forwardRef(() => CommissionsModule)],
  controllers: [ResultsController],
  providers: [ResultsService, PrizeCalculator],
  exports: [ResultsService],
})
export class ResultsModule {}
