"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"

import { apiFetch } from "@/lib/http"
import type { AuthResponse, AuthUser } from "@/lib/types"
import { toast } from "sonner"

type LoginCredentials = {
  email: string
  password: string
}

type RegisterPayload = LoginCredentials & {
  name: string
  phone?: string
}

interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  loading: boolean
  initializing: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  register: (data: RegisterPayload) => Promise<void>
  logout: () => void
}

const STORAGE_TOKEN_KEY = "cooksmart_token"
const STORAGE_USER_KEY = "cooksmart_user"

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    if (typeof window === "undefined") {
      setInitializing(false)
      return
    }

    const storedToken = window.localStorage.getItem(STORAGE_TOKEN_KEY)
    const storedUser = window.localStorage.getItem(STORAGE_USER_KEY)

    if (storedToken) {
      setToken(storedToken)
    }

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (error) {
        console.error("Erro ao carregar usuário salvo", error)
        window.localStorage.removeItem(STORAGE_USER_KEY)
      }
    }

    setInitializing(false)
  }, [])

  const persistSession = useCallback((session: AuthResponse) => {
    setToken(session.accessToken)
    setUser(session.user)

    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_TOKEN_KEY, session.accessToken)
      window.localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(session.user))
    }
  }, [])

  const clearSession = useCallback(() => {
    setToken(null)
    setUser(null)

    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_TOKEN_KEY)
      window.localStorage.removeItem(STORAGE_USER_KEY)
    }
  }, [])

  const login = useCallback(async (credentials: LoginCredentials) => {
    setLoading(true)
    try {
      const session = await apiFetch<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      })
      persistSession(session)
      toast.success("Login realizado com sucesso")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível entrar"
      toast.error(message)
      throw error
    } finally {
      setLoading(false)
    }
  }, [persistSession])

  const register = useCallback(async (data: RegisterPayload) => {
    setLoading(true)
    try {
      const session = await apiFetch<AuthResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
      })
      persistSession(session)
      toast.success("Conta criada com sucesso")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível criar a conta"
      toast.error(message)
      throw error
    } finally {
      setLoading(false)
    }
  }, [persistSession])

  const logout = useCallback(() => {
    clearSession()
    toast.success("Sessão encerrada")
  }, [clearSession])

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      initializing,
      login,
      register,
      logout,
    }),
    [user, token, loading, initializing, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth deve ser utilizado dentro de AuthProvider")
  }
  return context
}
