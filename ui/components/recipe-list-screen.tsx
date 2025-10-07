"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ChefHat, Plus, DollarSign, Package } from "lucide-react"
import type { Recipe } from "@/lib/types"

interface RecipeListScreenProps {
  recipes: Recipe[]
  onAddRecipe: () => void
  onViewRecipe: (recipe: Recipe) => void
  onManageIngredients: () => void
}

export function RecipeListScreen({ recipes, onAddRecipe, onViewRecipe, onManageIngredients }: RecipeListScreenProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground px-6 py-8 rounded-b-3xl shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary-foreground/20 flex items-center justify-center">
              <ChefHat className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Minhas Receitas</h1>
              <p className="text-sm text-primary-foreground/80">
                {recipes.length} {recipes.length === 1 ? "receita" : "receitas"}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onManageIngredients}
            className="text-primary-foreground hover:bg-primary-foreground/20"
          >
            <Package className="w-6 h-6" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6 space-y-4">
        {recipes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
              <ChefHat className="w-12 h-12 text-muted-foreground" />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-xl font-semibold text-foreground">Nenhuma receita ainda</h2>
              <p className="text-muted-foreground text-pretty max-w-xs">
                Comece cadastrando sua primeira receita para calcular os custos
              </p>
            </div>
            <Button
              onClick={onAddRecipe}
              className="mt-4 h-12 px-8 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Plus className="w-5 h-5 mr-2" />
              Cadastrar Receita
            </Button>
          </div>
        ) : (
          <>
            {recipes.map((recipe) => (
              <Card
                key={recipe.id}
                className="p-5 cursor-pointer hover:shadow-md transition-shadow bg-card"
                onClick={() => onViewRecipe(recipe)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground mb-1">{recipe.name}</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      {recipe.servings} {recipe.servings === 1 ? "porção" : "porções"}
                    </p>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <DollarSign className="w-4 h-4" />
                        <span>Custo total:</span>
                        <span className="font-semibold text-foreground">R$ {recipe.totalCost.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Preço sugerido:</span>
                        <span className="font-semibold text-primary">
                          R$ {(recipe.suggestedPrice ?? recipe.costPerServing * 3).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground mb-1">Por porção</div>
                    <div className="text-2xl font-bold text-primary">R$ {recipe.costPerServing.toFixed(2)}</div>
                  </div>
                </div>
              </Card>
            ))}

            {/* Floating Action Button */}
            <Button
              onClick={onAddRecipe}
              className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Plus className="w-6 h-6" />
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
