"use client";

import { useEffect, useMemo, useState } from "react";
import { LoginScreen } from "@/components/login-screen";
import { RecipeListScreen } from "@/components/recipe-list-screen";
import { RecipeFormScreen } from "@/components/recipe-form-screen";
import type { RecipeFormDraft } from "@/components/recipe-form-screen";
import { IngredientFormScreen } from "@/components/ingredient-form-screen";
import { RecipeDetailScreen } from "@/components/recipe-detail-screen";
import { IngredientsListScreen } from "@/components/ingredients-list-screen";
import { AiScannerScreen } from "@/components/ai-scanner-screen";
import { OnboardingScreen } from "@/components/onboarding-screen";
import { TutorialOverlay } from "@/components/tutorial-overlay";
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
import {
  CreateIngredientPayload,
  CreatePurchasePayload,
  CreateRecipePayload,
  Recipe,
  UpdateIngredientPayload,
  UpdateRecipePayload,
} from '@/lib/types';

import { createPurchase } from "@/lib/services/purchases";
import { toast } from "sonner";

const ONBOARDING_COMPLETED_KEY = "cooksmart_onboarding_completed";
const TUTORIAL_COMPLETED_KEY = "cooksmart_tutorial_completed";

const TUTORIAL_STEPS = [
  {
    target: '[data-tutorial="welcome-header"]',
    title: "Visão geral",
    description: "Aqui você acompanha seu acesso e encontra atalhos importantes.",
    position: "bottom",
  },
  {
    target: '[data-tutorial="manage-ingredients"]',
    title: "Gerencie ingredientes",
    description: "Acesse sua lista de ingredientes para manter os custos atualizados.",
    position: "left",
  },
  {
    target: '[data-tutorial="recipes-list"]',
    title: "Suas receitas",
    description: "Visualize o custo, margem e preço sugerido de cada receita cadastrada.",
    position: "top",
  },
  {
    target: '[data-tutorial="add-recipe"]',
    title: "Cadastre receitas",
    description: "Use este botão para criar novas receitas e calcular seus custos.",
    position: "top",
  },
] satisfies Array<{
  target: string;
  title: string;
  description: string;
  position: "top" | "bottom" | "left" | "right";
}>;

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

const createEmptyRecipeDraft = (): RecipeFormDraft => ({
  name: "",
  description: "",
  servings: "",
  profitMargin: "200",
  selectedIngredients: [],
});

export default function Home() {
  const { token, user, logout, loading: authLoading, initializing } = useAuth();
  const {
    ingredients,
    saving: ingredientsSaving,
    refresh: refreshIngredients,
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
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [recipeDraft, setRecipeDraft] = useState<RecipeFormDraft>(
    createEmptyRecipeDraft()
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
      setShowOnboarding(false);
      setShowTutorial(false);
      return;
    }

    if (typeof window === "undefined") {
      return;
    }

    if (!user) {
      setPrevScreen(null);
      setRecipeDraft(createEmptyRecipeDraft());
      setShowOnboarding(false);
      setShowTutorial(false);
      return;
    }

    const onboardingKey = `${ONBOARDING_COMPLETED_KEY}_${user.id}`;
    const tutorialKey = `${TUTORIAL_COMPLETED_KEY}_${user.id}`;

    const onboardingCompleted =
      window.localStorage.getItem(onboardingKey) === "true";
    const tutorialCompleted =
      window.localStorage.getItem(tutorialKey) === "true";

    setShowOnboarding(!onboardingCompleted);
    setShowTutorial(onboardingCompleted && !tutorialCompleted);
  }, [token, user]);

  const getStorageKey = (baseKey: string) =>
    user ? `${baseKey}_${user.id}` : baseKey;

  const completeOnboarding = () => {
    if (typeof window !== "undefined") {
      const onboardingKey = getStorageKey(ONBOARDING_COMPLETED_KEY);
      const tutorialKey = getStorageKey(TUTORIAL_COMPLETED_KEY);
      window.localStorage.setItem(onboardingKey, "true");
      const tutorialCompleted = window.localStorage.getItem(tutorialKey) === "true";
      setShowTutorial(!tutorialCompleted);
    }
    setShowOnboarding(false);
  };

  const completeTutorial = () => {
    if (typeof window !== "undefined") {
      const tutorialKey = getStorageKey(TUTORIAL_COMPLETED_KEY);
      window.localStorage.setItem(tutorialKey, "true");
    }
    setShowTutorial(false);
  };

  const skipTutorial = () => {
    if (typeof window !== "undefined") {
      const tutorialKey = getStorageKey(TUTORIAL_COMPLETED_KEY);
      window.localStorage.setItem(tutorialKey, "true");
    }
    setShowTutorial(false);
  };

  const handleShowTutorial = () => {
    if (typeof window !== "undefined") {
      const onboardingKey = getStorageKey(ONBOARDING_COMPLETED_KEY);
      window.localStorage.setItem(onboardingKey, "true");
    }
    setShowOnboarding(false);
    setShowTutorial(true);
  };

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

    setPrevScreen(null);
    setCurrentScreen("list");
    setRecipeDraft(createEmptyRecipeDraft());
  };

  const handleEditRecipe = (recipe: Recipe) => {
    setEditingRecipeId(recipe.id);
    setRecipeDraft({
      name: recipe.name ?? "",
      description: recipe.description ?? "",
      servings: recipe.servings ? String(recipe.servings) : "",
      profitMargin: Number.isFinite(recipe.profitMargin)
        ? String(recipe.profitMargin)
        : "200",
      selectedIngredients: recipe.ingredients.map((detail) => {
        const freshIngredient =
          ingredients.find((item) => item.id === detail.ingredientId) ??
          detail.ingredient;

        return {
          ingredientId: detail.ingredientId,
          ingredient: freshIngredient,
          quantity: detail.quantity,
        };
      }),
    });
    setPrevScreen(null);
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

      // Recarrega o estado local para refletir os saldos recalculados no backend.
      await refreshIngredients();

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

  if (showOnboarding) {
    return <OnboardingScreen onComplete={completeOnboarding} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header
        className="flex items-center justify-between px-6 py-4 border-b border-border"
        data-tutorial="welcome-header"
      >
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
            setRecipeDraft(createEmptyRecipeDraft());
            setPrevScreen(null);
            setCurrentScreen("add-recipe");
          }}
          onViewRecipe={handleViewRecipe}
          onManageIngredients={() => setCurrentScreen("ingredients-list")}
          onShowTutorial={handleShowTutorial}
        />
      )}

      {showTutorial && currentScreen === "list" && (
        <TutorialOverlay
          steps={TUTORIAL_STEPS}
          onComplete={completeTutorial}
          onSkip={skipTutorial}
        />
      )}

      {currentScreen === "add-recipe" && (
        <RecipeFormScreen
          ingredients={ingredients}
          onSave={handleSaveRecipe}
          onCancel={() => {
            setEditingRecipeId(null);
            setRecipeDraft(createEmptyRecipeDraft());
            setPrevScreen(null);
            setCurrentScreen("list");
          }}
          onAddIngredient={() => {
            setPrevScreen("add-recipe");
            setEditingIngredientId(null);
            setCurrentScreen("add-ingredient");
          }}
          editingRecipe={editingRecipe}
          loading={recipesLoading || recipesSaving}
          draft={recipeDraft}
          onDraftChange={setRecipeDraft}
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
