import { apiFetch } from "@/lib/http"

export interface OcrInvoiceItem {
  description: string
  quantity?: number | null
  unit?: string | null
  unitPrice?: number | null
  total?: number | null
  confidence?: number | null
  issues?: string[]
}

export interface AnalyzeInvoiceResponse {
  supplierName?: string | null
  supplierTaxId?: string | null
  invoiceNumber?: string | null
  issueDate?: string | null
  totalAmount?: number | null
  currency?: string | null
  receiptImageKey?: string | null
  items: OcrInvoiceItem[]
}

export async function analyzeInvoice(token: string, file: File): Promise<AnalyzeInvoiceResponse> {
  const formData = new FormData()
  formData.append("file", file)

  const response = await apiFetch<AnalyzeInvoiceResponse>("/ocr/textract", {
    method: "POST",
    token,
    body: formData,
  })

  return {
    items: response.items ?? [],
    supplierName: response.supplierName ?? null,
    supplierTaxId: response.supplierTaxId ?? null,
    invoiceNumber: response.invoiceNumber ?? null,
    issueDate: response.issueDate ?? null,
    totalAmount: response.totalAmount ?? null,
    currency: response.currency ?? null,
    receiptImageKey: response.receiptImageKey ?? null,
  }
}
