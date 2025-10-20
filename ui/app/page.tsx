"use client";

import { useEffect, useMemo, useState } from "react";
import { LoginScreen } from "@/components/login-screen";
import { RecipeListScreen } from "@/components/recipe-list-screen";
import { RecipeFormScreen } from "@/components/recipe-form-screen";
import { IngredientFormScreen } from "@/components/ingredient-form-screen";
import { RecipeDetailScreen } from "@/components/recipe-detail-screen";
import { IngredientsListScreen } from "@/components/ingredients-list-screen";
import { AiScannerScreen } from "@/components/ai-scanner-screen";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { useIngredients } from "@/hooks/use-ingredients";
import { useRecipes } from "@/hooks/use-recipes";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type {
  CreateIngredientPayload,
  CreateRecipePayload,
  Recipe,
  UpdateIngredientPayload,
  UpdateRecipePayload,
  CreatePurchasePayload,
} from "@/lib/types";

import { createPurchase } from "@/lib/services/purchases";
import { toast } from "sonner";

const roundTo = (value: number, decimals: number) => {
  if (!Number.isFinite(value)) {
    return 0;
  }
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

export const normalizePurchaseDate = (rawDate?: string | null) => {
  if (!rawDate) {
    return new Date().toISOString().slice(0, 10);
  }

  const trimmed = rawDate.trim();
  if (!trimmed) {
    return new Date().toISOString().slice(0, 10);
  }

  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return `${year}-${month}-${day}`;
  }

  const brMatch = trimmed.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/);
  if (brMatch) {
    const [, day, month, year] = brMatch;
    return `${year}-${month}-${day}`;
  }

  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return new Date().toISOString().slice(0, 10);
};

