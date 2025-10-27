export const UNIT_OPTIONS = [
  "kg",
  "g",
  "L",
  "ml",
  "unidade",
  "dúzia",
  "xícara",
  "colher (sopa)",
  "colher (chá)",
] as const;

export const DEFAULT_UNIT = "unidade";

const UNIT_LOOKUP = new Map<string, string>(
  UNIT_OPTIONS.map((unit) => [unit.toLowerCase(), unit]),
);

export function normalizeUnit(rawUnit?: string | null): string {
  if (!rawUnit) {
    return DEFAULT_UNIT;
  }

  const trimmed = rawUnit.trim();
  if (!trimmed) {
    return DEFAULT_UNIT;
  }

  const normalized = trimmed.toLowerCase();
  return UNIT_LOOKUP.get(normalized) ?? DEFAULT_UNIT;
}
