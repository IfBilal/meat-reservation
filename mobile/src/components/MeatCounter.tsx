import { View, Text, Pressable } from 'react-native'

type Props = {
  label: string
  description: string
  icon: string
  value: number
  onChange: (v: number) => void
}

export function MeatCounter({ label, description, icon, value, onChange }: Props) {
  const active = value > 0
  return (
    <View className="flex-row items-center justify-between py-4 border-b border-cream-300">
      <View className="flex-row items-center gap-3 flex-1">
        <View
          className={`w-12 h-12 rounded-2xl items-center justify-center border ${active ? 'bg-wine-50 border-wine-100' : 'bg-cream-200 border-cream-300'}`}
        >
          <Text className="text-xl">{icon}</Text>
        </View>
        <View className="flex-1">
          <Text className="font-semibold text-charcoal text-[15px]">{label}</Text>
          <Text className="text-xs text-warmgray-500 mt-0.5">{description}</Text>
        </View>
      </View>

      <View className="flex-row items-center gap-3">
        <Pressable
          onPress={() => onChange(Math.max(0, value - 1))}
          disabled={value === 0}
          hitSlop={6}
          className={`w-9 h-9 rounded-full border items-center justify-center ${value === 0 ? 'border-cream-300 opacity-40' : 'border-wine-500 active:bg-wine-50'}`}
        >
          <Text className={`text-lg font-bold ${value === 0 ? 'text-warmgray-400' : 'text-wine-600'}`}>−</Text>
        </Pressable>

        <View className="w-12 items-center">
          <Text className={`text-lg font-bold ${active ? 'text-wine-700' : 'text-warmgray-400'}`}>{value}</Text>
          <Text className="text-[10px] text-warmgray-400">{value === 1 ? 'lb' : 'lbs'}</Text>
        </View>

        <Pressable
          onPress={() => onChange(value + 1)}
          hitSlop={6}
          className="w-9 h-9 rounded-full bg-wine-700 items-center justify-center active:opacity-80"
        >
          <Text className="text-lg font-bold text-cream-50">+</Text>
        </Pressable>
      </View>
    </View>
  )
}
