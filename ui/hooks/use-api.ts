import { useCallback, useMemo, useState } from 'react'

import { useAuth } from '@/context/auth-context'
import { apiFetch } from '@/lib/http'

interface UseApiOptions {
  onUnauthorized?: () => void
}

interface UseApiResult {
  loading: boolean
  error: string | null
  request: <T>(path: string, init?: RequestInit) => Promise<T>
}

export function useApi(options: UseApiOptions = {}): UseApiResult {
  const { token } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const request = useCallback(
    async <T,>(path: string, init: RequestInit = {}): Promise<T> => {
      if (!token) {
        const unauthorizedError = new Error('Sessão expirada')
        setError(unauthorizedError.message)
        options.onUnauthorized?.()
        throw unauthorizedError
      }

      setLoading(true)
      setError(null)

      try {
        return await apiFetch<T>(path, {
          ...init,
          token,
        })
      } catch (err) {
        const normalizedError = err instanceof Error ? err : new Error('Erro desconhecido ao comunicar com a API')
        setError(normalizedError.message)
        throw normalizedError
      } finally {
        setLoading(false)
      }
    },
    [options, token],
  )

  return useMemo(
    () => ({
      loading,
      error,
      request,
    }),
    [loading, error, request],
  )
}
