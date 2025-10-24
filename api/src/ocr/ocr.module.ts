import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { OcrService } from './ocr.service';
import { OcrController } from './ocr.controller';
import { AuthModule } from '../auth/auth.module';
import { OcrMonitorService } from './ocr.monitor.service';
import { OcrStorageService } from './ocr-storage.service';
import { OcrTextractService } from './ocr-textract.service';
import { OcrMetricsService } from './ocr-metrics.service';

@Module({
  imports: [ConfigModule, AuthModule],
  controllers: [OcrController],
  providers: [OcrService, OcrMonitorService, OcrStorageService, OcrTextractService, OcrMetricsService],
  exports: [OcrService],
})
export class OcrModule {}
