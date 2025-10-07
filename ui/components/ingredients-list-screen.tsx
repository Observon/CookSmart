"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Plus, Camera, DollarSign, Package } from "lucide-react"
import type { Ingredient } from "@/lib/types"

interface IngredientsListScreenProps {
  ingredients: Ingredient[]
  onBack: () => void
  onEditIngredient: (ingredient: Ingredient) => void
  onAddIngredient: () => void
  onScanInvoice: () => void
}

export function IngredientsListScreen({
  ingredients,
  onBack,
  onEditIngredient,
  onAddIngredient,
  onScanInvoice,
}: IngredientsListScreenProps) {
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
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Meus Ingredientes</h1>
            <p className="text-sm text-primary-foreground/80">
              {ingredients.length} {ingredients.length === 1 ? "ingrediente" : "ingredientes"}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6 space-y-4">
        {/* AI Scanner Card */}
        <Card
          className="p-5 cursor-pointer hover:shadow-md transition-shadow bg-gradient-to-br from-accent to-accent/50 border-accent"
          onClick={onScanInvoice}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <Camera className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-foreground mb-1">Escanear Nota Fiscal</h3>
              <p className="text-sm text-muted-foreground">Use IA para atualizar preços automaticamente</p>
            </div>
          </div>
        </Card>

        {/* Ingredients List */}
        {ingredients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
              <Package className="w-12 h-12 text-muted-foreground" />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-xl font-semibold text-foreground">Nenhum ingrediente ainda</h2>
              <p className="text-muted-foreground text-pretty max-w-xs">
                Cadastre ingredientes para usar nas suas receitas
              </p>
            </div>
            <Button
              onClick={onAddIngredient}
              className="mt-4 h-12 px-8 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Plus className="w-5 h-5 mr-2" />
              Adicionar Ingrediente
            </Button>
          </div>
        ) : (
          <>
            {ingredients.map((ingredient) => (
              <Card
                key={ingredient.id}
                className="p-5 cursor-pointer hover:shadow-md transition-shadow bg-card"
                onClick={() => onEditIngredient(ingredient)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground mb-1">{ingredient.name}</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      {ingredient.totalAmount} {ingredient.unitOfMeasure}
                    </p>
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Custo total:</span>
                      <span className="text-sm font-semibold text-foreground">
                        R$ {ingredient.totalCost.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground mb-1">Por {ingredient.unitOfMeasure}</div>
                    <div className="text-2xl font-bold text-primary">R$ {ingredient.costPerUnit.toFixed(2)}</div>
                  </div>
                </div>
              </Card>
            ))}
          </>
        )}
      </div>

      {/* Floating Action Button */}
      <Button
        onClick={onAddIngredient}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground"
      >
        <Plus className="w-6 h-6" />
      </Button>
    </div>
  )
}
