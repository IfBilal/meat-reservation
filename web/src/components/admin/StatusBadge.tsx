import { OrderStatus } from '@/types'
import { STATUS_LABELS } from '@/lib/constants'

const STATUS_STYLES: Record<OrderStatus, string> = {
  pending:   'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  confirmed: 'bg-wine-50 text-wine-700 ring-1 ring-wine-100',
  ready:     'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  picked_up: 'bg-cream-200 text-warmgray-600 ring-1 ring-cream-300',
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  )
}
