import { View, Text } from 'react-native'
import { STATUS_LABELS, STATUS_ORDER } from '../lib/constants'
import { OrderStatus } from '../types'

export function StatusProgress({ status }: { status: OrderStatus }) {
  const currentIndex = STATUS_ORDER.indexOf(status)
  const last = STATUS_ORDER.length - 1

  return (
    <View className="flex-row">
      {STATUS_ORDER.map((s, idx) => {
        const done = idx <= currentIndex
        return (
          <View key={s} className="flex-1 items-center">
            <View className="flex-row items-center w-full">
              <View
                className={`h-0.5 flex-1 rounded-full ${idx === 0 ? 'opacity-0' : idx <= currentIndex ? 'bg-wine-500' : 'bg-cream-300'}`}
              />
              <View
                className={`w-3.5 h-3.5 rounded-full ${done ? 'bg-wine-600' : 'bg-cream-300'}`}
              />
              <View
                className={`h-0.5 flex-1 rounded-full ${idx === last ? 'opacity-0' : idx < currentIndex ? 'bg-wine-500' : 'bg-cream-300'}`}
              />
            </View>
            <Text
              className={`text-[11px] mt-1.5 ${done ? 'text-wine-700 font-semibold' : 'text-warmgray-400'}`}
            >
              {STATUS_LABELS[s]}
            </Text>
          </View>
        )
      })}
    </View>
  )
}
