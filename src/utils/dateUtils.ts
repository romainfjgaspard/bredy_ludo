import type { Timestamp } from 'firebase/firestore'

export function isForgotten(lastPlayedAt: Timestamp | null | undefined, months = 6): boolean {
  if (!lastPlayedAt) return true
  const d = lastPlayedAt.toDate()
  const cutoff = new Date()
  cutoff.setMonth(cutoff.getMonth() - months)
  return d < cutoff
}

export function formatRelative(date: Date): string {
  const now = new Date()
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (diff < 60) return 'il y a quelques secondes'
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`
  const days = Math.floor(diff / 86400)
  if (days < 30) return `il y a ${days} jour${days > 1 ? 's' : ''}`
  const months = Math.floor(days / 30)
  if (months < 12) return `il y a ${months} mois`
  return `il y a ${Math.floor(months / 12)} an${Math.floor(months / 12) > 1 ? 's' : ''}`
}
