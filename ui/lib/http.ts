const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000"

type RequestOptions = RequestInit & {
  token?: string
}

async function parseErrorResponse(response: Response): Promise<string> {
  try {
    const payload = await response.json()
    if (payload?.message) {
      return Array.isArray(payload.message) ? payload.message.join(", ") : String(payload.message)
    }
  } catch {
    // ignore JSON parse errors
  }
  return response.statusText || "Erro ao comunicar com o servidor"
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { token, headers, ...rest } = options

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  })

  if (!response.ok) {
    throw new Error(await parseErrorResponse(response))
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}
