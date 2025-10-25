import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common'
import { AnalyzeExpenseCommand, AnalyzeExpenseCommandOutput, TextractClient } from '@aws-sdk/client-textract'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class OcrTextractService {
  private readonly logger = new Logger(OcrTextractService.name)
  private readonly textractClient: TextractClient

  constructor(private readonly configService: ConfigService) {
    const region = this.configService.get<string>('AWS_REGION') ?? 'us-east-1'
    this.textractClient = new TextractClient({ region })
  }

  async analyze(command: AnalyzeExpenseCommand): Promise<AnalyzeExpenseCommandOutput> {
    try {
      return await this.textractClient.send(command)
    } catch (error) {
      this.logger.error('Erro ao processar arquivo no Textract', error as Error)
      throw new InternalServerErrorException('Não foi possível analisar o documento com o Textract')
    }
  }
}
