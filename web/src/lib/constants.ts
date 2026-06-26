import { MeatType } from '@/types'

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

export const STATUS_NEXT: Record<string, string | null> = {
  pending:   'confirmed',
  confirmed: 'ready',
  ready:     'picked_up',
  picked_up: null,
}
