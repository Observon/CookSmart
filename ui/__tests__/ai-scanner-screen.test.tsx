import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'

import { AiScannerScreen } from '@/components/ai-scanner-screen'
import type { Ingredient } from '@/lib/types'
import { toast } from 'sonner'
import { analyzeInvoice, createDetectedIngredients } from '@/lib/services/ocr'
import { DEFAULT_UNIT } from '@/lib/constants/units'

vi.mock('@/context/auth-context', () => ({
  useAuth: () => ({
    token: 'test-token',
    user: { id: 1, name: 'Tester', email: 'tester@example.com' },
    loading: false,
    initializing: false,
    logout: vi.fn(),
  }),
}))

vi.mock('@/lib/services/ocr', () => ({
  analyzeInvoice: vi.fn(),
  createDetectedIngredients: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: {
    info: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
  },
}))

const mockedAnalyzeInvoice = analyzeInvoice as unknown as ReturnType<typeof vi.fn>
const mockedCreateDetectedIngredients = createDetectedIngredients as unknown as ReturnType<typeof vi.fn>

const defaultIngredients: Ingredient[] = [
  {
    id: 1,
    name: 'Farinha',
    unitOfMeasure: 'KG',
    totalCost: 10,
    totalAmount: 5,
    costPerUnit: 2,
  },
]

describe('AiScannerScreen', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('envia arquivo para analyzeInvoice e exibe resultado correspondido', async () => {
    mockedAnalyzeInvoice.mockResolvedValue({
      items: [
        {
          description: 'Farinha de Trigo',
          quantity: 2,
          total: 18,
          unit: 'KG',
          confidence: 0.95,
        },
      ],
      invoiceNumber: 'NF-123',
      issueDate: '2025-01-10',
      currency: 'BRL',
      totalAmount: 18,
      supplierName: 'Padaria Central',
    })

    const { container } = render(
      <AiScannerScreen
        ingredients={defaultIngredients}
        onBack={vi.fn()}
        onUpdatePrices={vi.fn()}
      />,
    )

    const fileInput = container.querySelector('input[type="file"]')
    expect(fileInput).toBeTruthy()

    const file = new File(['conteudo'], 'nota.png', { type: 'image/png' })
    fireEvent.change(fileInput as HTMLInputElement, {
      target: { files: [file] },
    })

    await waitFor(() => {
      expect(mockedAnalyzeInvoice).toHaveBeenCalledWith('test-token', file)
    })

    await screen.findByText('1 item reconhecido')
    expect(screen.getByText('Prontos para atualização:')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(toast.info).not.toHaveBeenCalled()
  })

  it('exibe alerta quando houver itens não correspondidos', async () => {
    mockedAnalyzeInvoice.mockResolvedValue({
      items: [
        {
          description: 'Produto Desconhecido',
          quantity: 1,
          total: 12,
          confidence: 0.6,
          issues: ['low_confidence'],
        },
      ],
    })

    const { container } = render(
      <AiScannerScreen
        ingredients={defaultIngredients}
        onBack={vi.fn()}
        onUpdatePrices={vi.fn()}
      />,
    )

    const file = new File(['conteudo'], 'nota.png', { type: 'image/png' })
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(fileInput, {
      target: { files: [file] },
    })

    await waitFor(() => {
      expect(mockedAnalyzeInvoice).toHaveBeenCalled()
    })

    await screen.findByText('1 item reconhecido')
    await waitFor(() => {
      expect(toast.info).toHaveBeenCalledWith('1 item(ns) requer(em) revisão manual antes de atualizar.')
    })
    expect(screen.getByText('Produto Desconhecido')).toBeInTheDocument()
  })

  it('permite criar ingredientes ausentes e prossegue com atualização', async () => {
    mockedAnalyzeInvoice.mockResolvedValue({
      items: [
        {
          description: 'Produto Novo',
          total: 12,
          quantity: null,
          unit: null,
          confidence: 0.9,
          issues: ['missing_quantity'],
        },
      ],
    })

    mockedCreateDetectedIngredients.mockImplementation(async (_token: string, payload: Array<{ clientItemId?: string }>) => ({
      created: payload.map((item, index) => ({
        clientItemId: item.clientItemId ?? null,
        ingredientId: 200 + index,
      })),
    }))

    const onUpdatePrices = vi.fn()

    const { container } = render(
      <AiScannerScreen
        ingredients={defaultIngredients}
        onBack={vi.fn()}
        onUpdatePrices={onUpdatePrices}
      />,
    )

    const file = new File(['conteudo'], 'nota.png', { type: 'image/png' })
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(fileInput, {
      target: { files: [file] },
    })

    await waitFor(() => {
      expect(mockedAnalyzeInvoice).toHaveBeenCalledWith('test-token', file)
    })

    const checkbox = await screen.findByRole('checkbox')
    fireEvent.click(checkbox)

    const confirmButton = await screen.findByRole('button', {
      name: /Atualizar 1/i,
    })
    fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(mockedCreateDetectedIngredients).toHaveBeenCalledTimes(1)
      expect(onUpdatePrices).toHaveBeenCalledTimes(1)
    })

    const [, items] = mockedCreateDetectedIngredients.mock.calls[0]
    expect(Array.isArray(items)).toBe(true)
    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({
      name: 'Produto Novo',
      unitOfMeasure: DEFAULT_UNIT,
      totalCost: 12,
      totalAmount: 1,
    })

    const payload = onUpdatePrices.mock.calls[0][0]
    expect(payload.createdIngredients).toHaveLength(1)
    expect(payload.createdIngredients[0]).toMatchObject({
      id: 200,
      name: 'Produto Novo',
      unitOfMeasure: DEFAULT_UNIT,
    })
    expect(payload.updates[0]).toMatchObject({
      ingredientId: 200,
      newCost: 12,
      newAmount: 1,
    })
  })
})
