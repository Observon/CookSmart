import { apiFetch } from "@/lib/http"
import type { CreatePurchasePayload } from "@/lib/types"

export async function createPurchase(token: string, payload: CreatePurchasePayload) {
  return apiFetch("/purchases", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  })
}
