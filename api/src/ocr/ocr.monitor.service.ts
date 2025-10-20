import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { OcrService } from './ocr.service';

@Injectable()
export class OcrMonitorService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OcrMonitorService.name);
  private readonly intervalMs: number;
  private intervalHandle: NodeJS.Timeout | null = null;

  constructor(
    private readonly ocrService: OcrService,
    private readonly configService: ConfigService,
  ) {
    const configured = Number.parseInt(this.configService.get<string>('OCR_METRICS_INTERVAL_MS', '300000'), 10);
    this.intervalMs = Number.isFinite(configured) && configured > 0 ? configured : 300000;
  }

  onModuleInit() {
    this.intervalHandle = setInterval(() => this.checkMetrics(), this.intervalMs);
    this.logger.log(`Monitoramento OCR agendado a cada ${this.intervalMs}ms`);
  }

  onModuleDestroy() {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
  }

  private checkMetrics() {
    const metrics = this.ocrService.getMetrics();

    if (metrics.alerts.length === 0) {
      this.logger.debug(
        `OCR metrics: total=${metrics.totalAnalyses}, failures=${metrics.totalFailures}, avg=${metrics.averageDurationMs.toFixed(
          2,
        )}ms`,
      );
      return;
    }

    metrics.alerts.forEach((alert) => this.logger.warn(alert));
  }
}
