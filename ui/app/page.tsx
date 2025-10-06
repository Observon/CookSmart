"use client"

import { useState } from "react"
import { LoginScreen } from "@/components/login-screen"
import { RecipeListScreen } from "@/components/recipe-list-screen"
import { RecipeFormScreen } from "@/components/recipe-form-screen"
import { IngredientFormScreen } from "@/components/ingredient-form-screen"
import { RecipeDetailScreen } from "@/components/recipe-detail-screen"
import { IngredientsListScreen } from "@/components/ingredients-list-screen"
import { AiScannerScreen } from "@/components/ai-scanner-screen"

export type Ingredient = {
  id: string
  name: string
  unit: string
  totalCost: number
  totalAmount: number
  costPerUnit: number
}

export type RecipeIngredient = {
  ingredientId: string
  ingredientName: string
  amountUsed: number
  unit: string
  cost: number
}

export type Recipe = {
  id: string
  name: string
  servings: number
  ingredients: RecipeIngredient[]
  totalCost: number
  costPerServing: number
}

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentScreen, setCurrentScreen] = useState<
    "list" | "add-recipe" | "add-ingredient" | "recipe-detail" | "ingredients-list" | "edit-ingredient" | "ai-scanner"
  >("list")
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null)
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null)

  const handleLogin = () => {
    setIsLoggedIn(true)
  }

  const handleAddRecipe = (recipe: Recipe) => {
    if (editingRecipe) {
      setRecipes(recipes.map((r) => (r.id === recipe.id ? recipe : r)))
      setEditingRecipe(null)
    } else {
      setRecipes([...recipes, recipe])
    }
    setCurrentScreen("list")
  }

  const handleAddIngredient = (ingredient: Ingredient) => {
    const existing = ingredients.find((i) => i.id === ingredient.id)
    if (existing) {
      setIngredients(ingredients.map((i) => (i.id === ingredient.id ? ingredient : i)))
    } else {
      setIngredients([...ingredients, ingredient])
    }
    setCurrentScreen(editingIngredient ? "ingredients-list" : "add-recipe")
    setEditingIngredient(null)
  }

  const handleEditRecipe = (recipe: Recipe) => {
    setEditingRecipe(recipe)
    setCurrentScreen("add-recipe")
  }

  const handleDeleteRecipe = (recipeId: string) => {
    setRecipes(recipes.filter((r) => r.id !== recipeId))
    setCurrentScreen("list")
  }

  const handleViewRecipe = (recipe: Recipe) => {
    setSelectedRecipe(recipe)
    setCurrentScreen("recipe-detail")
  }

  const handleUpdateIngredientPrices = (
    updates: Array<{ ingredientId: string; newCost: number; newAmount: number }>,
  ) => {
    setIngredients(
      ingredients.map((ingredient) => {
        const update = updates.find((u) => u.ingredientId === ingredient.id)
        if (update) {
          return {
            ...ingredient,
            totalCost: update.newCost,
            totalAmount: update.newAmount,
            costPerUnit: update.newCost / update.newAmount,
          }
        }
        return ingredient
      }),
    )
    setCurrentScreen("ingredients-list")
  }

  if (!isLoggedIn) {
    return <LoginScreen onLogin={handleLogin} />
  }

  return (
    <div className="min-h-screen bg-background">
      {currentScreen === "list" && (
        <RecipeListScreen
          recipes={recipes}
          onAddRecipe={() => {
            setEditingRecipe(null)
            setCurrentScreen("add-recipe")
          }}
          onViewRecipe={handleViewRecipe}
          onManageIngredients={() => setCurrentScreen("ingredients-list")}
        />
      )}

      {currentScreen === "add-recipe" && (
        <RecipeFormScreen
          ingredients={ingredients}
          onSave={handleAddRecipe}
          onCancel={() => setCurrentScreen("list")}
          onAddIngredient={() => setCurrentScreen("add-ingredient")}
          editingRecipe={editingRecipe}
        />
      )}

      {currentScreen === "add-ingredient" && (
        <IngredientFormScreen
          onSave={handleAddIngredient}
          onCancel={() => setCurrentScreen(editingIngredient ? "ingredients-list" : "add-recipe")}
          editingIngredient={editingIngredient}
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
            setEditingIngredient(ingredient)
            setCurrentScreen("edit-ingredient")
          }}
          onAddIngredient={() => {
            setEditingIngredient(null)
            setCurrentScreen("add-ingredient")
          }}
          onScanInvoice={() => setCurrentScreen("ai-scanner")}
        />
      )}

      {currentScreen === "edit-ingredient" && editingIngredient && (
        <IngredientFormScreen
          onSave={handleAddIngredient}
          onCancel={() => {
            setEditingIngredient(null)
            setCurrentScreen("ingredients-list")
          }}
          editingIngredient={editingIngredient}
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
  )
}
