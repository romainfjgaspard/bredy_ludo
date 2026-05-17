export const LOCATIONS = [
  'A1', 'A2', 'B1', 'B2', 'C1', 'C2',
  'D1', 'D2', 'E1', 'E2', 'F1', 'F2',
  'G', 'H', 'I',
] as const
export type Location = typeof LOCATIONS[number]
