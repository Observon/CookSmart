"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft } from "lucide-react"
import type { Ingredient } from "@/app/page"

interface IngredientFormScreenProps {
  onSave: (ingredient: Ingredient) => void
  onCancel: () => void
  editingIngredient?: Ingredient | null
}

const UNITS = ["kg", "g", "L", "ml", "unidade", "dúzia", "xícara", "colher (sopa)", "colher (chá)"]

export function IngredientFormScreen({ onSave, onCancel, editingIngredient }: IngredientFormScreenProps) {
  const [name, setName] = useState("")
  const [unit, setUnit] = useState("")
  const [totalCost, setTotalCost] = useState("")
  const [totalAmount, setTotalAmount] = useState("")

  useEffect(() => {
    if (editingIngredient) {
      setName(editingIngredient.name)
      setUnit(editingIngredient.unit)
      setTotalCost(editingIngredient.totalCost.toString())
      setTotalAmount(editingIngredient.totalAmount.toString())
    }
  }, [editingIngredient])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const cost = Number.parseFloat(totalCost)
    const amount = Number.parseFloat(totalAmount)
    const ingredient: Ingredient = {
      id: editingIngredient?.id || Date.now().toString(),
      name,
      unit,
      totalCost: cost,
      totalAmount: amount,
      costPerUnit: cost / amount,
    }
    onSave(ingredient)
  }

  const costPerUnit =
    totalCost && totalAmount ? (Number.parseFloat(totalCost) / Number.parseFloat(totalAmount)).toFixed(2) : "0.00"

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground px-6 py-6 rounded-b-3xl shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            className="text-primary-foreground hover:bg-primary-foreground/20"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold">{editingIngredient ? "Editar Ingrediente" : "Novo Ingrediente"}</h1>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
        <Card className="p-5 space-y-4 bg-card">
          <div className="space-y-2">
            <Label htmlFor="ingredient-name" className="text-foreground">
              Nome do Ingrediente
            </Label>
            <Input
              id="ingredient-name"
              placeholder="Ex: Leite Condensado, Açúcar..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12 text-base bg-background"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="unit" className="text-foreground">
              Unidade de Medida
            </Label>
            <Select value={unit} onValueChange={setUnit} required>
              <SelectTrigger className="h-12 text-base bg-background">
                <SelectValue placeholder="Selecione a unidade" />
              </SelectTrigger>
              <SelectContent>
                {UNITS.map((u) => (
                  <SelectItem key={u} value={u}>
                    {u}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="total-cost" className="text-foreground">
                Custo Total (R$)
              </Label>
              <Input
                id="total-cost"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={totalCost}
                onChange={(e) => setTotalCost(e.target.value)}
                className="h-12 text-base bg-background"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="total-amount" className="text-foreground">
                Quantidade Total
              </Label>
              <Input
                id="total-amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                className="h-12 text-base bg-background"
                required
              />
            </div>
          </div>
        </Card>

        {/* Cost Preview */}
        {totalCost && totalAmount && (
          <Card className="p-5 bg-accent/50 border-accent">
            <div className="text-center space-y-1">
              <p className="text-sm text-muted-foreground">Custo por {unit || "unidade"}:</p>
              <p className="text-3xl font-bold text-primary">R$ {costPerUnit}</p>
            </div>
          </Card>
        )}

        {/* Example */}
        <Card className="p-4 bg-muted/50">
          <p className="text-xs text-muted-foreground mb-2 font-semibold">💡 Exemplo:</p>
          <p className="text-xs text-muted-foreground">
            Se você comprou 1kg de açúcar por R$ 5,00, preencha:
            <br />• Custo Total: 5.00
            <br />• Quantidade Total: 1000 (em gramas)
            <br />• Unidade: g
          </p>
        </Card>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          {editingIngredient ? "Atualizar Ingrediente" : "Salvar Ingrediente"}
        </Button>
      </form>
    </div>
  )
}
