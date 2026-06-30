import { Text } from 'react-native'
import { Screen } from '../../src/components/Screen'

export default function Dashboard() {
  return (
    <Screen className="items-center justify-center px-6">
      <Text className="font-display text-2xl text-wine-700">Admin Dashboard</Text>
      <Text className="text-warmgray-500 mt-2">Coming in Phase 5</Text>
    </Screen>
  )
}
