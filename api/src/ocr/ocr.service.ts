import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AnalyzeExpenseCommand,
  AnalyzeExpenseCommandOutput,
  ExpenseDocument,
  LineItemFields,
  TextractClient,
} from '@aws-sdk/client-textract';
import {
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';

import { AnalyzeInvoiceResponseDto, OcrInvoiceItemDto } from './dto/analyze-invoice-response.dto';
import {
  CreateDetectedIngredientsDto,
  CreateDetectedIngredientsResponseDto,
} from './dto/create-detected-ingredients.dto';
import { IngredientsService } from '../ingredients/ingredients.service';

export interface OcrUploadedFile {
  buffer: Buffer;
  mimetype: string;
  size: number;
  originalname: string;
}

@Injectable()
export class OcrService {
  private readonly logger = new Logger(OcrService.name);
  private readonly textractClient: TextractClient;
  private readonly s3Client: S3Client | null;
  private readonly useS3: boolean;
  private readonly bucket?: string;
  private readonly maxFileSizeBytes: number;
  private totalAnalyses = 0;
  private totalDurationMs = 0;
  private totalFailures = 0;

  private readonly allowedMimeTypes = new Set([
    'image/png',
    'image/jpeg',
    'application/pdf',
  ]);

  constructor(
    private readonly configService: ConfigService,
    private readonly ingredientsService: IngredientsService,
  ) {
    const region = this.configService.get<string>('AWS_REGION') ?? 'us-east-1';
    this.textractClient = new TextractClient({ region });

    this.useS3 = this.parseBoolean(this.configService.get<string>('TEXTRACT_USE_S3', 'true'));
    this.bucket = this.configService.get<string>('TEXTRACT_BUCKET');
    this.s3Client = this.useS3 ? new S3Client({ region }) : null;

    const maxMb = Number.parseFloat(this.configService.get<string>('TEXTRACT_MAX_FILE_SIZE_MB', '10'));
    this.maxFileSizeBytes = Number.isFinite(maxMb) && maxMb > 0 ? maxMb * 1024 * 1024 : 10 * 1024 * 1024;
  }

  async createDetectedIngredients(
    userId: number,
    dto: CreateDetectedIngredientsDto,
  ): Promise<CreateDetectedIngredientsResponseDto> {
    const created = [] as CreateDetectedIngredientsResponseDto['created'];

    for (const item of dto.items) {
      const ingredient = await this.ingredientsService.create(userId, {
        name: item.name,
        unitOfMeasure: item.unitOfMeasure,
        category: item.category,
        totalCost: item.totalCost,
        totalAmount: item.totalAmount,
      });

      created.push({
        clientItemId: item.clientItemId ?? null,
        ingredientId: ingredient.id,
      });
    }

    return { created };
  }

  async analyzeInvoice(file: OcrUploadedFile | undefined): Promise<AnalyzeInvoiceResponseDto> {
    const startTime = Date.now();

    if (!file) {
      this.incrementFailures();
      throw new BadRequestException('Nenhum arquivo enviado');
    }

    if (file.size > this.maxFileSizeBytes) {
      this.incrementFailures();
      throw new BadRequestException(
        `Arquivo excede o limite de ${(this.maxFileSizeBytes / (1024 * 1024)).toFixed(1)}MB`,
      );
    }

    if (!this.allowedMimeTypes.has(file.mimetype)) {
      this.incrementFailures();
      throw new BadRequestException('Formato de arquivo não suportado. Use PNG, JPEG ou PDF.');
    }

    const { document, receiptKey } = await this.prepareDocument(file);

    const command = new AnalyzeExpenseCommand({
      Document: document,
    });

    let response: AnalyzeExpenseCommandOutput;
    try {
      response = await this.textractClient.send(command);
    } catch (error) {
      this.logger.error('Erro ao processar arquivo no Textract', error as Error);
      this.incrementFailures();
      throw new InternalServerErrorException('Não foi possível analisar o documento com o Textract');
    }

    const mapped = this.mapResponse(response);

    const duration = Date.now() - startTime;
    this.totalAnalyses += 1;
    this.totalDurationMs += duration;
    this.logger.log(`Análise OCR concluída em ${duration}ms`);

    return {
      ...mapped,
      receiptImageKey: receiptKey ?? mapped.receiptImageKey ?? null,
    };
  }

  getMetrics() {
    const averageDurationMs = this.totalAnalyses ? this.totalDurationMs / this.totalAnalyses : 0;
    const totalAttempts = this.totalAnalyses + this.totalFailures;
    const failureRate = totalAttempts ? this.totalFailures / totalAttempts : 0;
    const alerts = this.buildAlerts(averageDurationMs, failureRate, totalAttempts);

    return {
      totalAnalyses: this.totalAnalyses,
      averageDurationMs,
      totalFailures: this.totalFailures,
      failureRate,
      alerts,
    };
  }

  resetMetrics() {
    this.totalAnalyses = 0;
    this.totalDurationMs = 0;
    this.totalFailures = 0;
  }

  private incrementFailures() {
    this.totalFailures += 1;
  }

  private buildAlerts(averageDurationMs: number, failureRate: number, totalAttempts: number) {
    const alerts: string[] = [];

    if (averageDurationMs > 5000 && this.totalAnalyses > 0) {
      alerts.push('Tempo médio de análise acima de 5s. Verifique latência do Textract.');
    }

    if (failureRate >= 0.2 && totalAttempts >= 5) {
      alerts.push('Taxa de falhas >= 20%. Avalie credenciais, limites de tamanho e formato dos arquivos.');
    }

    return alerts;
  }

  private async prepareDocument(file: OcrUploadedFile) {
    if (this.useS3) {
      if (!this.bucket || !this.s3Client) {
        this.logger.error('TEXTRACT_BUCKET não configurado ou S3Client indisponível');
        throw new InternalServerErrorException('Configuração de armazenamento para OCR inválida');
      }

      const key = `ocr/${new Date().toISOString().slice(0, 10)}/${randomUUID()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

      try {
        await this.s3Client.send(
          new PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
          }),
        );
      } catch (error) {
        this.logger.error('Erro ao enviar arquivo para o S3', error as Error);
        this.incrementFailures();
        throw new InternalServerErrorException('Falha ao armazenar o arquivo para processamento de OCR');
      }

      return {
        document: {
          S3Object: {
            Bucket: this.bucket,
            Name: key,
          },
        },
        receiptKey: key,
      };
    }

    if (!file.buffer) {
      throw new InternalServerErrorException('Arquivo não disponível em memória para envio ao Textract');
    }

    const localDir = join(process.cwd(), 'tmp', 'ocr');
    const fileName = `${Date.now()}-${randomUUID()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const filePath = join(localDir, fileName);

    try {
      await fs.mkdir(localDir, { recursive: true });
      await fs.writeFile(filePath, file.buffer);
    } catch (error) {
      this.logger.error('Erro ao salvar arquivo localmente', error as Error);
      this.incrementFailures();
      throw new InternalServerErrorException('Falha ao armazenar o arquivo localmente para OCR');
    }

    return {
      document: { Bytes: file.buffer },
      receiptKey: filePath,
    };
  }

  private mapResponse(response: AnalyzeExpenseCommandOutput): AnalyzeInvoiceResponseDto {
    const document = response.ExpenseDocuments?.[0];
    if (!document) {
      return {
        items: [],
      };
    }

    const summaryField = (type: string) => this.findSummaryValue(document, type);

    const items = (document.LineItemGroups ?? [])
      .flatMap((group) => group.LineItems ?? [])
      .map((item) => this.mapLineItem(item));

    return {
      supplierName: summaryField('VENDOR_NAME') ?? summaryField('SUPPLIER'),
      supplierTaxId: summaryField('VENDOR_TAX_ID') ?? summaryField('SUPPLIER_TAX_ID'),
      invoiceNumber: summaryField('INVOICE_RECEIPT_ID') ?? summaryField('INVOICE_NUMBER'),
      issueDate: summaryField('INVOICE_RECEIPT_DATE') ?? summaryField('INVOICE_DATE'),
      totalAmount: this.parseNumber(summaryField('TOTAL') ?? summaryField('AMOUNT_DUE')),
      currency: summaryField('CURRENCY'),
      items,
    };
  }

  private mapLineItem(item: LineItemFields): OcrInvoiceItemDto {
    const findField = (types: string[]) =>
      item.LineItemExpenseFields?.find((field) => {
        const key = field.Type?.Text?.toUpperCase();
        return key && types.includes(key);
      });

    const descriptionField = findField(['ITEM', 'ITEM_DESCRIPTION', 'DESCRIPTION']);
    const quantityField = findField(['QUANTITY']);
    const unitField = findField(['UNIT', 'UNIT_OF_MEASURE']);
    const unitPriceField = findField(['UNIT_PRICE']);
    const priceField = findField(['PRICE', 'TOTAL']);

    const confidences: number[] = [];
    [descriptionField, quantityField, unitField, unitPriceField, priceField]
      .filter(Boolean)
      .forEach((field) => {
        const valueConfidence = field?.ValueDetection?.Confidence;
        if (valueConfidence) {
          confidences.push(valueConfidence);
        }
      });

    const description = (descriptionField?.ValueDetection?.Text ?? '').trim();
    const quantity = this.parseNumber(quantityField?.ValueDetection?.Text);
    const total = this.parseNumber(priceField?.ValueDetection?.Text);
    const unitPriceRaw = this.parseNumber(unitPriceField?.ValueDetection?.Text);

    const confidence = confidences.length
      ? confidences.reduce((sum, value) => sum + value, 0) / confidences.length / 100
      : (descriptionField?.ValueDetection?.Confidence ?? 0) / 100;

    const issues: string[] = [];

    if (!description) {
      issues.push('missing_description');
    }

    if (quantity === null || quantity <= 0) {
      issues.push('missing_quantity');
    }

    if (total === null || total <= 0) {
      issues.push('missing_total');
    }

    if (unitPriceRaw === null && total !== null && quantity !== null && quantity > 0) {
      issues.push('missing_unit_price');
    }

    if (confidence < 0.7) {
      issues.push('low_confidence');
    }

    const unitPrice =
      unitPriceRaw !== null
        ? unitPriceRaw
        : total !== null && quantity && quantity > 0
          ? total / quantity
          : null;

    return {
      description,
      quantity,
      unit: unitField?.ValueDetection?.Text ?? null,
      unitPrice,
      total,
      confidence,
      rawText: descriptionField?.ValueDetection?.Text ?? null,
      issues: issues.length ? issues : undefined,
    };
  }

  private findSummaryValue(document: ExpenseDocument, type: string): string | undefined {
    const normalizedType = type.toUpperCase();

    const field = document.SummaryFields?.find((summary) => {
      const fieldType = summary.Type?.Text?.toUpperCase();
      return fieldType === normalizedType;
    });

    return field?.ValueDetection?.Text;
  }

  private parseNumber(value?: string | null): number | null {
    if (!value) {
      return null;
    }

    const normalized = value.replace(/[^0-9,.-]/g, '').replace(',', '.');
    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private parseBoolean(value?: string | boolean): boolean {
    if (typeof value === 'boolean') {
      return value;
    }

    return String(value).toLowerCase() === 'true';
  }
}
