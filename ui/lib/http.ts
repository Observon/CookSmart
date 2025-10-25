const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000"

type RequestOptions = RequestInit & {
  token?: string
}

export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message)
    this.name = "ApiError"
  }
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

  const isFormData = typeof FormData !== "undefined" && rest.body instanceof FormData

  const finalHeaders = new Headers(headers as HeadersInit | undefined)

  if (token) {
    finalHeaders.set("Authorization", `Bearer ${token}`)
  }

  if (!isFormData && !finalHeaders.has("Content-Type")) {
    finalHeaders.set("Content-Type", "application/json")
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: finalHeaders,
  })

  if (!response.ok) {
    const message = await parseErrorResponse(response)
    throw new ApiError(message, response.status)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}
