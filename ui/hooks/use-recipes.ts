import { useAuth } from "@/context/auth-context"
import { createRecipe, deleteRecipe, listRecipes, updateRecipe } from "@/lib/services/recipes"
import type { CreateRecipePayload, Recipe, UpdateRecipePayload } from "@/lib/types"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

type UpdatePayload = Partial<Omit<UpdateRecipePayload, "id">>

type CreateResult = Recipe | undefined

type UpdateResult = Recipe | undefined

export function useRecipes() {
  const { token } = useAuth()
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchRecipes = useCallback(async () => {
    if (!token) {
      setRecipes([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      const data = await listRecipes(token)
      setRecipes(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Não foi possível carregar as receitas"
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    void fetchRecipes()
  }, [fetchRecipes])

  const handleCreate = useCallback(
    async (payload: CreateRecipePayload): Promise<CreateResult> => {
      if (!token) {
        return undefined
      }

      setSaving(true)
      try {
        const recipe = await createRecipe(token, payload)
        setRecipes((prev) => [...prev, recipe])
        toast.success("Receita criada")
        return recipe
      } catch (err) {
        const message = err instanceof Error ? err.message : "Não foi possível criar a receita"
        toast.error(message)
        throw err
      } finally {
        setSaving(false)
      }
    },
    [token],
  )

  const handleUpdate = useCallback(
    async (id: number, payload: UpdatePayload): Promise<UpdateResult> => {
      if (!token) {
        return undefined
      }

      setSaving(true)
      try {
        const updated = await updateRecipe(token, id, payload)
        setRecipes((prev) => prev.map((recipe) => (recipe.id === updated.id ? updated : recipe)))
        toast.success("Receita atualizada")
        return updated
      } catch (err) {
        const message = err instanceof Error ? err.message : "Não foi possível atualizar a receita"
        toast.error(message)
        throw err
      } finally {
        setSaving(false)
      }
    },
    [token],
  )

  const handleDelete = useCallback(
    async (id: number) => {
      if (!token) {
        return
      }

      setSaving(true)
      try {
        await deleteRecipe(token, id)
        setRecipes((prev) => prev.filter((recipe) => recipe.id !== id))
        toast.success("Receita removida")
      } catch (err) {
        const message = err instanceof Error ? err.message : "Não foi possível remover a receita"
        toast.error(message)
        throw err
      } finally {
        setSaving(false)
      }
    },
    [token],
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
