"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Edit, Trash2, DollarSign, TrendingUp } from "lucide-react"
import type { Recipe } from "@/app/page"

interface RecipeDetailScreenProps {
  recipe: Recipe
  onBack: () => void
  onEdit: () => void
  onDelete: () => void
}

export function RecipeDetailScreen({ recipe, onBack, onEdit, onDelete }: RecipeDetailScreenProps) {
  const suggestedPrice = recipe.costPerServing * 3

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-primary text-primary-foreground px-6 py-6 rounded-b-3xl shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="text-primary-foreground hover:bg-primary-foreground/20"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold">{recipe.name}</h1>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onEdit}
              className="text-primary-foreground hover:bg-primary-foreground/20"
            >
              <Edit className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              className="text-primary-foreground hover:bg-primary-foreground/20"
            >
              <Trash2 className="w-5 h-5" />
            </Button>
          </div>
        </div>
        <p className="text-primary-foreground/80">
          Rende {recipe.servings} {recipe.servings === 1 ? "porção" : "porções"}
        </p>
      </div>

      {/* Content */}
      <div className="px-6 py-6 space-y-6">
        {/* Cost Summary */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-5 bg-card">
            <p className="text-sm text-muted-foreground mb-1">Custo Total</p>
            <p className="text-2xl font-bold text-foreground">R$ {recipe.totalCost.toFixed(2)}</p>
          </Card>
          <Card className="p-5 bg-accent/50 border-accent">
            <p className="text-sm text-muted-foreground mb-1">Por Porção</p>
            <div className="flex items-center gap-1">
              <DollarSign className="w-5 h-5 text-primary" />
              <p className="text-2xl font-bold text-primary">{recipe.costPerServing.toFixed(2)}</p>
            </div>
          </Card>
        </div>

        {/* Pricing Suggestion */}
        <Card className="p-5 bg-gradient-to-br from-success/10 to-success/5 border-success/30">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5 text-success" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-1">Sugestão de Preço</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Para ter uma margem de lucro saudável, sugerimos vender cada porção por:
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-success">R$ {suggestedPrice.toFixed(2)}</span>
                <span className="text-sm text-muted-foreground">(lucro de 200%)</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Ingredients List */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Ingredientes</h2>
          <div className="space-y-2">
            {recipe.ingredients.map((ing) => (
              <Card key={ing.ingredientId} className="p-4 bg-card">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-foreground">{ing.ingredientName}</h4>
                    <p className="text-sm text-muted-foreground">
                      {ing.amountUsed} {ing.unit}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">R$ {ing.cost.toFixed(2)}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Profit Calculator */}
        <Card className="p-5 bg-muted/50">
          <h3 className="font-semibold text-foreground mb-3">Calculadora de Lucro</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Vendendo a R$ {suggestedPrice.toFixed(2)}:</span>
              <span className="font-semibold text-success">
                +R$ {(suggestedPrice - recipe.costPerServing).toFixed(2)} por porção
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-border">
              <span className="text-muted-foreground">Lucro total ({recipe.servings} porções):</span>
              <span className="font-bold text-success text-base">
                R$ {((suggestedPrice - recipe.costPerServing) * recipe.servings).toFixed(2)}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
