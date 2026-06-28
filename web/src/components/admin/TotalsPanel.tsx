'use client'

import { Order } from '@/types'
import { MEAT_TYPES } from '@/lib/constants'
import { format } from 'date-fns'

// `orders` is the already-filtered list from the dashboard, so the totals always
// match what the admin is currently viewing. `dateFilter` (yyyy-MM-dd) only
// changes the heading wording.
export function TotalsPanel({ orders, dateFilter }: { orders: Order[]; dateFilter?: string }) {
  const totals = MEAT_TYPES.map(mt => ({
    label: mt.label,
    total: orders.reduce((sum, o) => sum + Number(o[mt.key] ?? 0), 0),
  }))

  const grandTotal = totals.reduce((sum, t) => sum + t.total, 0)

  const heading = dateFilter
    ? `Pickup Totals — ${format(new Date(dateFilter + 'T00:00:00'), 'MMMM d, yyyy')}`
    : 'Total Pounds per Meat Type (All Orders)'

  return (
    <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
          {heading}
        </h2>
        <span className="text-sm font-semibold text-[#8B0000]">{grandTotal} lbs total</span>
      </div>
      <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
        {totals.map(({ label, total }) => (
          <div key={label} className="text-center">
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            <p className="text-2xl font-bold text-[#8B0000]">{total}</p>
            <p className="text-xs text-gray-400">lbs</p>
          </div>
        ))}
      </div>
    </div>
  )
}
