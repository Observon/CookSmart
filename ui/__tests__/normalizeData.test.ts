import { describe, expect, it } from "vitest"

import { normalizeIngredient, normalizeIngredients } from "@/lib/services/ingredients"
import { normalizeRecipe, normalizeRecipes } from "@/lib/services/recipes"

import type { RawIngredient } from "@/lib/services/ingredients"
import type { RawRecipe } from "@/lib/services/recipes"

describe("normalizeIngredient", () => {
  it("converte campos numéricos fornecidos como string e garante defaults", () => {
    const raw: RawIngredient = {
      id: "12",
      name: "Farinha de trigo",
      unitOfMeasure: "kg",
      totalCost: "45.5",
      totalAmount: "25.25",
      costPerUnit: "1.8",
    }

    const ingredient = normalizeIngredient(raw)

    expect(ingredient).toEqual({
      id: 12,
      name: "Farinha de trigo",
      unitOfMeasure: "kg",
      totalCost: 45.5,
      totalAmount: 25.25,
      costPerUnit: 1.8,
      category: null,
    })
  })

  it("aplica valores padrão quando campos estão vazios ou ausentes", () => {
    const raw: RawIngredient = {
      id: "",
      name: null,
      unitOfMeasure: undefined,
      totalCost: " ",
      totalAmount: undefined,
      costPerUnit: "not-a-number",
      category: undefined,
    }

    const ingredient = normalizeIngredient(raw)

    expect(ingredient).toEqual({
      id: 0,
      name: "",
      unitOfMeasure: "",
      totalCost: 0,
      totalAmount: 0,
      costPerUnit: 0,
      category: null,
    })
  })

  it("normalizeIngredients lida com listas vazias ou indefinidas", () => {
    expect(normalizeIngredients()).toEqual([])
    expect(normalizeIngredients([])).toEqual([])

    const items = normalizeIngredients([
      {
        id: "1",
        name: "Açúcar",
        unitOfMeasure: "kg",
        totalCost: 10,
        totalAmount: 5,
        costPerUnit: 2,
      },
    ])

    expect(items).toHaveLength(1)
    expect(items[0].name).toBe("Açúcar")
  })
})

describe("normalizeRecipe", () => {
  const baseIngredient: RawIngredient = {
    id: "5",
    name: "Chocolate",
    unitOfMeasure: "kg",
    totalCost: "30.75",
    totalAmount: "10",
    costPerUnit: "3.075",
    category: "Doces",
  }

  it("normaliza valores de receita e converte ingredientes internos", () => {
    const raw: RawRecipe = {
      id: "42",
      name: "Bolo de chocolate",
      description: "Delicioso",
      servings: "12",
      suggestedPrice: "45.9",
      totalCost: "30.75",
      costPerServing: "2.5625",
      profitMargin: "",
      ingredients: [
        {
          id: "101",
          ingredientId: "5",
          quantity: "2.5",
          ingredient: baseIngredient,
        },
        {
          ingredientId: "8",
          quantity: "1.25",
          ingredient: {
            id: "8",
            name: "Farinha",
            unitOfMeasure: "kg",
            totalCost: "20",
            totalAmount: "10",
            costPerUnit: "2",
          },
        },
      ],
    }

    const recipe = normalizeRecipe(raw)

    expect(recipe).toMatchObject({
      id: 42,
      name: "Bolo de chocolate",
      description: "Delicioso",
      servings: 12,
      suggestedPrice: 45.9,
      totalCost: 30.75,
      costPerServing: 2.5625,
      profitMargin: 200,
    })

    expect(recipe.ingredients).toHaveLength(2)
    expect(recipe.ingredients[0]).toEqual({
      id: 101,
      ingredientId: 5,
      quantity: 2.5,
      ingredient: {
        id: 5,
        name: "Chocolate",
        unitOfMeasure: "kg",
        totalCost: 30.75,
        totalAmount: 10,
        costPerUnit: 3.075,
        category: "Doces",
      },
    })

    expect(recipe.ingredients[1]).toMatchObject({
      id: 428,
      ingredientId: 8,
      quantity: 1.25,
    })
  })

  it("usa valores padrão quando dados estão ausentes", () => {
    const recipe = normalizeRecipe({})

    expect(recipe).toEqual({
      id: 0,
      name: "",
      description: null,
      servings: 0,
      suggestedPrice: 0,
      totalCost: 0,
      costPerServing: 0,
      profitMargin: 200,
      ingredients: [],
    })
  })

  it("normalizeRecipes protege contra entradas inválidas", () => {
    const recipes = normalizeRecipes([
      {
        id: "7",
        name: "Test",
      },
      null as unknown as RawRecipe,
    ])

    expect(recipes).toHaveLength(2)
    expect(recipes[0].id).toBe(7)
    expect(recipes[1]).toEqual({
      id: 0,
      name: "",
      description: null,
      servings: 0,
      suggestedPrice: 0,
      totalCost: 0,
      costPerServing: 0,
      profitMargin: 200,
      ingredients: [],
    })

    expect(normalizeRecipes(undefined)).toEqual([])
  })
})
