import { useCallback, useMemo, useState } from 'react'

import { useAuth } from '@/context/auth-context'
import { ApiError, apiFetch } from '@/lib/http'

interface UseApiOptions {
  onUnauthorized?: () => void
}

interface UseApiResult {
  loading: boolean
  error: string | null
  request: <T>(path: string, init?: RequestInit) => Promise<T>
}

export function useApi(options: UseApiOptions = {}): UseApiResult {
  const { token, logout } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const request = useCallback(
    async <T,>(path: string, init: RequestInit = {}): Promise<T> => {
      const handleUnauthorized = () => {
        if (options.onUnauthorized) {
          options.onUnauthorized()
        } else {
          logout()
        }
      }

      if (!token) {
        const unauthorizedError = new Error('Sessão expirada')
        setError(unauthorizedError.message)
        handleUnauthorized()
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
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          handleUnauthorized()
          const unauthorizedError = new Error('Sessão expirada. Entre novamente para continuar.')
          setError(unauthorizedError.message)
          throw unauthorizedError
        }

        const normalizedError = err instanceof Error ? err : new Error('Erro desconhecido ao comunicar com a API')
        setError(normalizedError.message)
        throw normalizedError
      } finally {
        setLoading(false)
      }
    },
    [options, token, logout],
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
