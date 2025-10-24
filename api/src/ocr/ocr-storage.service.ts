import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'

import type { OcrUploadedFile } from './ocr.types'

export interface PreparedDocument {
  document: { Bytes?: Buffer } & { S3Object?: { Bucket: string; Name: string } }
  receiptKey: string | null
}

@Injectable()
export class OcrStorageService {
  private readonly logger = new Logger(OcrStorageService.name)
  private readonly useS3: boolean
  private readonly bucket?: string
  private readonly s3Client: S3Client | null

  constructor(private readonly configService: ConfigService) {
    const region = this.configService.get<string>('AWS_REGION') ?? 'us-east-1'
    this.useS3 = this.parseBoolean(this.configService.get<string>('TEXTRACT_USE_S3', 'true'))
    this.bucket = this.configService.get<string>('TEXTRACT_BUCKET')
    this.s3Client = this.useS3 ? new S3Client({ region }) : null
  }

  async prepareDocument(file: OcrUploadedFile): Promise<PreparedDocument> {
    if (this.useS3) {
      return this.prepareWithS3(file)
    }
    return this.prepareWithLocalFile(file)
  }

  private async prepareWithS3(file: OcrUploadedFile): Promise<PreparedDocument> {
    if (!this.bucket || !this.s3Client) {
      this.logger.error('TEXTRACT_BUCKET não configurado ou S3Client indisponível')
      throw new InternalServerErrorException('Configuração de armazenamento para OCR inválida')
    }

    const key = `ocr/${new Date().toISOString().slice(0, 10)}/${randomUUID()}-${this.sanitizeFileName(file.originalname)}`

    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
        }),
      )
    } catch (error) {
      this.logger.error('Erro ao enviar arquivo para o S3', error as Error)
      throw new InternalServerErrorException('Falha ao armazenar o arquivo para processamento de OCR')
    }

    return {
      document: { S3Object: { Bucket: this.bucket, Name: key } },
      receiptKey: key,
    }
  }

  private async prepareWithLocalFile(file: OcrUploadedFile): Promise<PreparedDocument> {
    const localDir = join(process.cwd(), 'tmp', 'ocr')
    const fileName = `${Date.now()}-${randomUUID()}-${this.sanitizeFileName(file.originalname)}`
    const filePath = join(localDir, fileName)

    try {
      await fs.mkdir(localDir, { recursive: true })
      await fs.writeFile(filePath, file.buffer)
    } catch (error) {
      this.logger.error('Erro ao salvar arquivo localmente', error as Error)
      throw new InternalServerErrorException('Falha ao armazenar o arquivo localmente para OCR')
    }

    return {
      document: { Bytes: file.buffer },
      receiptKey: filePath,
    }
  }

  private sanitizeFileName(fileName: string) {
    return fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
  }

  private parseBoolean(value?: string | boolean): boolean {
    if (typeof value === 'boolean') {
      return value
    }

    return String(value).toLowerCase() === 'true'
  }
}
