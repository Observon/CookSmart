import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { AnalyzeExpenseCommand, AnalyzeExpenseCommandOutput, ExpenseDocument, LineItemFields } from '@aws-sdk/client-textract';

import { AnalyzeInvoiceResponseDto, OcrInvoiceItemDto } from './dto/analyze-invoice-response.dto';
import { OcrStorageService } from './ocr-storage.service';
import { OcrTextractService } from './ocr-textract.service';
import { OcrMetricsService } from './ocr-metrics.service';
import type { OcrUploadedFile } from './ocr.types';

@Injectable()
export class OcrService {
  private readonly logger = new Logger(OcrService.name);
  private readonly maxFileSizeBytes: number;

  private readonly allowedMimeTypes = new Set([
    'image/png',
    'image/jpeg',
    'application/pdf',
  ]);

  constructor(
    private readonly storageService: OcrStorageService,
    private readonly textractService: OcrTextractService,
    private readonly metricsService: OcrMetricsService,
  ) {
    const maxMb = Number.parseFloat(
      process.env.TEXTRACT_MAX_FILE_SIZE_MB ?? '10',
    );
    this.maxFileSizeBytes = Number.isFinite(maxMb) && maxMb > 0 ? maxMb * 1024 * 1024 : 10 * 1024 * 1024;
  }

  async analyzeInvoice(file: OcrUploadedFile | undefined): Promise<AnalyzeInvoiceResponseDto> {
    const startTime = Date.now();

    if (!file) {
      this.metricsService.recordFailure();
      throw new BadRequestException('Nenhum arquivo enviado');
    }

    if (file.size > this.maxFileSizeBytes) {
      this.metricsService.recordFailure();
      throw new BadRequestException(
        `Arquivo excede o limite de ${(this.maxFileSizeBytes / (1024 * 1024)).toFixed(1)}MB`,
      );
    }

    if (!this.allowedMimeTypes.has(file.mimetype)) {
      this.metricsService.recordFailure();
      throw new BadRequestException('Formato de arquivo não suportado. Use PNG, JPEG ou PDF.');
    }

    let document: AnalyzeExpenseCommand['input']['Document'];
    let receiptKey: string | null;

    try {
      const prepared = await this.storageService.prepareDocument(file);
      document = prepared.document;
      receiptKey = prepared.receiptKey;
    } catch (error) {
      this.metricsService.recordFailure();
      throw error;
    }

    const command = new AnalyzeExpenseCommand({
      Document: document,
    });

    let response: AnalyzeExpenseCommandOutput;
    try {
      response = await this.textractService.analyze(command);
    } catch (error) {
      this.metricsService.recordFailure();
      throw error;
    }

    const mapped = this.mapResponse(response);

    const duration = Date.now() - startTime;
    this.metricsService.recordSuccess(duration);
    this.logger.log(`Análise OCR concluída em ${duration}ms`);

    return {
      ...mapped,
      receiptImageKey: receiptKey ?? mapped.receiptImageKey ?? null,
    };
  }

  getMetrics() {
    return this.metricsService.getSnapshot();
  }

  resetMetrics() {
    this.metricsService.reset();
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
}
