import {
  Controller,
  Get,
  Post,
  UploadedFile as NestUploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';

import { AnalyzeInvoiceResponseDto } from './dto/analyze-invoice-response.dto';
import { OcrMetricsResponseDto } from './dto/ocr-metrics-response.dto';
import { OcrService } from './ocr.service';
import type { OcrUploadedFile } from './ocr.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('OCR')
@ApiBearerAuth()
@Controller('ocr')
export class OcrController {
  constructor(private readonly ocrService: OcrService) {}

  @Post('textract')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Imagem (PNG/JPEG) ou PDF da nota fiscal',
        },
      },
      required: ['file'],
    },
  })
  @ApiOkResponse({ type: AnalyzeInvoiceResponseDto })
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async analyzeInvoice(@NestUploadedFile() file: OcrUploadedFile): Promise<AnalyzeInvoiceResponseDto> {
    return this.ocrService.analyzeInvoice(file);
  }

  @Get('metrics')
  @ApiOkResponse({ type: OcrMetricsResponseDto })
  @UseGuards(JwtAuthGuard)
  getMetrics(): OcrMetricsResponseDto {
    return this.ocrService.getMetrics();
  }
}
