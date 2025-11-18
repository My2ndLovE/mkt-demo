import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { BetsModule } from '../bets/bets.module';
import { CommissionsModule } from '../commissions/commissions.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [BetsModule, CommissionsModule, UsersModule],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
