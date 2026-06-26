import { OrderStatus } from '@/types'
import { STATUS_LABELS } from '@/lib/constants'

const STATUS_STYLES: Record<OrderStatus, string> = {
  pending:   'bg-amber-100 text-amber-800 border border-amber-200',
  confirmed: 'bg-blue-100 text-blue-800 border border-blue-200',
  ready:     'bg-green-100 text-green-800 border border-green-200',
  picked_up: 'bg-gray-100 text-gray-600 border border-gray-200',
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  )
}
