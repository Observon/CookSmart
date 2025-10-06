"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Camera, Upload, Sparkles, Check, X } from "lucide-react"
import type { Ingredient } from "@/app/page"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"

interface InvoiceItem {
  ingredientId: string
  ingredientName: string
  detectedName: string
  newCost: number
  newAmount: number
  unit: string
  confidence: number
  selected: boolean
}

interface AiScannerScreenProps {
  ingredients: Ingredient[]
  onBack: () => void
  onUpdatePrices: (updates: Array<{ ingredientId: string; newCost: number; newAmount: number }>) => void
}

export function AiScannerScreen({ ingredients, onBack, onUpdatePrices }: AiScannerScreenProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [scannedItems, setScannedItems] = useState<InvoiceItem[]>([])
  const [hasScanned, setHasScanned] = useState(false)

  // Simulate AI scanning (in production, this would call an AI API)
  const handleScan = () => {
    setIsScanning(true)

    // Simulate scanning delay
    setTimeout(() => {
      // Mock detected items from invoice
      const mockDetectedItems: InvoiceItem[] = [
        {
          ingredientId: ingredients[0]?.id || "1",
          ingredientName: ingredients[0]?.name || "Açúcar",
          detectedName: "AÇUCAR CRISTAL 1KG",
          newCost: 4.99,
          newAmount: 1000,
          unit: "g",
          confidence: 0.95,
          selected: true,
        },
        {
          ingredientId: ingredients[1]?.id || "2",
          ingredientName: ingredients[1]?.name || "Leite",
          detectedName: "LEITE INTEGRAL 1L",
          newCost: 5.49,
          newAmount: 1,
          unit: "L",
          confidence: 0.92,
          selected: true,
        },
      ].filter((item) => ingredients.find((i) => i.id === item.ingredientId))

      setScannedItems(mockDetectedItems)
      setHasScanned(true)
      setIsScanning(false)
    }, 2000)
  }

  const handleToggleItem = (index: number) => {
    setScannedItems(scannedItems.map((item, i) => (i === index ? { ...item, selected: !item.selected } : item)))
  }

  const handleUpdateItem = (index: number, field: "newCost" | "newAmount", value: string) => {
    const numValue = Number.parseFloat(value) || 0
    setScannedItems(scannedItems.map((item, i) => (i === index ? { ...item, [field]: numValue } : item)))
  }

  const handleConfirmUpdates = () => {
    const updates = scannedItems
      .filter((item) => item.selected)
      .map((item) => ({
        ingredientId: item.ingredientId,
        newCost: item.newCost,
        newAmount: item.newAmount,
      }))
    onUpdatePrices(updates)
  }

  const selectedCount = scannedItems.filter((item) => item.selected).length

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
                    onClick={handleScan}
                    disabled={isScanning}
                    className="h-12 bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    <Camera className="w-5 h-5 mr-2" />
                    {isScanning ? "Escaneando..." : "Tirar Foto"}
                  </Button>
                  <Button onClick={handleScan} disabled={isScanning} variant="outline" className="h-12 bg-transparent">
                    <Upload className="w-5 h-5 mr-2" />
                    Escolher da Galeria
                  </Button>
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
            {/* Scanned Items */}
            <Card className="p-4 bg-accent/30 border-accent">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-primary" />
                <p className="text-sm font-semibold text-foreground">
                  {scannedItems.length}{" "}
                  {scannedItems.length === 1 ? "ingrediente identificado" : "ingredientes identificados"}
                </p>
              </div>
            </Card>

            {scannedItems.map((item, index) => (
              <Card key={item.ingredientId} className="p-5 bg-card">
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
                        <div>
                          <h3 className="text-lg font-semibold text-foreground">{item.ingredientName}</h3>
                          <p className="text-xs text-muted-foreground">Detectado: {item.detectedName}</p>
                        </div>
                        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10">
                          <Sparkles className="w-3 h-3 text-primary" />
                          <span className="text-xs font-semibold text-primary">
                            {Math.round(item.confidence * 100)}%
                          </span>
                        </div>
                      </div>

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
                          <span className="text-sm text-muted-foreground">Custo por {item.unit}:</span>
                          <span className="text-lg font-bold text-primary">
                            R$ {(item.newCost / item.newAmount).toFixed(2)}
                          </span>
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
                disabled={selectedCount === 0}
                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Check className="w-5 h-5 mr-2" />
                Atualizar {selectedCount} {selectedCount === 1 ? "Ingrediente" : "Ingredientes"}
              </Button>
              <Button
                onClick={() => {
                  setHasScanned(false)
                  setScannedItems([])
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
    </div>
  )
}
