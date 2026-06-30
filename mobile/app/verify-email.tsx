import { View, Text } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { Screen } from '../src/components/Screen'
import { Button } from '../src/components/Button'

export default function VerifyEmail() {
  const { email } = useLocalSearchParams<{ email?: string }>()

  const steps = [
    'Open the email from Ahadu Fresh Meat',
    'Tap the "Confirm your email" link',
    'Then come back and sign in',
  ]

  return (
    <Screen className="items-center justify-center px-6">
      <View className="w-full max-w-md items-center">
        <View className="w-20 h-20 rounded-full bg-brass-400 items-center justify-center mb-5">
          <Text className="text-3xl">📬</Text>
        </View>
        <Text className="font-display text-3xl text-wine-700 text-center mb-2">Check your email</Text>
        <Text className="text-warmgray-500 text-center">We sent a verification link to:</Text>
        {email ? <Text className="font-semibold text-charcoal mb-6 mt-1">{email}</Text> : <View className="mb-6" />}

        <View className="w-full bg-cream-50 rounded-2xl border border-cream-300 p-6 gap-3 mb-6">
          {steps.map((s) => (
            <View key={s} className="flex-row gap-2">
              <Text className="text-brass-600 mt-0.5">✓</Text>
              <Text className="text-sm text-warmgray-600 flex-1">{s}</Text>
            </View>
          ))}
        </View>

        <Button label="Go to sign in" onPress={() => router.replace('/login')} />
        <Text className="text-xs text-warmgray-400 mt-4 text-center">Didn&apos;t receive it? Check your spam folder.</Text>
      </View>
    </Screen>
  )
}
