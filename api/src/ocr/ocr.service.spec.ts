import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';

import { OcrService, OcrUploadedFile } from './ocr.service';

const textractSendMock = jest.fn();
const s3SendMock = jest.fn();

jest.mock('@aws-sdk/client-textract', () => {
  const actual = jest.requireActual('@aws-sdk/client-textract');
  return {
    ...actual,
    TextractClient: jest.fn().mockImplementation(() => ({
      send: textractSendMock,
    })),
  };
});

jest.mock('@aws-sdk/client-s3', () => {
  const actual = jest.requireActual('@aws-sdk/client-s3');
  return {
    ...actual,
    S3Client: jest.fn().mockImplementation(() => ({
      send: s3SendMock,
    })),
  };
});

describe('OcrService', () => {
  const createFile = (overrides: Partial<OcrUploadedFile> = {}): OcrUploadedFile => ({
    buffer: Buffer.from('nota fiscal'),
    mimetype: 'image/png',
    size: 12,
    originalname: 'nota.png',
    ...overrides,
  });

  beforeEach(() => {
    textractSendMock.mockReset();
    s3SendMock.mockReset();
  });

  afterEach(async () => {
    await fs.rm(join(process.cwd(), 'tmp', 'ocr'), { recursive: true, force: true });
  });

  it('lança erro quando nenhum arquivo é enviado', async () => {
    const service = new OcrService(new ConfigService());

    await expect(service.analyzeInvoice(undefined)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('salva o arquivo localmente quando TEXTRACT_USE_S3=false', async () => {
    textractSendMock.mockResolvedValue({ ExpenseDocuments: [] });
    const service = new OcrService(new ConfigService({ TEXTRACT_USE_S3: 'false' }));

    const result = await service.analyzeInvoice(createFile());

    expect(result.items).toEqual([]);
    expect(result.receiptImageKey).toContain(`${join('tmp', 'ocr')}`);

    const exists = await fs
      .access(result.receiptImageKey as string)
      .then(() => true)
      .catch(() => false);
    expect(exists).toBe(true);
  });

  it('envia o arquivo para o S3 e mapeia campos do Textract', async () => {
    const config = new ConfigService({
      TEXTRACT_USE_S3: 'true',
      TEXTRACT_BUCKET: 'cooksmart-bucket',
    });
    const service = new OcrService(config);

    s3SendMock.mockResolvedValue({});
    textractSendMock.mockResolvedValue({
      ExpenseDocuments: [
        {
          SummaryFields: [
            { Type: { Text: 'VENDOR_NAME' }, ValueDetection: { Text: 'Padaria Central' } },
            { Type: { Text: 'VENDOR_TAX_ID' }, ValueDetection: { Text: '12.345.678/0001-00' } },
            { Type: { Text: 'INVOICE_RECEIPT_ID' }, ValueDetection: { Text: 'NF-123' } },
            { Type: { Text: 'INVOICE_DATE' }, ValueDetection: { Text: '2025-01-02' } },
            { Type: { Text: 'TOTAL' }, ValueDetection: { Text: '45,90' } },
            { Type: { Text: 'CURRENCY' }, ValueDetection: { Text: 'BRL' } },
          ],
          LineItemGroups: [
            {
              LineItems: [
                {
                  LineItemExpenseFields: [
                    { Type: { Text: 'ITEM' }, ValueDetection: { Text: 'Pão Francês', Confidence: 99 } },
                    { Type: { Text: 'QUANTITY' }, ValueDetection: { Text: '0,485', Confidence: 98 } },
                    { Type: { Text: 'UNIT_PRICE' }, ValueDetection: { Text: '12.50', Confidence: 97 } },
                    { Type: { Text: 'PRICE' }, ValueDetection: { Text: '6.06', Confidence: 96 } },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });

    const result = await service.analyzeInvoice(createFile({ originalname: 'nota.pdf' }));

    expect(s3SendMock).toHaveBeenCalledTimes(1);
    expect(result.supplierName).toBe('Padaria Central');
    expect(result.supplierTaxId).toBe('12.345.678/0001-00');
    expect(result.invoiceNumber).toBe('NF-123');
    expect(result.issueDate).toBe('2025-01-02');
    expect(result.totalAmount).toBeCloseTo(45.9, 2);
    expect(result.currency).toBe('BRL');
    expect(result.items).toHaveLength(1);
    expect(result.items[0].description).toBe('Pão Francês');
    expect(result.items[0].quantity).toBeCloseTo(0.485, 3);
    expect(result.items[0].total).toBeCloseTo(6.06, 2);
    expect(result.receiptImageKey).toMatch(/ocr\//);
  });

  it('lança erro quando upload no S3 falha', async () => {
    const config = new ConfigService({
      TEXTRACT_USE_S3: 'true',
      TEXTRACT_BUCKET: 'cooksmart-bucket',
    });
    const service = new OcrService(config);

    s3SendMock.mockRejectedValue(new Error('S3 indisponível'));

    await expect(service.analyzeInvoice(createFile())).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
  });
});
