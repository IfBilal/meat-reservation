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
    <div className="bg-linear-to-br from-cream-50 to-cream-100 rounded-2xl p-5 ring-1 ring-cream-300 shadow-warm mb-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-xs font-semibold text-warmgray-500 uppercase tracking-wider">
          {heading}
        </h2>
        <span className="text-sm font-semibold text-wine-700 bg-wine-50 ring-1 ring-wine-100 px-3 py-1 rounded-full">{grandTotal} lbs total</span>
      </div>
      <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
        {totals.map(({ label, total }) => (
          <div key={label} className={`text-center rounded-xl py-3 transition-colors ${total > 0 ? 'bg-cream-50 ring-1 ring-cream-300' : ''}`}>
            <p className="text-xs text-warmgray-500 mb-1">{label}</p>
            <p className={`font-display text-2xl font-bold ${total > 0 ? 'text-wine-700' : 'text-warmgray-400'}`}>{total}</p>
            <p className="text-xs text-warmgray-400">lbs</p>
          </div>
        ))}
      </div>
    </div>
  )
}
