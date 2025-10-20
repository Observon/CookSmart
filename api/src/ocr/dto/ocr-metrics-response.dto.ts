import { ApiProperty } from '@nestjs/swagger';

export class OcrMetricsResponseDto {
  @ApiProperty({ description: 'Quantidade total de análises concluídas com sucesso' })
  totalAnalyses!: number;

  @ApiProperty({ description: 'Duração média das análises (ms)' })
  averageDurationMs!: number;

  @ApiProperty({ description: 'Quantidade total de falhas registradas' })
  totalFailures!: number;

  @ApiProperty({ description: 'Taxa de falhas acumulada (0-1)' })
  failureRate!: number;

  @ApiProperty({
    description: 'Alertas gerados a partir dos limiares configurados',
    type: [String],
  })
  alerts!: string[];
}
