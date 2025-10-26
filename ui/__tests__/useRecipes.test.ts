import { renderHook, act, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const { apiFetchMock, ApiErrorMock, toastMock } = vi.hoisted(() => {
  class MockApiError extends Error {
    constructor(message: string, public status: number) {
      super(message)
      this.name = "ApiError"
    }
  }

  return {
    apiFetchMock: vi.fn(),
    ApiErrorMock: MockApiError,
    toastMock: {
      success: vi.fn(),
      error: vi.fn(),
    },
  }
})

vi.mock("@/lib/http", () => ({
  apiFetch: apiFetchMock,
  ApiError: ApiErrorMock,
}))

const logoutMock = vi.fn()

vi.mock("@/context/auth-context", () => ({
  useAuth: () => ({
    user: { id: 1, name: "Tester", email: "tester@example.com" },
    token: "test-token",
    logout: logoutMock,
    loading: false,
    initializing: false,
  }),
}))

vi.mock("sonner", () => ({
  toast: toastMock,
}))

import { useRecipes } from "@/hooks/use-recipes"

describe("useRecipes", () => {
  beforeEach(() => {
    apiFetchMock.mockReset()
    logoutMock.mockReset()
    toastMock.success.mockReset()
    toastMock.error.mockReset()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it("carrega receitas no mount", async () => {
    const recipesResponse = [
      {
        id: 1,
        name: "Bolo",
        description: null,
        servings: 10,
        suggestedPrice: 15,
        totalCost: 8,
        costPerServing: 0.8,
        profitMargin: 120,
        ingredients: [],
      },
    ]

    apiFetchMock.mockResolvedValueOnce(recipesResponse)

    const { result } = renderHook(() => useRecipes())

    await waitFor(() => expect(result.current.recipes).toEqual(recipesResponse))
    expect(apiFetchMock).toHaveBeenCalledWith("/recipes", expect.objectContaining({ token: "test-token" }))
  })

  it("cria receita e atualiza estado", async () => {
    const existing = [
      {
        id: 1,
        name: "Bolo",
        description: null,
        servings: 10,
        suggestedPrice: 15,
        totalCost: 8,
        costPerServing: 0.8,
        profitMargin: 120,
        ingredients: [],
      },
    ]

    const created = {
      id: 2,
      name: "Torta",
      description: "Torta salgada",
      servings: 6,
      suggestedPrice: 30,
      totalCost: 12,
      costPerServing: 2,
      profitMargin: 150,
      ingredients: [],
    }

    apiFetchMock
      .mockResolvedValueOnce(existing)
      .mockResolvedValueOnce(created)

    const { result } = renderHook(() => useRecipes())

    await waitFor(() => expect(result.current.recipes).toEqual(existing))

    await act(async () => {
      await result.current.createRecipe({
        name: created.name,
        description: created.description ?? undefined,
        servings: created.servings,
        profitMargin: created.profitMargin,
        ingredients: [],
      })
    })

    expect(apiFetchMock).toHaveBeenLastCalledWith(
      "/recipes",
      expect.objectContaining({
        method: "POST",
        token: "test-token",
      }),
    )

    await waitFor(() => expect(result.current.recipes).toEqual([...existing, created]))
    expect(toastMock.success).toHaveBeenCalledWith("Receita criada")
  })

  it("efetua logout automático em respostas 401", async () => {
    apiFetchMock.mockRejectedValueOnce(new ApiErrorMock("Sessão expirada. Entre novamente para continuar.", 401))

    const { result } = renderHook(() => useRecipes())

    await waitFor(() => expect(result.current.error).toBe("Sessão expirada. Entre novamente para continuar."))
    expect(logoutMock).toHaveBeenCalled()
    expect(toastMock.error).toHaveBeenCalledWith("Sessão expirada. Entre novamente para continuar.")
    expect(result.current.recipes).toEqual([])
  })
})
