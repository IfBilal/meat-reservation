import { View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export function Screen({
  children,
  className = '',
  edges,
}: {
  children: React.ReactNode
  className?: string
  edges?: ('top' | 'bottom' | 'left' | 'right')[]
}) {
  return (
    <SafeAreaView className="flex-1 bg-cream-100" edges={edges}>
      <View className={`flex-1 ${className}`}>{children}</View>
    </SafeAreaView>
  )
}
