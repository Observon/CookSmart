import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { OcrService } from './ocr.service';
import { OcrController } from './ocr.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [ConfigModule, AuthModule],
  controllers: [OcrController],
  providers: [OcrService],
  exports: [OcrService],
})
export class OcrModule {}
