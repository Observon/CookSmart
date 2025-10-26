import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { useAuth } from '@/context/auth-context'
import { ApiError, apiFetch } from '@/lib/http'
import { markUnauthorizedToastDisplayed } from '@/lib/session-notifier'

interface UseApiOptions {
  onUnauthorized?: () => void
}

interface UseApiResult {
  loading: boolean
  error: string | null
  request: <T>(path: string, init?: RequestInit) => Promise<T>
}

export class UnauthorizedError extends Error {
  constructor(message = 'Sessão expirada. Entre novamente para continuar.') {
    super(message)
    this.name = 'UnauthorizedError'
  }
}

export function useApi(options: UseApiOptions = {}): UseApiResult {
  const { token, logout } = useAuth()
  const { onUnauthorized } = options
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleUnauthorized = useCallback(() => {
    if (markUnauthorizedToastDisplayed()) {
      toast.error('Sessão expirada. Entre novamente para continuar.')
    }
    if (onUnauthorized) {
      onUnauthorized()
    } else {
      logout({ silent: true })
    }
  }, [logout, onUnauthorized])

  const request = useCallback(
    async <T,>(path: string, init: RequestInit = {}): Promise<T> => {
      if (!token) {
        const unauthorizedError = new UnauthorizedError()
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
          const unauthorizedError = new UnauthorizedError(err.message)
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
    [token, handleUnauthorized],
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
