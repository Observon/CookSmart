import { useCallback, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

import type { Ingredient } from '@/lib/types'
import { analyzeInvoice } from '@/lib/services/ocr'
import { normalizeText, resolveItemValue } from '@/lib/ai-scanner'
import { useAuth } from '@/context/auth-context'

export interface InvoiceItem {
  ingredientId: number | null
  ingredientName: string
  detectedName: string
  newCost: number
  newAmount: number
  unit: string
  confidence: number
  selected: boolean
  autoMatched: boolean
  issues?: string[]
}

export type ConfirmedPurchaseData = {
  updates: Array<{ ingredientId: number; newCost: number; newAmount: number }>
  supplierName: string | null
  supplierTaxId: string | null
  invoiceNumber: string | null
  issueDate: string | null
  currency: string | null
  totalAmount: number | null
  receiptImageKey: string | null
}

export interface UseAiScannerResult {
  state: {
    isScanning: boolean
    hasScanned: boolean
    scannedItems: InvoiceItem[]
    supplierName: string | null
    supplierTaxId: string | null
    invoiceNumber: string | null
    issueDate: string | null
    currency: string | null
    totalAmount: number | null
    receiptImageKey: string | null
    uploadError: string | null
    selectedFileName: string | null
  }
  fileInputRef: React.MutableRefObject<HTMLInputElement | null>
  handleTriggerCapture: (captureCamera: boolean) => void
  handleFileSelected: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>
  handleToggleItem: (index: number) => void
  handleUpdateItem: (index: number, field: 'newCost' | 'newAmount', value: string) => void
  handleIngredientChange: (index: number, ingredientId: number | null) => void
  handleConfirmUpdates: () => Promise<ConfirmedPurchaseData | null>
  selectedCount: number
  pendingItems: number
  costPerUnit: (item: InvoiceItem) => string
  reset: () => void
}

export function useAiScanner(ingredients: Ingredient[]) {
  const { token } = useAuth()
  const [isScanning, setIsScanning] = useState(false)
  const [scannedItems, setScannedItems] = useState<InvoiceItem[]>([])
  const [hasScanned, setHasScanned] = useState(false)
  const [supplierName, setSupplierName] = useState<string | null>(null)
  const [invoiceNumber, setInvoiceNumber] = useState<string | null>(null)
  const [totalAmount, setTotalAmount] = useState<number | null>(null)
  const [currency, setCurrency] = useState<string | null>(null)
  const [supplierTaxId, setSupplierTaxId] = useState<string | null>(null)
  const [issueDate, setIssueDate] = useState<string | null>(null)
  const [receiptImageKey, setReceiptImageKey] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const normalizedIngredients = useMemo(
    () =>
      ingredients.map((ingredient) => ({
        ...ingredient,
        normalizedName: normalizeText(ingredient.name),
      })),
    [ingredients],
  )

  const findMatchingIngredient = useCallback(
    (description?: string | null) => {
      if (!description) return null
      const normalizedDescription = normalizeText(description)
      if (!normalizedDescription) return null

      let exactMatch: Ingredient | null = null
      let bestPartial: { ingredient: Ingredient; score: number } | null = null

      for (const candidate of normalizedIngredients) {
        if (!candidate.normalizedName) continue

        if (normalizedDescription === candidate.normalizedName) {
          exactMatch = candidate
          break
        }

        let score = 0
        if (normalizedDescription.includes(candidate.normalizedName)) {
          score = candidate.normalizedName.length
        } else {
          const candidateTokens = candidate.normalizedName
            .split(' ')
            .filter((token) => token.length >= 3)
          const descriptionTokens = normalizedDescription.split(' ')
          const matches = candidateTokens.filter((token) => descriptionTokens.includes(token))
          if (matches.length) {
            score = matches.reduce((sum, token) => sum + token.length, 0)
          }
        }

        if (score > 0 && (!bestPartial || score > bestPartial.score)) {
          bestPartial = { ingredient: candidate, score }
        }
      }

      return exactMatch ?? bestPartial?.ingredient ?? null
    },
    [normalizedIngredients],
  )

  const processFile = useCallback(
    async (file: File) => {
      if (!token) {
        toast.error('Você precisa estar autenticado para usar o OCR')
        return
      }

      setIsScanning(true)
      setUploadError(null)

      try {
        const response = await analyzeInvoice(token, file)

        let unmatchedCount = 0
        const normalizedItems: InvoiceItem[] = []

        for (const item of response.items) {
          const ingredientMatch = findMatchingIngredient(item.description)

          const normalizedQuantity = item.quantity && item.quantity > 0 ? item.quantity : null
          const quantityForMatched = normalizedQuantity ?? 1
          const quantityForUnmatched = normalizedQuantity ?? null
          const issues = [...(item.issues ?? [])]

          if (!ingredientMatch) {
            unmatchedCount += 1
            if (!issues.includes('unmatched_ingredient')) {
              issues.push('unmatched_ingredient')
            }

            const total = resolveItemValue(item.total, item.unitPrice, quantityForUnmatched)

            normalizedItems.push({
              ingredientId: null,
              ingredientName: item.description?.trim() || 'Item sem correspondência',
              detectedName: item.description ?? '',
              newCost: total,
              newAmount: quantityForUnmatched ?? 0,
              unit: item.unit ?? '',
              confidence: item.confidence ?? 0,
              selected: false,
              autoMatched: false,
              issues,
            })
            continue
          }

          const total = resolveItemValue(item.total, item.unitPrice, quantityForMatched)
          const hasIssues = issues.length > 0

          normalizedItems.push({
            ingredientId: ingredientMatch.id,
            ingredientName: ingredientMatch.name,
            detectedName: item.description ?? '',
            newCost: total,
            newAmount: quantityForMatched,
            unit: item.unit ?? ingredientMatch.unitOfMeasure ?? '',
            confidence: item.confidence ?? 0,
            selected: !hasIssues,
            autoMatched: true,
            issues: hasIssues ? issues : undefined,
          })
        }

        setScannedItems(normalizedItems)
        setSupplierName(response.supplierName ?? null)
        setInvoiceNumber(response.invoiceNumber ?? null)
        setTotalAmount(response.totalAmount ?? null)
        setCurrency(response.currency ?? null)
        setSupplierTaxId(response.supplierTaxId ?? null)
        setIssueDate(response.issueDate ?? null)
        setReceiptImageKey(response.receiptImageKey ?? null)

        setHasScanned(true)

        if (!normalizedItems.length) {
          toast.info('Nenhum item reconhecido na nota. Ajuste manualmente ou tente outra foto.')
        } else if (unmatchedCount > 0) {
          toast.info(`${unmatchedCount} item(ns) requer(em) revisão manual antes de atualizar.`)
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Não foi possível processar a nota fiscal'
        setUploadError(message)
        setHasScanned(false)
        toast.error(message)
      } finally {
        setIsScanning(false)
      }
    },
    [findMatchingIngredient, token],
  )

  const handleTriggerCapture = useCallback((captureCamera: boolean) => {
    if (!fileInputRef.current) {
      return
    }
    if (captureCamera) {
      fileInputRef.current.setAttribute('capture', 'environment')
    } else {
      fileInputRef.current.removeAttribute('capture')
    }
    fileInputRef.current.click()
  }, [])

  const handleFileSelected = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) {
        return
      }

      setSelectedFileName(file.name)
      await processFile(file)
      // reset input value to allow re-selecting the same file
      event.target.value = ''
    },
    [processFile],
  )

  const handleToggleItem = useCallback((index: number) => {
    setScannedItems((prev) => {
      const next = prev.map((item, i) => {
        if (i !== index) return item

        if (!item.selected && item.ingredientId == null) {
          toast.error('Vincule um ingrediente antes de selecionar este item')
          return item
        }

        const toggled = { ...item, selected: !item.selected }

        if (!toggled.selected) {
          return toggled
        }

        return toggled
      })

      const current = next[index]

      if (current.selected && current.ingredientId != null) {
        return next.map((item, i) => {
          if (i === index) {
            return item
          }

          if (item.ingredientId === current.ingredientId) {
            return { ...item, selected: false }
          }

          return item
        })
      }

      return next
    })
  }, [])

  const handleUpdateItem = useCallback((index: number, field: 'newCost' | 'newAmount', value: string) => {
    const sanitized = value.replace(/,/g, '.')
    const parsed = Number.parseFloat(sanitized)
    const numValue = Number.isFinite(parsed) ? parsed : 0
    setScannedItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: numValue } : item)))
  }, [])

  const handleIngredientChange = useCallback((index: number, ingredientId: number | null) => {
    setScannedItems((prev) => {
      const next = prev.map((item, i) => {
        if (i !== index) return item

        if (ingredientId == null) {
          const updatedIssues = Array.from(
            new Set([...(item.issues ?? []).filter((issue) => issue !== 'unmatched_ingredient'), 'unmatched_ingredient']),
          )
          return {
            ...item,
            ingredientId: null,
            ingredientName: item.detectedName || 'Item sem correspondência',
            selected: false,
            autoMatched: false,
            issues: updatedIssues,
          }
        }

        const ingredient = ingredients.find((ing) => ing.id === ingredientId)
        const filteredIssues = (item.issues ?? []).filter((issue) => issue !== 'unmatched_ingredient')

        return {
          ...item,
          ingredientId,
          ingredientName: ingredient?.name ?? item.ingredientName,
          unit: ingredient?.unitOfMeasure ?? item.unit,
          selected: true,
          autoMatched: false,
          issues: filteredIssues.length ? filteredIssues : undefined,
        }
      })

      const current = next[index]

      if (current.selected && current.ingredientId != null) {
        return next.map((item, i) => {
          if (i === index) {
            return item
          }

          if (item.ingredientId === current.ingredientId) {
            return { ...item, selected: false }
          }

          return item
        })
      }

      return next
    })
  }, [ingredients])

  const handleConfirmUpdates = useCallback(async (): Promise<ConfirmedPurchaseData | null> => {
    const updates = scannedItems
      .filter((item) => item.selected && item.ingredientId != null)
      .map((item) => ({
        ingredientId: item.ingredientId as number,
        newCost: item.newCost,
        newAmount: item.newAmount,
      }))

    if (!updates.length) {
      toast.error('Selecione pelo menos um ingrediente válido para atualizar')
      return null
    }

    const invalidEntry = updates.find((item) => item.newCost <= 0 || item.newAmount <= 0)
    if (invalidEntry) {
      toast.error('Revise os valores: custo e quantidade devem ser maiores que zero')
      return null
    }

    return {
      updates,
      supplierName,
      supplierTaxId,
      invoiceNumber,
      issueDate,
      currency,
      totalAmount,
      receiptImageKey,
    }
  }, [currency, invoiceNumber, issueDate, receiptImageKey, scannedItems, supplierName, supplierTaxId, totalAmount])

  const selectedCount = useMemo(
    () => scannedItems.filter((item) => item.selected && item.ingredientId != null).length,
    [scannedItems],
  )

  const pendingItems = useMemo(
    () =>
      scannedItems.filter((item) => !item.autoMatched || item.issues?.length || item.ingredientId == null).length,
    [scannedItems],
  )

  const costPerUnit = useCallback((item: InvoiceItem) => {
    if (!item.newAmount || item.newAmount <= 0) {
      return '0.00'
    }
    return (item.newCost / item.newAmount).toFixed(2)
  }, [])

  const reset = useCallback(() => {
    setHasScanned(false)
    setScannedItems([])
    setSupplierName(null)
    setInvoiceNumber(null)
    setTotalAmount(null)
    setCurrency(null)
    setUploadError(null)
    setSelectedFileName(null)
    setSupplierTaxId(null)
    setIssueDate(null)
    setReceiptImageKey(null)
  }, [])

  return {
    state: {
      isScanning,
      hasScanned,
      scannedItems,
      supplierName,
      supplierTaxId,
      invoiceNumber,
      issueDate,
      currency,
      totalAmount,
      receiptImageKey,
      uploadError,
      selectedFileName,
    },
    fileInputRef,
    handleTriggerCapture,
    handleFileSelected,
    handleToggleItem,
    handleUpdateItem,
    handleIngredientChange,
    handleConfirmUpdates,
    selectedCount,
    pendingItems,
    costPerUnit,
    reset,
  }
}
