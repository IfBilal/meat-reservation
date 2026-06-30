import { View, Text } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { Screen } from '../../src/components/Screen'
import { Button } from '../../src/components/Button'

export default function OrderSuccess() {
  const { email } = useLocalSearchParams<{ email?: string }>()

  return (
    <Screen className="items-center justify-center px-6">
      <View className="w-full max-w-md items-center">
        <View className="w-24 h-24 rounded-full bg-brass-400 items-center justify-center mb-6">
          <Text className="text-wine-800 text-5xl">✓</Text>
        </View>
        <Text className="font-display text-3xl text-wine-700 text-center mb-2">Order received!</Text>
        <Text className="text-warmgray-600 text-center">Your reservation has been submitted successfully.</Text>
        {email ? (
          <Text className="text-warmgray-500 text-sm text-center mt-1 mb-8">
            A confirmation has been sent to <Text className="font-semibold text-charcoal">{email}</Text>
          </Text>
        ) : (
          <View className="mb-8" />
        )}

        <View className="w-full gap-3">
          <Button label="View my orders" onPress={() => router.replace('/(tabs)/orders')} />
          <Button label="Place another order" variant="secondary" onPress={() => router.replace('/(tabs)/order')} />
        </View>
      </View>
    </Screen>
  )
}
