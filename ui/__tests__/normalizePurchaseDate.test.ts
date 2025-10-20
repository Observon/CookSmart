import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { normalizePurchaseDate } from '@/app/page'

const today = () => new Date().toISOString().slice(0, 10)

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('normalizePurchaseDate', () => {
  it('retorna data atual quando valor é indefinido', () => {
    vi.setSystemTime(new Date('2025-10-18T12:00:00Z'))
    expect(normalizePurchaseDate()).toBe('2025-10-18')
  })

  it('normaliza formato ISO yyyy-mm-dd', () => {
    vi.setSystemTime(new Date('2025-09-01T00:00:00Z'))
    expect(normalizePurchaseDate('2025-09-01')).toBe('2025-09-01')
  })

  it('converte formato brasileiro dd/mm/aaaa para ISO', () => {
    expect(normalizePurchaseDate('31/08/2025')).toBe('2025-08-31')
    expect(normalizePurchaseDate('31-08-2025')).toBe('2025-08-31')
  })

  it('tenta realizar parse automático de outras strings válidas', () => {
    expect(normalizePurchaseDate('October 5, 2025')).toBe('2025-10-05')
  })

  it('fallback para data atual quando string inválida', () => {
    vi.setSystemTime(new Date('2025-05-11T00:00:00Z'))
    const result = normalizePurchaseDate('data inválida')
    expect(result).toBe(today())
  })
})
