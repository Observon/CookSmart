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
import type {
  CreateIngredientPayload,
  CreateRecipePayload,
  Recipe,
  UpdateIngredientPayload,
  UpdateRecipePayload,
} from "@/lib/types";

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

  const handleDeleteRecipe = (recipeId: number) => {
    void deleteRecipe(recipeId);
    if (selectedRecipeId === recipeId) {
      setSelectedRecipeId(null);
    }
    if (editingRecipeId === recipeId) {
      setEditingRecipeId(null);
    }
    setCurrentScreen("list");
  };

  const handleViewRecipe = (recipe: Recipe) => {
    setSelectedRecipeId(recipe.id);
    setCurrentScreen("recipe-detail");
  };

  const handleUpdateIngredientPrices = (
    updates: Array<{ ingredientId: number; newCost: number; newAmount: number }>
  ) => {
    void Promise.all(
      updates.map((update) =>
        updateIngredient(update.ingredientId, {
          totalCost: update.newCost,
          totalAmount: update.newAmount,
        })
      )
    );
    setCurrentScreen("ingredients-list");
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
        />
      )}

      {currentScreen === "recipe-detail" && selectedRecipe && (
        <RecipeDetailScreen
          recipe={selectedRecipe}
          onBack={() => setCurrentScreen("list")}
          onEdit={() => handleEditRecipe(selectedRecipe)}
          onDelete={() => handleDeleteRecipe(selectedRecipe.id)}
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
          editingIngredient={editingIngredient}
          loading={ingredientsSaving}
        />
      )}

      {currentScreen === "ai-scanner" && (
        <AiScannerScreen
          ingredients={ingredients}
          onBack={() => setCurrentScreen("ingredients-list")}
          onUpdatePrices={handleUpdateIngredientPrices}
        />
      )}
    </div>
  );
}
