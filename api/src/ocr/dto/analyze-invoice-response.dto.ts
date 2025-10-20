import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OcrInvoiceItemDto {
  @ApiProperty({ description: 'Descrição detectada do item' })
  description!: string;

  @ApiPropertyOptional({ description: 'Quantidade detectada', type: Number, example: 1 })
  quantity?: number | null;

  @ApiPropertyOptional({ description: 'Unidade de medida', example: 'KG' })
  unit?: string | null;

  @ApiPropertyOptional({ description: 'Preço unitário detectado', type: Number, example: 4.99 })
  unitPrice?: number | null;

  @ApiPropertyOptional({ description: 'Valor total do item', type: Number, example: 19.9 })
  total?: number | null;

  @ApiProperty({ description: 'Confiança média (0-1)', example: 0.92 })
  confidence!: number;

  @ApiPropertyOptional({ description: 'Campo bruto retornado pelo Textract para debug' })
  rawText?: string | null;

  @ApiPropertyOptional({
    description: 'Códigos de possíveis problemas detectados ao mapear o item',
    example: ['missing_description', 'low_confidence'],
    type: [String],
  })
  issues?: string[];
}

export class AnalyzeInvoiceResponseDto {
  @ApiPropertyOptional({ description: 'Nome do fornecedor identificado' })
  supplierName?: string | null;

  @ApiPropertyOptional({ description: 'CNPJ/identificador fiscal do fornecedor' })
  supplierTaxId?: string | null;

  @ApiPropertyOptional({ description: 'Número da nota fiscal' })
  invoiceNumber?: string | null;

  @ApiPropertyOptional({ description: 'Data de emissão da nota' })
  issueDate?: string | null;

  @ApiPropertyOptional({ description: 'Valor total da nota', type: Number })
  totalAmount?: number | null;

  @ApiPropertyOptional({ description: 'Moeda detectada', example: 'BRL' })
  currency?: string | null;

  @ApiPropertyOptional({ description: 'Chave do arquivo salvo no storage para referência' })
  receiptImageKey?: string | null;

  @ApiProperty({ type: [OcrInvoiceItemDto] })
  items!: OcrInvoiceItemDto[];
}
