"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Plus, Trash2, DollarSign } from "lucide-react"
import type { Ingredient, Recipe, RecipeIngredient } from "@/app/page"

interface RecipeFormScreenProps {
  ingredients: Ingredient[]
  onSave: (recipe: Recipe) => void
  onCancel: () => void
  onAddIngredient: () => void
  editingRecipe?: Recipe | null
}

export function RecipeFormScreen({
  ingredients,
  onSave,
  onCancel,
  onAddIngredient,
  editingRecipe,
}: RecipeFormScreenProps) {
  const [name, setName] = useState(editingRecipe?.name || "")
  const [servings, setServings] = useState(editingRecipe?.servings.toString() || "")
  const [selectedIngredients, setSelectedIngredients] = useState<RecipeIngredient[]>(editingRecipe?.ingredients || [])
  const [showIngredientSelector, setShowIngredientSelector] = useState(false)

  const handleAddIngredient = (ingredient: Ingredient) => {
    const existing = selectedIngredients.find((i) => i.ingredientId === ingredient.id)
    if (!existing) {
      setSelectedIngredients([
        ...selectedIngredients,
        {
          ingredientId: ingredient.id,
          ingredientName: ingredient.name,
          amountUsed: 0,
          unit: ingredient.unit,
          cost: 0,
        },
      ])
    }
    setShowIngredientSelector(false)
  }

  const handleUpdateIngredientAmount = (ingredientId: string, amount: number) => {
    setSelectedIngredients(
      selectedIngredients.map((ing) => {
        if (ing.ingredientId === ingredientId) {
          const ingredient = ingredients.find((i) => i.id === ingredientId)
          const cost = ingredient ? (amount / ingredient.totalAmount) * ingredient.totalCost : 0
          return { ...ing, amountUsed: amount, cost }
        }
        return ing
      }),
    )
  }

  const handleRemoveIngredient = (ingredientId: string) => {
    setSelectedIngredients(selectedIngredients.filter((i) => i.ingredientId !== ingredientId))
  }

  const calculateTotalCost = () => {
    return selectedIngredients.reduce((sum, ing) => sum + ing.cost, 0)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const totalCost = calculateTotalCost()
    const recipe: Recipe = {
      id: editingRecipe?.id || Date.now().toString(),
      name,
      servings: Number.parseInt(servings),
      ingredients: selectedIngredients,
      totalCost,
      costPerServing: totalCost / Number.parseInt(servings),
    }
    onSave(recipe)
  }

  const totalCost = calculateTotalCost()
  const costPerServing = servings ? totalCost / Number.parseInt(servings) : 0

  return (
    <div className="min-h-screen bg-background pb-24">
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
          <h1 className="text-2xl font-bold">{editingRecipe ? "Editar Receita" : "Nova Receita"}</h1>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
        {/* Basic Info */}
        <Card className="p-5 space-y-4 bg-card">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-foreground">
              Nome da Receita
            </Label>
            <Input
              id="name"
              placeholder="Ex: Brigadeiro, Bolo de Cenoura..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12 text-base bg-background"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="servings" className="text-foreground">
              Quantas Porções Rende?
            </Label>
            <Input
              id="servings"
              type="number"
              min="1"
              placeholder="Ex: 20"
              value={servings}
              onChange={(e) => setServings(e.target.value)}
              className="h-12 text-base bg-background"
              required
            />
          </div>
        </Card>

        {/* Ingredients */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-lg font-semibold text-foreground">Ingredientes</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onAddIngredient}
              className="text-primary border-primary hover:bg-primary/10 bg-transparent"
            >
              <Plus className="w-4 h-4 mr-1" />
              Novo Ingrediente
            </Button>
          </div>

          {ingredients.length === 0 ? (
            <Card className="p-6 text-center bg-muted/50">
              <p className="text-sm text-muted-foreground">Cadastre ingredientes primeiro</p>
            </Card>
          ) : (
            <>
              {selectedIngredients.length === 0 ? (
                <Card className="p-6 text-center bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-3">Nenhum ingrediente adicionado</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowIngredientSelector(!showIngredientSelector)}
                    className="text-primary border-primary"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Adicionar
                  </Button>
                </Card>
              ) : (
                <div className="space-y-3">
                  {selectedIngredients.map((ing) => (
                    <Card key={ing.ingredientId} className="p-4 bg-card">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-foreground">{ing.ingredientName}</h4>
                          <p className="text-xs text-muted-foreground">Custo: R$ {ing.cost.toFixed(2)}</p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveIngredient(ing.ingredientId)}
                          className="text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="Quantidade"
                          value={ing.amountUsed || ""}
                          onChange={(e) =>
                            handleUpdateIngredientAmount(ing.ingredientId, Number.parseFloat(e.target.value) || 0)
                          }
                          className="h-10 bg-background"
                          required
                        />
                        <span className="text-sm text-muted-foreground whitespace-nowrap">{ing.unit}</span>
                      </div>
                    </Card>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-dashed border-primary text-primary hover:bg-primary/10 bg-transparent"
                    onClick={() => setShowIngredientSelector(!showIngredientSelector)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Ingrediente
                  </Button>
                </div>
              )}

              {/* Ingredient Selector */}
              {showIngredientSelector && (
                <Card className="p-4 space-y-2 bg-card border-2 border-primary">
                  <p className="text-sm font-semibold text-foreground mb-2">Selecione um ingrediente:</p>
                  {ingredients
                    .filter((ing) => !selectedIngredients.find((s) => s.ingredientId === ing.id))
                    .map((ing) => (
                      <button
                        key={ing.id}
                        type="button"
                        onClick={() => handleAddIngredient(ing)}
                        className="w-full text-left p-3 rounded-lg hover:bg-muted transition-colors"
                      >
                        <div className="font-medium text-foreground">{ing.name}</div>
                        <div className="text-xs text-muted-foreground">
                          R$ {ing.costPerUnit.toFixed(2)} por {ing.unit}
                        </div>
                      </button>
                    ))}
                </Card>
              )}
            </>
          )}
        </div>

        {/* Cost Summary */}
        {selectedIngredients.length > 0 && servings && (
          <Card className="p-5 bg-accent/50 border-accent">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Custo Total:</span>
                <span className="text-lg font-bold text-foreground">R$ {totalCost.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <span className="text-sm text-foreground">Custo por Porção:</span>
                <div className="flex items-center gap-1">
                  <DollarSign className="w-5 h-5 text-primary" />
                  <span className="text-2xl font-bold text-primary">{costPerServing.toFixed(2)}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground text-center pt-2">
                Sugestão: venda por pelo menos R$ {(costPerServing * 3).toFixed(2)} para ter lucro
              </p>
            </div>
          </Card>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
          disabled={!name || !servings || selectedIngredients.length === 0}
        >
          {editingRecipe ? "Salvar Alterações" : "Salvar Receita"}
        </Button>
      </form>
    </div>
  )
}
