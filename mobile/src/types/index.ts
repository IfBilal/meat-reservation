export type OrderStatus = 'pending' | 'confirmed' | 'ready' | 'picked_up'

export interface Order {
  id: string
  customer_name: string
  customer_phone: string
  customer_email: string
  pickup_date: string
  tire_lbs: number
  kitfo_lbs: number
  tibs_lbs: number
  godin_lbs: number
  gubet_lbs: number
  kidney_lbs: number
  notes: string | null
  status: OrderStatus
  created_at: string
  user_id?: string | null
}

export interface MeatType {
  key: keyof Pick<Order, 'tire_lbs' | 'kitfo_lbs' | 'tibs_lbs' | 'godin_lbs' | 'gubet_lbs' | 'kidney_lbs'>
  label: string
  description: string
  icon: string
}

export interface AdminUser {
  id: string
  email: string
  created_at: string
}
