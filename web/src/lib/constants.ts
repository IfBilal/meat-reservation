import { MeatType } from '@/types'

export const MEAT_TYPES: MeatType[] = [
  { key: 'tire_lbs',   label: 'Tire / Tere', description: 'Raw beef' },
  { key: 'kitfo_lbs',  label: 'Kitfo',       description: 'Minced raw beef' },
  { key: 'tibs_lbs',   label: 'Tibs',        description: 'Sautéed beef' },
  { key: 'godin_lbs',  label: 'Godin',       description: 'Beef ribs' },
  { key: 'gubet_lbs',  label: 'Gubet',       description: 'Tripe / Offal' },
  { key: 'kidney_lbs', label: 'Kidney',      description: 'Beef kidney' },
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
