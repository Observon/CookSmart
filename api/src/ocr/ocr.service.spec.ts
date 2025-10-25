import { BadRequestException } from '@nestjs/common';

import { OcrService } from './ocr.service';
import type { OcrUploadedFile } from './ocr.types';
import type { OcrStorageService } from './ocr-storage.service';
import type { OcrTextractService } from './ocr-textract.service';
import type { OcrMetricsService, OcrMetricsSnapshot } from './ocr-metrics.service';

describe('OcrService', () => {
  const createFile = (overrides: Partial<OcrUploadedFile> = {}): OcrUploadedFile => ({
    buffer: Buffer.from('nota fiscal'),
    mimetype: 'image/png',
    size: 12,
    originalname: 'nota.png',
    ...overrides,
  });

  const mockStorage = (): jest.Mocked<OcrStorageService> => ({
    prepareDocument: jest.fn(),
  } as unknown as jest.Mocked<OcrStorageService>);

  const mockTextract = (): jest.Mocked<OcrTextractService> => ({
    analyze: jest.fn(),
  } as unknown as jest.Mocked<OcrTextractService>);

  const mockMetrics = (): jest.Mocked<OcrMetricsService> => ({
    recordSuccess: jest.fn(),
    recordFailure: jest.fn(),
    reset: jest.fn(),
    getSnapshot: jest.fn().mockReturnValue({
      totalAnalyses: 0,
      totalFailures: 0,
      averageDurationMs: 0,
      failureRate: 0,
      alerts: [],
    } satisfies OcrMetricsSnapshot),
  } as unknown as jest.Mocked<OcrMetricsService>);

  beforeEach(() => {
    jest.resetAllMocks();
    delete process.env.TEXTRACT_MAX_FILE_SIZE_MB;
  });

  it('lança erro e registra falha quando nenhum arquivo é enviado', async () => {
    const storage = mockStorage();
    const textract = mockTextract();
    const metrics = mockMetrics();
    const service = new OcrService(storage, textract, metrics);

    await expect(service.analyzeInvoice(undefined)).rejects.toBeInstanceOf(BadRequestException);
    expect(metrics.recordFailure).toHaveBeenCalledTimes(1);
    expect(storage.prepareDocument).not.toHaveBeenCalled();
    expect(textract.analyze).not.toHaveBeenCalled();
  });

  it('valida tamanho máximo do arquivo com base na configuração', async () => {
    process.env.TEXTRACT_MAX_FILE_SIZE_MB = '0.0001';
    const storage = mockStorage();
    const textract = mockTextract();
    const metrics = mockMetrics();
    const service = new OcrService(storage, textract, metrics);

    await expect(
      service.analyzeInvoice(createFile({ size: 1024 })),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(metrics.recordFailure).toHaveBeenCalledWith();
    expect(storage.prepareDocument).not.toHaveBeenCalled();
  });

  it('valida tipo de arquivo permitido', async () => {
    const storage = mockStorage();
    const textract = mockTextract();
    const metrics = mockMetrics();
    const service = new OcrService(storage, textract, metrics);

    await expect(
      service.analyzeInvoice(createFile({ mimetype: 'text/plain' })),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(metrics.recordFailure).toHaveBeenCalledTimes(1);
    expect(storage.prepareDocument).not.toHaveBeenCalled();
  });

  it('processa arquivo com sucesso, delegando para storage, textract e métricas', async () => {
    const storage = mockStorage();
    const textract = mockTextract();
    const metrics = mockMetrics();
    const service = new OcrService(storage, textract, metrics);

    storage.prepareDocument.mockResolvedValue({
      document: { Bytes: Buffer.from('nota') },
      receiptKey: 'ocr/2025/file.pdf',
    });
    textract.analyze.mockResolvedValue({
      ExpenseDocuments: [
        {
          SummaryFields: [],
          LineItemGroups: [],
        },
      ],
    } as any);

    const result = await service.analyzeInvoice(createFile());

    expect(storage.prepareDocument).toHaveBeenCalledTimes(1);
    expect(textract.analyze).toHaveBeenCalledTimes(1);
    expect(metrics.recordSuccess).toHaveBeenCalledTimes(1);
    expect(result.receiptImageKey).toBe('ocr/2025/file.pdf');
    expect(result.items).toEqual([]);
  });

  it('registra falha quando armazenamento lança exceção', async () => {
    const storage = mockStorage();
    const textract = mockTextract();
    const metrics = mockMetrics();
    const service = new OcrService(storage, textract, metrics);

    storage.prepareDocument.mockRejectedValue(new Error('storage down'));

    await expect(service.analyzeInvoice(createFile())).rejects.toThrow('storage down');
    expect(metrics.recordFailure).toHaveBeenCalledTimes(1);
    expect(textract.analyze).not.toHaveBeenCalled();
  });

  it('registra falha quando textract lança exceção', async () => {
    const storage = mockStorage();
    const textract = mockTextract();
    const metrics = mockMetrics();
    const service = new OcrService(storage, textract, metrics);

    storage.prepareDocument.mockResolvedValue({
      document: { Bytes: Buffer.from('nota') },
      receiptKey: null,
    });
    textract.analyze.mockRejectedValue(new Error('textract down'));

    await expect(service.analyzeInvoice(createFile())).rejects.toThrow('textract down');
    expect(metrics.recordFailure).toHaveBeenCalledTimes(1);
    expect(metrics.recordSuccess).not.toHaveBeenCalled();
  });

  it('exibe snapshot de métricas a partir do serviço dedicado', () => {
    const storage = mockStorage();
    const textract = mockTextract();
    const metrics = mockMetrics();
    const snapshot: OcrMetricsSnapshot = {
      totalAnalyses: 5,
      totalFailures: 2,
      averageDurationMs: 1500,
      failureRate: 0.4,
      alerts: ['exemplo'],
    };
    metrics.getSnapshot.mockReturnValue(snapshot);
    const service = new OcrService(storage, textract, metrics);

    expect(service.getMetrics()).toBe(snapshot);
    service.resetMetrics();
    expect(metrics.reset).toHaveBeenCalledTimes(1);
  });
});
