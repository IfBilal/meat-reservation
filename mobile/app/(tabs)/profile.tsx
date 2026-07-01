import { View, Text, Share } from 'react-native'
import { router } from 'expo-router'
import { Screen } from '../../src/components/Screen'
import { Button } from '../../src/components/Button'
import { useAuth } from '../../src/context/AuthContext'

const APP_URL = process.env.EXPO_PUBLIC_APP_URL ?? 'https://meat-reservation.vercel.app'

export default function Profile() {
  const { session, signOut } = useAuth()

  async function handleSignOut() {
    await signOut()
    router.replace('/login')
  }

  async function handleShare() {
    await Share.share({
      message: `Place your Ahadu Fresh Meat order here: ${APP_URL}`,
      url: APP_URL,
    })
  }

  return (
    <Screen className="px-6 pt-6">
      <Text className="font-display text-3xl text-wine-700 mb-1">Account</Text>
      <Text className="text-warmgray-500 text-sm mb-8">{session?.user.email}</Text>

      <View className="bg-cream-50 rounded-2xl border border-cream-300 p-5 gap-4">
        <View className="flex-row items-center gap-3">
          <View className="w-11 h-11 rounded-full bg-brass-400 items-center justify-center">
            <Text className="font-display text-wine-800 text-lg">
              {(session?.user.email ?? 'A').charAt(0).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text className="font-semibold text-charcoal">
              {(session?.user.user_metadata?.full_name as string) || 'Customer'}
            </Text>
            <Text className="text-warmgray-500 text-xs">{session?.user.email}</Text>
          </View>
        </View>
      </View>

      <View className="mt-6 gap-3">
        <Button label="Share app via WhatsApp" onPress={handleShare} />
        <Button label="Sign out" variant="secondary" onPress={handleSignOut} />
      </View>

      <Text className="text-center text-xs text-warmgray-400 mt-auto mb-4">Ahadu Fresh Meat · v1.0.0</Text>
    </Screen>
  )
}