export default function Home() {
  const { token, user, logout, loading: authLoading, initializing } = useAuth();
  const {
    ingredients,
    loading: ingredientsLoading,
    saving: ingredientsSaving,
    createIngredient,
    updateIngredient,
    deleteIngredient,
  } = useIngredients();
  const {
    recipes,
    loading: recipesLoading,
    saving: recipesSaving,
    createRecipe,
    updateRecipe,
    deleteRecipe,
  } = useRecipes();
  const [currentScreen, setCurrentScreen] = useState<
    | "list"
    | "add-recipe"
    | "add-ingredient"
    | "recipe-detail"
    | "ingredients-list"
    | "edit-ingredient"
    | "ai-scanner"
  >("list");
  const [prevScreen, setPrevScreen] = useState<typeof currentScreen | null>(
    null
  );
  const [selectedRecipeId, setSelectedRecipeId] = useState<number | null>(null);
  const [editingRecipeId, setEditingRecipeId] = useState<number | null>(null);
  const [editingIngredientId, setEditingIngredientId] = useState<number | null>(
    null
  );
  const [recipeToDelete, setRecipeToDelete] = useState<number | null>(null);
  const [ingredientToDelete, setIngredientToDelete] = useState<number | null>(
    null
  );

  const selectedRecipe = useMemo<Recipe | null>(
    () =>
      selectedRecipeId != null
        ? recipes.find((recipe) => recipe.id === selectedRecipeId) ?? null
        : null,
    [recipes, selectedRecipeId]
  );

  const editingRecipe = useMemo<Recipe | null>(
    () =>
      editingRecipeId != null
        ? recipes.find((recipe) => recipe.id === editingRecipeId) ?? null
        : null,
    [recipes, editingRecipeId]
  );

  const editingIngredient = useMemo(
    () =>
      editingIngredientId != null
        ? ingredients.find(
            (ingredient) => ingredient.id === editingIngredientId
          ) ?? null
        : null,
    [ingredients, editingIngredientId]
  );

  useEffect(() => {
    if (!token) {
      setCurrentScreen("list");
      setSelectedRecipeId(null);
      setEditingRecipeId(null);
      setEditingIngredientId(null);
    }
  }, [token]);

  const handleSaveIngredient = async (
    payload: CreateIngredientPayload | UpdateIngredientPayload
  ) => {
    if ("id" in payload) {
      const { id, ...rest } = payload;
      await updateIngredient(id, rest);
    } else {
      await createIngredient(payload);
    }

    // return to previous screen where the user came from
    setCurrentScreen(prevScreen ?? "ingredients-list");
    setPrevScreen(null);
    setEditingIngredientId(null);
  };

  const handleSaveRecipe = async (
    payload: CreateRecipePayload | (UpdateRecipePayload & { id: number })
  ) => {
    if ("id" in payload) {
      const { id, ...rest } = payload;
      await updateRecipe(id, rest);
      setEditingRecipeId(null);
      setSelectedRecipeId(id);
    } else {
      const recipe = await createRecipe(payload);
      if (recipe) {
        setSelectedRecipeId(recipe.id);
      }
    }

    setCurrentScreen("list");
  };

  const handleEditRecipe = (recipe: Recipe) => {
    setEditingRecipeId(recipe.id);
    setCurrentScreen("add-recipe");
  };

  const handleDeleteRecipe = async (recipeId: number) => {
    try {
      await deleteRecipe(recipeId);
      if (selectedRecipeId === recipeId) {
        setSelectedRecipeId(null);
      }
      if (editingRecipeId === recipeId) {
        setEditingRecipeId(null);
      }
      setCurrentScreen("list");
      setRecipeToDelete(null);
    } catch (error) {
      const message = error instanceof Error 
        ? error.message 
        : "Erro ao excluir a receita";
      toast.error(message);
      setRecipeToDelete(null);
    }
  };

  const handleViewRecipe = (recipe: Recipe) => {
    setSelectedRecipeId(recipe.id);
    setCurrentScreen("recipe-detail");
  };

  const handleUpdateIngredientPrices = async ({
    updates,
    supplierName,
    supplierTaxId,
    invoiceNumber,
    issueDate,
    currency,
    totalAmount,
    receiptImageKey,
  }: {
    updates: Array<{ ingredientId: number; newCost: number; newAmount: number }>;
    supplierName?: string | null;
    supplierTaxId?: string | null;
    invoiceNumber?: string | null;
    issueDate?: string | null;
    currency?: string | null;
    totalAmount?: number | null;
    receiptImageKey?: string | null;
  }) => {
    if (!token) {
      toast.error("Sessão expirada. Entre novamente para atualizar os preços.");
      return;
    }

    try {
      const normalizedUpdates = updates.map((update) => ({
        ingredientId: update.ingredientId,
        newCost: roundTo(update.newCost, 2),
        newAmount: roundTo(update.newAmount, 4),
      }));

      await Promise.all(
        normalizedUpdates.map((update) =>
          updateIngredient(
            update.ingredientId,
            {
              totalCost: update.newCost,
              totalAmount: update.newAmount,
            },
            { suppressToast: true }
          )
        )
      );

      const fallbackTotal = normalizedUpdates.reduce((acc, item) => acc + item.newCost, 0);
      const normalizedTotalAmount =
        typeof totalAmount === "number" && Number.isFinite(totalAmount)
          ? totalAmount
          : fallbackTotal;

      const purchasePayload: CreatePurchasePayload = {
        purchaseDate: normalizePurchaseDate(issueDate),
        supplier: supplierName ?? undefined,
        supplierTaxId: supplierTaxId ?? undefined,
        invoiceNumber: invoiceNumber ?? undefined,
        currency: currency ?? undefined,
        totalAmount: Number.isFinite(normalizedTotalAmount) ? Number(normalizedTotalAmount.toFixed(2)) : undefined,
        receiptImage: receiptImageKey ?? undefined,
        items: normalizedUpdates.map((item) => ({
          ingredientId: item.ingredientId,
          quantity: item.newAmount,
          totalPrice: item.newCost,
        })),
      };

      await createPurchase(token, purchasePayload);
      toast.success("Preços e compra registrados com sucesso");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Não foi possível atualizar os preços a partir da nota fiscal";
      toast.error(message);
      throw error;
    } finally {
      setCurrentScreen("ingredients-list");
    }
  };

  const handleDeleteIngredient = async (ingredientId: number) => {
    try {
      await deleteIngredient(ingredientId);
      setEditingIngredientId(null);
      setCurrentScreen("ingredients-list");
      setIngredientToDelete(null);
    } catch (error) {
      const message = error instanceof Error 
        ? error.message 
        : "Erro ao excluir o ingrediente";
      toast.error(message);
      setIngredientToDelete(null);
    }
  };

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <span className="text-sm text-muted-foreground">
          Carregando sessão...
        </span>
      </div>
    );
  }

  if (!token) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div>
          <p className="text-sm text-muted-foreground">
            Bem-vindo{user ? `, ${user.name}` : ""}
          </p>
          {user?.email && (
            <p className="text-xs text-muted-foreground/80">{user.email}</p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={logout}
          disabled={authLoading}
        >
          Sair
        </Button>
      </header>
      {currentScreen === "list" && (
        <RecipeListScreen
          recipes={recipes}
          onAddRecipe={() => {
            setEditingRecipeId(null);
            setCurrentScreen("add-recipe");
          }}
          onViewRecipe={handleViewRecipe}
          onManageIngredients={() => setCurrentScreen("ingredients-list")}
        />
      )}

      {currentScreen === "add-recipe" && (
        <RecipeFormScreen
          ingredients={ingredients}
          onSave={handleSaveRecipe}
          onCancel={() => {
            setEditingRecipeId(null);
            setCurrentScreen("list");
          }}
          onAddIngredient={() => {
            setPrevScreen(currentScreen);
            setEditingIngredientId(null);
            setCurrentScreen("add-ingredient");
          }}
          editingRecipe={editingRecipe}
          loading={recipesLoading || recipesSaving}
        />
      )}

      {currentScreen === "add-ingredient" && (
        <IngredientFormScreen
          onSave={handleSaveIngredient}
          onCancel={() => {
            setEditingIngredientId(null);
            setCurrentScreen(prevScreen ?? "ingredients-list");
            setPrevScreen(null);
          }}
          editingIngredient={editingIngredient}
          loading={ingredientsSaving}
          existingIngredients={ingredients}
        />
      )}

      {currentScreen === "recipe-detail" && selectedRecipe && (
        <RecipeDetailScreen
          recipe={selectedRecipe}
          onBack={() => setCurrentScreen("list")}
          onEdit={() => handleEditRecipe(selectedRecipe)}
          onDelete={() => setRecipeToDelete(selectedRecipe.id)}
        />
      )}

      {currentScreen === "ingredients-list" && (
        <IngredientsListScreen
          ingredients={ingredients}
          onBack={() => setCurrentScreen("list")}
          onEditIngredient={(ingredient) => {
            setEditingIngredientId(ingredient.id);
            setCurrentScreen("edit-ingredient");
          }}
          onAddIngredient={() => {
            setPrevScreen(currentScreen);
            setEditingIngredientId(null);
            setCurrentScreen("add-ingredient");
          }}
          onScanInvoice={() => setCurrentScreen("ai-scanner")}
        />
      )}

      {currentScreen === "edit-ingredient" && editingIngredient && (
        <IngredientFormScreen
          onSave={handleSaveIngredient}
          onCancel={() => {
            setEditingIngredientId(null);
            setCurrentScreen("ingredients-list");
          }}
          onDelete={() => setIngredientToDelete(editingIngredient.id)}
          editingIngredient={editingIngredient}
          loading={ingredientsSaving}
          existingIngredients={ingredients}
        />
      )}

      {currentScreen === "ai-scanner" && (
        <AiScannerScreen
          ingredients={ingredients}
          onBack={() => setCurrentScreen("ingredients-list")}
          onUpdatePrices={handleUpdateIngredientPrices}
        />
      )}

      <AlertDialog
        open={recipeToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setRecipeToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir receita</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta receita? Esta ação não pode
              ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Não</AlertDialogCancel>
            <AlertDialogAction
              disabled={recipesSaving} // Desabilita o botão enquanto salva/deleta
              onClick={async () => {
                if (recipeToDelete !== null) {
                  await handleDeleteRecipe(recipeToDelete);
                }
              }}
              // className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {recipesSaving ? "Excluindo..." : "Sim, excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={ingredientToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setIngredientToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir ingrediente</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este ingrediente? Esta ação não
              pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Não</AlertDialogCancel>
            <AlertDialogAction
              disabled={ingredientsSaving}
              onClick={async () => {
                if (ingredientToDelete !== null) {
                  await handleDeleteIngredient(ingredientToDelete);
                }
              }}
              //className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {ingredientsSaving ? "Excluindo..." : "Sim, excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
