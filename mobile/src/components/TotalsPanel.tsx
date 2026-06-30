import { View, Text } from 'react-native'
import { format } from 'date-fns'
import { MEAT_TYPES } from '../lib/constants'
import { Order } from '../types'

export function TotalsPanel({ orders, dateFilter }: { orders: Order[]; dateFilter?: string }) {
  const totals = MEAT_TYPES.map((m) => ({
    label: m.label,
    total: orders.reduce((sum, o) => sum + Number(o[m.key] ?? 0), 0),
  }))
  const grand = totals.reduce((s, t) => s + t.total, 0)
  const heading = dateFilter
    ? `Pickup totals — ${format(new Date(dateFilter + 'T00:00:00'), 'MMM d, yyyy')}`
    : 'Total pounds per meat type'

  return (
    <View className="bg-cream-50 rounded-2xl border border-cream-300 p-4 mb-4">
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-xs font-semibold uppercase tracking-wide text-warmgray-500 flex-1 pr-2">{heading}</Text>
        <View className="bg-wine-50 border border-wine-100 px-3 py-1 rounded-full">
          <Text className="text-sm font-semibold text-wine-700">{grand} lbs</Text>
        </View>
      </View>
      <View className="flex-row flex-wrap">
        {totals.map((t) => (
          <View key={t.label} className="w-1/3 items-center py-2">
            <Text className="text-[11px] text-warmgray-500 mb-0.5">{t.label}</Text>
            <Text className={`font-display text-2xl ${t.total > 0 ? 'text-wine-700' : 'text-warmgray-400'}`}>{t.total}</Text>
            <Text className="text-[10px] text-warmgray-400">lbs</Text>
          </View>
        ))}
      </View>
    </View>
  )
}
