export function imageUrl(imageUrlField: string | undefined): string {
  if (!imageUrlField) return `${import.meta.env.BASE_URL}images/placeholder.jpg`
  return `${import.meta.env.BASE_URL}images/games/${imageUrlField}`
}
