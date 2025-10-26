let unauthorizedToastDisplayed = false

export function markUnauthorizedToastDisplayed(): boolean {
  if (unauthorizedToastDisplayed) {
    return false
  }
  unauthorizedToastDisplayed = true
  return true
}

export function resetUnauthorizedToast(): void {
  unauthorizedToastDisplayed = false
}
