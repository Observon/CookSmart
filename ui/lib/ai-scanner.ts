export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

export function resolveItemValue(
  total?: number | null,
  unitPrice?: number | null,
  quantity?: number | null,
): number {
  if (typeof total === 'number' && Number.isFinite(total)) {
    return total
  }

  if (
    typeof unitPrice === 'number' &&
    Number.isFinite(unitPrice) &&
    typeof quantity === 'number' &&
    Number.isFinite(quantity) &&
    quantity > 0
  ) {
    return unitPrice * quantity
  }

  if (typeof unitPrice === 'number' && Number.isFinite(unitPrice)) {
    return unitPrice
  }

  return 0
}
