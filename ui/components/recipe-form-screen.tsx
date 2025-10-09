"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type {
  CreateRecipePayload,
  Ingredient,
  Recipe,
  UpdateRecipePayload,
} from "@/lib/types";
import { ArrowLeft, DollarSign, Plus, Trash2 } from "lucide-react";

interface RecipeFormScreenProps {
  ingredients: Ingredient[];
  onSave: (
    payload: CreateRecipePayload | (UpdateRecipePayload & { id: number })
  ) => Promise<void>;
  onCancel: () => void;
  onAddIngredient: () => void;
  editingRecipe?: Recipe | null;
  loading?: boolean;
}

interface SelectedIngredient {
  ingredientId: number;
  ingredient: Ingredient;
  quantity: number;
}

function buildInitialSelectedIngredients(
  recipe?: Recipe | null
): SelectedIngredient[] {
  if (!recipe) {
    return [];
  }

  return recipe.ingredients.map((detail) => ({
    ingredientId: detail.ingredientId,
    ingredient: detail.ingredient,
    quantity: detail.quantity,
  }));
}

//Função que irá arredondar um número para 2 casas decimais
function round2(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100) / 100;
}

export function RecipeFormScreen({
  ingredients,
  onSave,
  onCancel,
  onAddIngredient,
  editingRecipe,
  loading,
}: RecipeFormScreenProps) {
  const [name, setName] = useState(editingRecipe?.name ?? "");
  const [description, setDescription] = useState(
    editingRecipe?.description ?? ""
  );
  const [servings, setServings] = useState(
    editingRecipe ? String(editingRecipe.servings) : ""
  );

  const [profitMargin, setProfitMargin] = useState(
    editingRecipe?.profitMargin !== undefined
      ? String(editingRecipe.profitMargin)
      : "200",
  );

  const normalizedProfitMargin = useMemo(() => {
    const parsed = Number.parseFloat(profitMargin);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 200;
  }, [profitMargin]);

  const [selectedIngredients, setSelectedIngredients] = useState<
    SelectedIngredient[]
  >(buildInitialSelectedIngredients(editingRecipe));
  const [showIngredientSelector, setShowIngredientSelector] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleAddIngredient = (ingredient: Ingredient) => {
    const exists = selectedIngredients.some(
      (item) => item.ingredientId === ingredient.id
    );
    if (exists) {
      setShowIngredientSelector(false);
      return;
    }

    setSelectedIngredients([
      ...selectedIngredients,
      {
        ingredientId: ingredient.id,
        ingredient,
        quantity: 0,
      },
    ]);

    setShowIngredientSelector(false);
  };

  const handleUpdateIngredientQuantity = (
    ingredientId: number,
    quantity: number
  ) => {
    setSelectedIngredients((prev) =>
      prev.map((item) =>
        item.ingredientId === ingredientId ? { ...item, quantity } : item
      )
    );
  };

  const handleRemoveIngredient = (ingredientId: number) => {
    setSelectedIngredients((prev) =>
      prev.filter((item) => item.ingredientId !== ingredientId)
    );
  };

  const totalCost = useMemo(() => {
    return selectedIngredients.reduce(
      (acc, item) => acc + item.quantity * item.ingredient.costPerUnit,
      0
    );
  }, [selectedIngredients]);

  const parsedServings = Number.parseInt(servings);
  // custo por porção bruto
  const costPerServingRaw = useMemo(() => {
    if (!Number.isFinite(parsedServings) || parsedServings <= 0) return 0;
    return totalCost / parsedServings;
  }, [parsedServings, totalCost]);

  // custo por porção ARREDONDADO: usar em TODO o restante
  const costPerServing = useMemo(
    () => round2(costPerServingRaw),
    [costPerServingRaw]
  );

  // compute suggested price from profitMargin (%) and costPerServing
  const effectiveSuggestedPrice = useMemo(() => {
    if (costPerServing > 0) {
      return costPerServing * (1 + normalizedProfitMargin / 100);
    }
    if (totalCost > 0) {
      return totalCost * (1 + normalizedProfitMargin / 100);
    }
    return 0;
  }, [normalizedProfitMargin, costPerServing, totalCost]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!name.trim()) {
      return;
    }

    if (!Number.isFinite(parsedServings) || parsedServings <= 0) {
      return;
    }

    const cleanedIngredients = selectedIngredients
      .filter((item) => item.quantity > 0)
      .map((item) => ({
        ingredientId: item.ingredientId,
        quantity: item.quantity,
      }));

    if (cleanedIngredients.length === 0) {
      setShowIngredientSelector(true);
      return;
    }

    const payloadBase: CreateRecipePayload = {
      name: name.trim(),
      servings: parsedServings,
      description: description.trim() ? description.trim() : undefined,
      ingredients: cleanedIngredients,
      profitMargin: normalizedProfitMargin,
    };

    setSubmitting(true);
    try {
      if (editingRecipe) {
        await onSave({
          id: editingRecipe.id,
          ...payloadBase,
        });
      } else {
        await onSave(payloadBase);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const formDisabled = submitting || loading;

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
          <h1 className="text-2xl font-bold">
            {editingRecipe ? "Editar Receita" : "Nova Receita"}
          </h1>
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
            <Label htmlFor="description" className="text-foreground">
              Descrição (opcional)
            </Label>
            <Input
              id="description"
              placeholder="Notas sobre a receita"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-12 text-base bg-background"
            />
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            <Label className="text-foreground leading-tight">
              Quantas Porções Rende?
            </Label>
            <Label className="text-foreground leading-tight">
              Margem de Lucro (%)
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
            <Input
              id="profitMargin"
              type="number"
              step="0.1"
              min="0"
              placeholder="Ex: 200"
              value={profitMargin}
              onChange={(e) => setProfitMargin(e.target.value)}
              className="h-12 text-base bg-background"
            />
          </div>
        </Card>

        {/* Ingredients */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-lg font-semibold text-foreground">
              Ingredientes
            </Label>
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
              <p className="text-sm text-muted-foreground">
                Cadastre ingredientes primeiro
              </p>
            </Card>
          ) : (
            <>
              {selectedIngredients.length === 0 ? (
                <Card className="p-6 text-center bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-3">
                    Nenhum ingrediente adicionado
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setShowIngredientSelector(!showIngredientSelector)
                    }
                    className="text-primary border-primary"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Adicionar
                  </Button>
                </Card>
              ) : (
                <div className="space-y-3">
                  {selectedIngredients.map((item) => {
                    const itemCost =
                      item.quantity * item.ingredient.costPerUnit;

                    return (
                      <Card key={item.ingredientId} className="p-4 bg-card">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-semibold text-foreground">
                              {item.ingredient.name}
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              Custo: R$ {itemCost.toFixed(2)}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              handleRemoveIngredient(item.ingredientId)
                            }
                            className="text-destructive hover:bg-destructive/10"
                            disabled={formDisabled}
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
                            value={item.quantity ? String(item.quantity) : ""}
                            onChange={(event) =>
                              handleUpdateIngredientQuantity(
                                item.ingredientId,
                                Number.parseFloat(event.target.value) || 0
                              )
                            }
                            className="h-10 bg-background"
                            required
                            disabled={formDisabled}
                          />
                          <span className="text-sm text-muted-foreground whitespace-nowrap">
                            {item.ingredient.unitOfMeasure}
                          </span>
                        </div>
                      </Card>
                    );
                  })}

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-dashed border-primary text-primary hover:bg-primary/10 bg-transparent"
                    onClick={() =>
                      setShowIngredientSelector(!showIngredientSelector)
                    }
                    disabled={formDisabled}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Ingrediente
                  </Button>
                </div>
              )}

              {/* Ingredient Selector */}
              {showIngredientSelector && (
                <Card className="p-4 space-y-2 bg-card border-2 border-primary">
                  <p className="text-sm font-semibold text-foreground mb-2">
                    Selecione um ingrediente:
                  </p>
                  {ingredients
                    .filter(
                      (ing) =>
                        !selectedIngredients.find(
                          (s) => s.ingredientId === ing.id
                        )
                    )
                    .map((ing) => (
                      <button
                        key={ing.id}
                        type="button"
                        onClick={() => handleAddIngredient(ing)}
                        className="w-full text-left p-3 rounded-lg hover:bg-muted transition-colors"
                      >
                        <div className="font-medium text-foreground">
                          {ing.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          R$ {ing.costPerUnit.toFixed(2)} por{" "}
                          {ing.unitOfMeasure}
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
                <span className="text-lg font-bold text-foreground">
                  R$ {totalCost.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <span className="text-sm text-foreground">
                  Custo por Porção:
                </span>
                <div className="flex items-center gap-1">
                  {/* <DollarSign className="w-5 h-5 text-primary" /> */}
                  <span className="text-2xl font-bold text-primary">
                    R$ {costPerServing.toFixed(2)}
                  </span>
                </div>
              </div>
              {effectiveSuggestedPrice > 0 && (
                <p className="text-xs text-muted-foreground text-center pt-2">
                  Sugestão: venda por pelo menos R$ {effectiveSuggestedPrice.toFixed(2)} para ter lucro
                  de {normalizedProfitMargin.toFixed(2)}%
                </p>
              )}
            </div>
          </Card>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
          disabled={
            formDisabled ||
            !name ||
            !servings ||
            selectedIngredients.length === 0
          }
        >
          {submitting || loading
            ? "Salvando..."
            : editingRecipe
            ? "Salvar Alterações"
            : "Salvar Receita"}
        </Button>
      </form>
    </div>
  );
}
