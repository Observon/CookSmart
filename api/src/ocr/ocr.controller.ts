import {
  Body,
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
import { CreateDetectedIngredientsDto, CreateDetectedIngredientsResponseDto } from './dto/create-detected-ingredients.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUserDto } from '../auth/dto';

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

  @Post('detected-ingredients')
  @ApiOkResponse({ type: CreateDetectedIngredientsResponseDto })
  @UseGuards(JwtAuthGuard)
  async createDetectedIngredients(
    @CurrentUser() user: AuthUserDto,
    @Body() dto: CreateDetectedIngredientsDto,
  ): Promise<CreateDetectedIngredientsResponseDto> {
    return this.ocrService.createDetectedIngredients(user.id, dto);
  }

  @Get('metrics')
  @ApiOkResponse({ type: OcrMetricsResponseDto })
  @UseGuards(JwtAuthGuard)
  getMetrics(): OcrMetricsResponseDto {
    return this.ocrService.getMetrics();
  }
}
