import { useAuth } from "@/context/auth-context"
import { createIngredient, deleteIngredient, listIngredients, updateIngredient } from "@/lib/services/ingredients"
import type { CreateIngredientPayload, Ingredient, UpdateIngredientPayload } from "@/lib/types"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

type UpdatePayload = Partial<Omit<UpdateIngredientPayload, "id">>

interface UpdateOptions {
  suppressToast?: boolean
}

export function useIngredients() {
  const { token } = useAuth()
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchIngredients = useCallback(async () => {
    if (!token) {
      setIngredients([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      const data = await listIngredients(token)
      setIngredients(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Não foi possível carregar os ingredientes"
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    void fetchIngredients()
  }, [fetchIngredients])

  const handleCreate = useCallback(
    async (payload: CreateIngredientPayload) => {
      if (!token) {
        return
      }

      setSaving(true)
      try {
        const ingredient = await createIngredient(token, payload)
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
    [token],
  )

  const handleUpdate = useCallback(
    async (id: number, payload: UpdatePayload, options: UpdateOptions = {}) => {
      const { suppressToast = false } = options

      if (!token) {
        return
      }

      setSaving(true)
      try {
        const updated = await updateIngredient(token, id, payload)
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
    [token],
  )

  const handleDelete = useCallback(
    async (id: number) => {
      if (!token) {
        return
      }

      setSaving(true)
      try {
        await deleteIngredient(token, id)
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
    [token],
  )

  const mergeIngredients = useCallback((incoming: Ingredient[]) => {
    if (!incoming?.length) {
      return
    }

    setIngredients((prev) => {
      if (!prev.length) {
        return incoming.slice().sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
      }

      let changed = false
      const merged = [...prev]

      incoming.forEach((ingredient) => {
        const index = merged.findIndex((item) => item.id === ingredient.id)

        if (index === -1) {
          merged.push(ingredient)
          changed = true
          return
        }

        const existing = merged[index]
        if (
          existing.name !== ingredient.name ||
          existing.unitOfMeasure !== ingredient.unitOfMeasure ||
          existing.totalCost !== ingredient.totalCost ||
          existing.totalAmount !== ingredient.totalAmount ||
          existing.costPerUnit !== ingredient.costPerUnit ||
          existing.category !== ingredient.category
        ) {
          merged[index] = ingredient
          changed = true
        }
      })

      if (!changed) {
        return prev
      }

      return merged.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
    })
  }, [])

  return {
    ingredients,
    loading,
    saving,
    error,
    refresh: fetchIngredients,
    createIngredient: handleCreate,
    updateIngredient: handleUpdate,
    deleteIngredient: handleDelete,
    mergeIngredients,
  }
}
