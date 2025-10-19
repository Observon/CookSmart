"use client"

import { useCallback, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Camera, Upload, Sparkles, Check, X, Loader2, AlertTriangle } from "lucide-react"
import type { Ingredient } from "@/lib/types"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/context/auth-context"
import { analyzeInvoice } from "@/lib/services/ocr"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface InvoiceItem {
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

const issueMessages: Record<string, string> = {
  missing_description: "Descrição ausente",
  missing_quantity: "Quantidade indefinida",
  missing_total: "Valor total indefinido",
  missing_unit_price: "Preço unitário ausente",
  low_confidence: "Confiança baixa",
  unmatched_ingredient: "Sem correspondência",
}

const issueVariant = (issue: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (issue) {
    case "low_confidence":
      return "secondary"
    case "unmatched_ingredient":
      return "outline"
    default:
      return "destructive"
  }
}

export interface ConfirmedPurchaseData {
  updates: Array<{ ingredientId: number; newCost: number; newAmount: number }>
  supplierName?: string | null
  supplierTaxId?: string | null
  invoiceNumber?: string | null
  issueDate?: string | null
  currency?: string | null
  totalAmount?: number | null
  receiptImageKey?: string | null
}

export interface AiScannerScreenProps {
  ingredients: Ingredient[]
  onBack: () => void
  onUpdatePrices: (data: ConfirmedPurchaseData) => Promise<void> | void
}

export function AiScannerScreen({ ingredients, onBack, onUpdatePrices }: AiScannerScreenProps) {
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
  const [saving, setSaving] = useState(false)

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

      let bestMatch: { ingredient: Ingredient; score: number } | null = null

      for (const candidate of normalizedIngredients) {
        if (!candidate.normalizedName) continue

        let score = 0
        if (normalizedDescription.includes(candidate.normalizedName)) {
          score = candidate.normalizedName.length
        } else {
          const candidateTokens = candidate.normalizedName
            .split(" ")
            .filter((token) => token.length >= 3)
          const descriptionTokens = normalizedDescription.split(" ")
          const matches = candidateTokens.filter((token) => descriptionTokens.includes(token))
          if (matches.length) {
            score = matches.reduce((sum, token) => sum + token.length, 0)
          }
        }

        if (score > 0 && (!bestMatch || score > bestMatch.score)) {
          bestMatch = { ingredient: candidate, score }
        }
      }

      return bestMatch?.ingredient ?? null
    },
    [normalizedIngredients],
  )

  const handleTriggerCapture = (captureCamera: boolean) => {
    if (!fileInputRef.current) {
      return
    }
    if (captureCamera) {
      fileInputRef.current.setAttribute("capture", "environment")
    } else {
      fileInputRef.current.removeAttribute("capture")
    }
    fileInputRef.current.click()
  }

  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    setSelectedFileName(file.name)
    await processFile(file)
    // reset input value to allow re-selecting the same file
    event.target.value = ""
  }

  const processFile = async (file: File) => {
    if (!token) {
      toast.error("Você precisa estar autenticado para usar o OCR")
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
          if (!issues.includes("unmatched_ingredient")) {
            issues.push("unmatched_ingredient")
          }

          const total = resolveValue(item.total, item.unitPrice, quantityForUnmatched)

          normalizedItems.push({
            ingredientId: null,
            ingredientName: item.description?.trim() || "Item sem correspondência",
            detectedName: item.description ?? "",
            newCost: total,
            newAmount: quantityForUnmatched ?? 0,
            unit: item.unit ?? "",
            confidence: item.confidence ?? 0,
            selected: false,
            autoMatched: false,
            issues,
          })
          continue
        }

        const total = resolveValue(item.total, item.unitPrice, quantityForMatched)
        const hasIssues = issues.length > 0

        normalizedItems.push({
          ingredientId: ingredientMatch.id,
          ingredientName: ingredientMatch.name,
          detectedName: item.description ?? "",
          newCost: total,
          newAmount: quantityForMatched,
          unit: item.unit ?? ingredientMatch.unitOfMeasure ?? "",
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
        toast.info("Nenhum item reconhecido na nota. Ajuste manualmente ou tente outra foto.")
      } else if (unmatchedCount > 0) {
        toast.info(`${unmatchedCount} item(ns) requer(em) revisão manual antes de atualizar.`)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível processar a nota fiscal"
      setUploadError(message)
      setHasScanned(false)
      toast.error(message)
    } finally {
      setIsScanning(false)
    }
  }

  const handleToggleItem = (index: number) => {
    setScannedItems((prev) => {
      const next = prev.map((item, i) => {
        if (i !== index) return item

        if (!item.selected && item.ingredientId == null) {
          toast.error("Vincule um ingrediente antes de selecionar este item")
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
  }

  const handleUpdateItem = (index: number, field: "newCost" | "newAmount", value: string) => {
    const sanitized = value.replace(/,/g, ".")
    const parsed = Number.parseFloat(sanitized)
    const numValue = Number.isFinite(parsed) ? parsed : 0
    setScannedItems(scannedItems.map((item, i) => (i === index ? { ...item, [field]: numValue } : item)))
  }

  const handleIngredientChange = (index: number, ingredientId: number | null) => {
    setScannedItems((prev) => {
      const next = prev.map((item, i) => {
        if (i !== index) return item

        if (ingredientId == null) {
          const updatedIssues = Array.from(
            new Set([...(item.issues ?? []).filter((issue) => issue !== "unmatched_ingredient"), "unmatched_ingredient"]),
          )
          return {
            ...item,
            ingredientId: null,
            ingredientName: item.detectedName || "Item sem correspondência",
            selected: false,
            autoMatched: false,
            issues: updatedIssues,
          }
        }

        const ingredient = ingredients.find((ing) => ing.id === ingredientId)
        const filteredIssues = (item.issues ?? []).filter((issue) => issue !== "unmatched_ingredient")

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
  }

  const handleConfirmUpdates = async () => {
    const updates = scannedItems
      .filter((item) => item.selected && item.ingredientId != null)
      .map((item) => ({
        ingredientId: item.ingredientId as number,
        newCost: item.newCost,
        newAmount: item.newAmount,
      }))

    if (!updates.length) {
      toast.error("Selecione pelo menos um ingrediente válido para atualizar")
      return
    }

    const invalidEntry = updates.find((item) => item.newCost <= 0 || item.newAmount <= 0)
    if (invalidEntry) {
      toast.error("Revise os valores: custo e quantidade devem ser maiores que zero")
      return
    }

    setSaving(true)
    try {
      await onUpdatePrices({
        updates,
        supplierName,
        supplierTaxId,
        invoiceNumber,
        issueDate,
        currency,
        totalAmount,
        receiptImageKey,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível registrar a compra"
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  const selectedCount = scannedItems.filter((item) => item.selected && item.ingredientId != null).length
  const needsAttentionCount = scannedItems.filter((item) => !item.autoMatched || item.issues?.length || item.ingredientId == null)
  const pendingItems = needsAttentionCount.length

  const costPerUnit = (item: InvoiceItem) => {
    if (!item.newAmount || item.newAmount <= 0) {
      return "0.00"
    }
    return (item.newCost / item.newAmount).toFixed(2)
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-primary text-primary-foreground px-6 py-6 rounded-b-3xl shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="text-primary-foreground hover:bg-primary-foreground/20"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Escanear Nota Fiscal</h1>
            <p className="text-sm text-primary-foreground/80">Atualize preços com IA</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6 space-y-4">
        {!hasScanned ? (
          <>
            {/* Upload Area */}
            <Card className="p-8 border-2 border-dashed border-muted-foreground/30 bg-muted/20">
              <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <Camera className="w-10 h-10 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-foreground">Tire uma foto da nota fiscal</h3>
                  <p className="text-sm text-muted-foreground text-pretty max-w-xs">
                    A IA irá identificar os ingredientes e atualizar os preços automaticamente
                  </p>
                </div>
                <div className="flex flex-col gap-3 w-full max-w-xs pt-4">
                  <Button
                    onClick={() => handleTriggerCapture(true)}
                    disabled={isScanning}
                    className="h-12 bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    {isScanning ? (
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    ) : (
                      <Camera className="w-5 h-5 mr-2" />
                    )}
                    {isScanning ? "Processando..." : "Tirar Foto"}
                  </Button>
                  <Button
                    onClick={() => handleTriggerCapture(false)}
                    disabled={isScanning}
                    variant="outline"
                    className="h-12 bg-transparent"
                  >
                    {isScanning ? (
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    ) : (
                      <Upload className="w-5 h-5 mr-2" />
                    )}
                    {isScanning ? "Processando..." : "Escolher da Galeria"}
                  </Button>
                  {uploadError && <p className="text-xs text-destructive">{uploadError}</p>}
                  {selectedFileName && (
                    <p className="text-xs text-muted-foreground">Último arquivo: {selectedFileName}</p>
                  )}
                </div>
              </div>
            </Card>

            {/* Info Card */}
            <Card className="p-4 bg-accent/30 border-accent">
              <div className="flex gap-3">
                <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">Como funciona:</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>1. Tire uma foto clara da nota fiscal</li>
                    <li>2. A IA identifica os ingredientes cadastrados</li>
                    <li>3. Revise e confirme as atualizações</li>
                    <li>4. Os preços são atualizados automaticamente</li>
                  </ul>
                </div>
              </div>
            </Card>
          </>
        ) : (
          <>
            {(supplierName || invoiceNumber || totalAmount || supplierTaxId || issueDate) && (
              <Card className="p-4 bg-card/80 border border-border/60">
                <div className="space-y-1 text-sm">
                  {supplierName && (
                    <div>
                      <span className="font-semibold text-foreground">Fornecedor:</span> {supplierName}
                    </div>
                  )}
                  {supplierTaxId && (
                    <div>
                      <span className="font-semibold text-foreground">Documento:</span> {supplierTaxId}
                    </div>
                  )}
                  {invoiceNumber && (
                    <div>
                      <span className="font-semibold text-foreground">Nota:</span> {invoiceNumber}
                    </div>
                  )}
                  {issueDate && (
                    <div>
                      <span className="font-semibold text-foreground">Emissão:</span> {issueDate}
                    </div>
                  )}
                  {typeof totalAmount === "number" && (
                    <div>
                      <span className="font-semibold text-foreground">Total:</span> {currency ?? "BRL"} {totalAmount.toFixed(2)}
                    </div>
                  )}
                  {selectedFileName && (
                    <div className="text-muted-foreground">Arquivo analisado: {selectedFileName}</div>
                  )}
                </div>
              </Card>
            )}

            {/* Scanned Items */}
            <Card className="p-4 bg-accent/30 border-accent space-y-2">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-primary" />
                <p className="text-sm font-semibold text-foreground">
                  {scannedItems.length}{" "}
                  {scannedItems.length === 1 ? "item reconhecido" : "itens reconhecidos"}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Prontos para atualização:</span>
                <Badge variant="secondary">{selectedCount}</Badge>
                {pendingItems > 0 && (
                  <span className="flex items-center gap-2 text-amber-600">
                    <AlertTriangle className="w-4 h-4" />
                    {pendingItems} {pendingItems === 1 ? "item requer atenção" : "itens requerem atenção"}
                  </span>
                )}
              </div>
            </Card>

            {scannedItems.map((item, index) => (
              <Card
                key={`${item.detectedName}-${index}`}
                className={cn(
                  "p-5 bg-card border",
                  !item.autoMatched || item.issues?.length || item.ingredientId == null
                    ? "border-amber-400 dark:border-amber-500"
                    : "border-border",
                )}
              >
                <div className="space-y-4">
                  {/* Header with checkbox */}
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={item.selected}
                      onCheckedChange={() => handleToggleItem(index)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div className="space-y-1">
                          <h3 className="text-lg font-semibold text-foreground">{item.ingredientName}</h3>
                          <p className="text-xs text-muted-foreground">Detectado: {item.detectedName}</p>
                          <div className="mt-2">
                            <label className="text-xs text-muted-foreground" htmlFor={`ingredient-select-${index}`}>
                              Vincular ao ingrediente
                            </label>
                            <select
                              id={`ingredient-select-${index}`}
                              value={item.ingredientId ?? ""}
                              onChange={(event) =>
                                handleIngredientChange(
                                  index,
                                  event.target.value ? Number.parseInt(event.target.value, 10) : null,
                                )
                              }
                              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                            >
                              <option value="">Selecionar ingrediente</option>
                              {ingredients.map((ingredient) => (
                                <option key={ingredient.id} value={ingredient.id}>
                                  {ingredient.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10">
                          <Sparkles className="w-3 h-3 text-primary" />
                          <span className="text-xs font-semibold text-primary">
                            {Math.round(item.confidence * 100)}%
                          </span>
                        </div>
                      </div>

                      {(!item.autoMatched || item.issues?.length || item.ingredientId == null) && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {!item.autoMatched && (
                            <Badge variant="outline" className="text-destructive border-destructive/40">
                              <AlertTriangle className="w-3 h-3" /> Revisar manualmente
                            </Badge>
                          )}
                          {item.issues?.map((issue) => (
                            <Badge key={`${issue}-${index}`} variant={issueVariant(issue)}>
                              {issueMessages[issue] ?? issue}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Editable fields */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground">Custo (R$)</label>
                          <Input
                            type="number"
                            step="0.01"
                            value={item.newCost}
                            onChange={(e) => handleUpdateItem(index, "newCost", e.target.value)}
                            className="h-10 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground">Quantidade ({item.unit})</label>
                          <Input
                            type="number"
                            step="0.01"
                            value={item.newAmount}
                            onChange={(e) => handleUpdateItem(index, "newAmount", e.target.value)}
                            className="h-10 text-sm"
                          />
                        </div>
                      </div>

                      {/* Cost per unit preview */}
                      <div className="mt-3 pt-3 border-t border-border">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Custo por {item.unit || "unidade"}:</span>
                          <span className="text-lg font-bold text-primary">R$ {costPerUnit(item)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}

            {/* Action Buttons */}
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-background border-t border-border space-y-3">
              <Button
                onClick={handleConfirmUpdates}
                disabled={selectedCount === 0 || isScanning || saving}
                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {saving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Check className="w-5 h-5 mr-2" />}
                {saving ? "Salvando..." : `Atualizar ${selectedCount} ${selectedCount === 1 ? "Ingrediente" : "Ingredientes"}`}
              </Button>
              <Button
                onClick={() => {
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
                }}
                variant="outline"
                className="w-full h-12"
              >
                <X className="w-5 h-5 mr-2" />
                Escanear Novamente
              </Button>
            </div>
          </>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,application/pdf"
        className="hidden"
        onChange={handleFileSelected}
      />
    </div>
  )
}

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
}

function resolveValue(total?: number | null, unitPrice?: number | null, quantity?: number | null): number {
  if (typeof total === "number" && Number.isFinite(total)) {
    return total
  }
  if (
    typeof unitPrice === "number" &&
    Number.isFinite(unitPrice) &&
    typeof quantity === "number" &&
    Number.isFinite(quantity) &&
    quantity > 0
  ) {
    return unitPrice * quantity
  }
  if (typeof unitPrice === "number" && Number.isFinite(unitPrice)) {
    return unitPrice
  }
  return 0
}
