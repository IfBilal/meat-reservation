import { MeatType } from '../types'

// Must stay in sync with web/src/lib/constants.ts
export const MEAT_TYPES: MeatType[] = [
  { key: 'tire_lbs',   label: 'Tire / Tere', description: 'Raw beef',        icon: '🥩' },
  { key: 'kitfo_lbs',  label: 'Kitfo',       description: 'Minced raw beef', icon: '🫀' },
  { key: 'tibs_lbs',   label: 'Tibs',        description: 'Sautéed beef',    icon: '🍳' },
  { key: 'godin_lbs',  label: 'Godin',       description: 'Beef ribs',       icon: '🍖' },
  { key: 'gubet_lbs',  label: 'Gubet',       description: 'Tripe / Offal',   icon: '🫁' },
  { key: 'kidney_lbs', label: 'Kidney',      description: 'Beef kidney',     icon: '🫘' },
]

export const STATUS_LABELS: Record<string, string> = {
  pending:   'Pending',
  confirmed: 'Confirmed',
  ready:     'Ready',
  picked_up: 'Picked Up',
}

export const STATUS_ORDER = ['pending', 'confirmed', 'ready', 'picked_up'] as const
