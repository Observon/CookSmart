import { Injectable } from '@nestjs/common'

export interface OcrMetricsSnapshot {
  totalAnalyses: number
  totalFailures: number
  averageDurationMs: number
  failureRate: number
  alerts: string[]
}

@Injectable()
export class OcrMetricsService {
  private totalAnalyses = 0
  private totalDurationMs = 0
  private totalFailures = 0

  recordSuccess(durationMs: number) {
    this.totalAnalyses += 1
    this.totalDurationMs += durationMs
  }

  recordFailure() {
    this.totalFailures += 1
  }

  reset() {
    this.totalAnalyses = 0
    this.totalDurationMs = 0
    this.totalFailures = 0
  }

  getSnapshot(): OcrMetricsSnapshot {
    const averageDurationMs = this.totalAnalyses ? this.totalDurationMs / this.totalAnalyses : 0
    const totalAttempts = this.totalAnalyses + this.totalFailures
    const failureRate = totalAttempts ? this.totalFailures / totalAttempts : 0

    return {
      totalAnalyses: this.totalAnalyses,
      totalFailures: this.totalFailures,
      averageDurationMs,
      failureRate,
      alerts: this.buildAlerts(averageDurationMs, failureRate, totalAttempts),
    }
  }

  private buildAlerts(averageDurationMs: number, failureRate: number, totalAttempts: number) {
    const alerts: string[] = []

    if (averageDurationMs > 5000 && this.totalAnalyses > 0) {
      alerts.push('Tempo médio de análise acima de 5s. Verifique latência do Textract.')
    }

    if (failureRate >= 0.2 && totalAttempts >= 5) {
      alerts.push('Taxa de falhas >= 20%. Avalie credenciais, limites de tamanho e formato dos arquivos.')
    }

    return alerts
  }
}
