import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { OcrService } from './ocr.service';
import { OcrController } from './ocr.controller';
import { AuthModule } from '../auth/auth.module';
import { OcrMonitorService } from './ocr.monitor.service';

@Module({
  imports: [ConfigModule, AuthModule],
  controllers: [OcrController],
  providers: [OcrService, OcrMonitorService],
  exports: [OcrService],
})
export class OcrModule {}
