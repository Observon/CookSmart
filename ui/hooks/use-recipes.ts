import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

import { UnauthorizedError, useApi } from "@/hooks/use-api"
import { normalizeRecipe, normalizeRecipes } from "@/lib/services/recipes"
import { useAuth } from "@/context/auth-context"
import type { CreateRecipePayload, Recipe, UpdateRecipePayload } from "@/lib/types"

type UpdatePayload = Partial<Omit<UpdateRecipePayload, "id">>

type CreateResult = Recipe | undefined

type UpdateResult = Recipe | undefined

export function useRecipes() {
  const { request } = useApi()
  const { token, initializing } = useAuth()
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchRecipes = useCallback(async () => {
    if (!token) {
      return
    }
    setLoading(true)
    setError(null)

    try {
      const data = await request<Recipe[]>("/recipes")
      setRecipes(normalizeRecipes(data as any) as Recipe[])
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        return
      }
      const message = err instanceof Error ? err.message : "Não foi possível carregar as receitas"
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [request, token])

  useEffect(() => {
    if (initializing || !token) {
      return
    }
    void fetchRecipes()
  }, [fetchRecipes, token, initializing])

  const handleCreate = useCallback(
    async (payload: CreateRecipePayload): Promise<CreateResult> => {
      setSaving(true)
      try {
        const recipe = await request<Recipe>("/recipes", {
          method: "POST",
          body: JSON.stringify(payload),
        })
        const normalized = normalizeRecipe(recipe as any)
        setRecipes((prev) => [...prev, normalized as Recipe])
        toast.success("Receita criada")
        return normalized as Recipe
      } catch (err) {
        if (err instanceof UnauthorizedError) {
          throw err
        }
        const message = err instanceof Error ? err.message : "Não foi possível criar a receita"
        toast.error(message)
        throw err
      } finally {
        setSaving(false)
      }
    },
    [request],
  )

  const handleUpdate = useCallback(
    async (id: number, payload: UpdatePayload): Promise<UpdateResult> => {
      setSaving(true)
      try {
        const updated = await request<Recipe>(`/recipes/${id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        })
        const normalized = normalizeRecipe(updated as any)
        setRecipes((prev) => prev.map((recipe) => (recipe.id === normalized.id ? (normalized as Recipe) : recipe)))
        toast.success("Receita atualizada")
        return normalized as Recipe
      } catch (err) {
        if (err instanceof UnauthorizedError) {
          throw err
        }
        const message = err instanceof Error ? err.message : "Não foi possível atualizar a receita"
        toast.error(message)
        throw err
      } finally {
        setSaving(false)
      }
    },
    [request],
  )

  const handleDelete = useCallback(
    async (id: number) => {
      setSaving(true)
      try {
        await request(`/recipes/${id}`, {
          method: "DELETE",
        })
        setRecipes((prev) => prev.filter((recipe) => recipe.id !== id))
        toast.success("Receita removida")
      } catch (err) {
        if (err instanceof UnauthorizedError) {
          throw err
        }
        const message = err instanceof Error ? err.message : "Não foi possível remover a receita"
        toast.error(message)
        throw err
      } finally {
        setSaving(false)
      }
    },
    [request],
  )

  return {
    recipes,
    loading,
    saving,
    error,
    refresh: fetchRecipes,
    createRecipe: handleCreate,
    updateRecipe: handleUpdate,
    deleteRecipe: handleDelete,
  }
}
