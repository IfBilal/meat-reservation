import { useEffect, useRef } from 'react'
import { Animated } from 'react-native'

export function Skeleton({ className = '', style }: { className?: string; style?: object }) {
  const opacity = useRef(new Animated.Value(0.5)).current

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ])
    )
    loop.start()
    return () => loop.stop()
  }, [opacity])

  return <Animated.View className={`bg-cream-200 rounded-xl ${className}`} style={[{ opacity }, style]} />
}
