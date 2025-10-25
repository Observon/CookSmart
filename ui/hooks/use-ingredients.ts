import type { CreateIngredientPayload, Ingredient, UpdateIngredientPayload } from "@/lib/types"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

import { useApi } from "@/hooks/use-api"

type UpdatePayload = Partial<Omit<UpdateIngredientPayload, "id">>

interface UpdateOptions {
  suppressToast?: boolean
}

export function useIngredients() {
  const api = useApi()
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchIngredients = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await api.request<Ingredient[]>("/ingredients")
      setIngredients(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Não foi possível carregar os ingredientes"
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [api])

  useEffect(() => {
    void fetchIngredients()
  }, [fetchIngredients])

  const handleCreate = useCallback(
    async (payload: CreateIngredientPayload) => {
      setSaving(true)
      try {
        const ingredient = await api.request<Ingredient>("/ingredients", {
          method: "POST",
          body: JSON.stringify(payload),
        })
        setIngredients((prev) => [...prev, ingredient])
        toast.success("Ingrediente criado")
        return ingredient
      } catch (err) {
        const message = err instanceof Error ? err.message : "Não foi possível criar o ingrediente"
        toast.error(message)
        throw err
      } finally {
        setSaving(false)
      }
    },
    [api],
  )

  const handleUpdate = useCallback(
    async (id: number, payload: UpdatePayload, options: UpdateOptions = {}) => {
      const { suppressToast = false } = options

      setSaving(true)
      try {
        const updated = await api.request<Ingredient>(`/ingredients/${id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        })
        setIngredients((prev) => prev.map((ingredient) => (ingredient.id === updated.id ? updated : ingredient)))
        if (!suppressToast) {
          toast.success("Ingrediente atualizado")
        }
        return updated
      } catch (err) {
        const message = err instanceof Error ? err.message : "Não foi possível atualizar o ingrediente"
        if (!suppressToast) {
          toast.error(message)
        }
        throw err
      } finally {
        setSaving(false)
      }
    },
    [api],
  )

  const handleDelete = useCallback(
    async (id: number) => {
      setSaving(true)
      try {
        await api.request(`/ingredients/${id}`, {
          method: "DELETE",
        })
        setIngredients((prev) => prev.filter((ingredient) => ingredient.id !== id))
        toast.success("Ingrediente removido")
      } catch (err) {
        const message = err instanceof Error ? err.message : "Não foi possível remover o ingrediente"
        toast.error(message)
        throw err
      } finally {
        setSaving(false)
      }
    },
    [api],
  )

  return {
    ingredients,
    loading,
    saving,
    error,
    refresh: fetchIngredients,
    createIngredient: handleCreate,
    updateIngredient: handleUpdate,
    deleteIngredient: handleDelete,
  }
}
