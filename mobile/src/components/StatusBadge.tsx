import { View, Text } from 'react-native'
import { statusStyles } from '../lib/theme'
import { STATUS_LABELS } from '../lib/constants'
import { OrderStatus } from '../types'

export function StatusBadge({ status }: { status: OrderStatus }) {
  const s = statusStyles[status]
  return (
    <View
      className="px-2.5 py-1 rounded-full self-start"
      style={{ backgroundColor: s.bg, borderColor: s.ring, borderWidth: 1 }}
    >
      <Text className="text-xs font-semibold" style={{ color: s.fg }}>
        {STATUS_LABELS[status]}
      </Text>
    </View>
  )
}
