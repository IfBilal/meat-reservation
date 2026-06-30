import { View, Text, Pressable } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { SafeAreaView } from 'react-native-safe-area-context'
import { wineGradient } from '../src/lib/theme'
import { MEAT_TYPES } from '../src/lib/constants'

export default function Index() {
  return (
    <SafeAreaView className="flex-1 bg-cream-100">
      <View className="flex-1 items-center justify-center px-6">
        <View className="w-16 h-16 rounded-full bg-brass-500 items-center justify-center mb-5">
          <Text className="font-display text-wine-800 text-2xl">A</Text>
        </View>

        <Text className="font-display text-3xl text-wine-700 text-center">
          Ahadu Fresh Meat
        </Text>
        <Text className="font-sans text-warmgray-500 text-center mt-2">
          Premium Butcher theme — Phase 1 foundation
        </Text>

        <View className="flex-row flex-wrap justify-center gap-2 mt-8">
          {MEAT_TYPES.map((m) => (
            <View
              key={m.key}
              className="bg-wine-50 px-3 py-1.5 rounded-full border border-wine-100"
            >
              <Text className="font-medium text-wine-700 text-sm">
                {m.icon} {m.label}
              </Text>
            </View>
          ))}
        </View>

        <Pressable className="mt-10 w-full active:opacity-90">
          <LinearGradient
            colors={wineGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="rounded-xl py-3.5 items-center"
            style={{ borderRadius: 12 }}
          >
            <Text className="font-semibold text-cream-50 text-base">
              Foundation ready →
            </Text>
          </LinearGradient>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}
