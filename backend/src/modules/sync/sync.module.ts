import { Module, forwardRef } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { SyncService } from './sync.service';
import { SyncController } from './sync.controller';
import { ProvidersModule } from '../providers/providers.module';
import { ResultsModule } from '../results/results.module';

@Module({
  imports: [
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 5,
    }),
    ProvidersModule,
    forwardRef(() => ResultsModule),
  ],
  controllers: [SyncController],
  providers: [SyncService],
  exports: [SyncService],
})
export class SyncModule {}
