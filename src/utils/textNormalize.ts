/**
 * Normalise une chaîne pour la recherche : minuscules, sans accents, sans ponctuation.
 */
export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
}
