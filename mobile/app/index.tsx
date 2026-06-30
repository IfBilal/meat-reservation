import { View, Text } from 'react-native'
import { Redirect } from 'expo-router'
import { useAuth } from '../src/context/AuthContext'

export default function Index() {
  const { session, isAdmin, loading } = useAuth()

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-cream-100">
        <View className="w-14 h-14 rounded-full bg-brass-500 items-center justify-center">
          <Text className="font-display text-wine-800 text-2xl">A</Text>
        </View>
      </View>
    )
  }

  if (!session) return <Redirect href="/login" />
  if (isAdmin) return <Redirect href="/(admin)/dashboard" />
  return <Redirect href="/(tabs)/order" />
}
