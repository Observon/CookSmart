import type { Buffer } from 'node:buffer'

export interface OcrUploadedFile {
  buffer: Buffer
  mimetype: string
  size: number
  originalname: string
}
