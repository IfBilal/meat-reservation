import { Pressable, Text, ActivityIndicator } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { wineGradient, colors } from '../lib/theme'

type Props = {
  label: string
  onPress?: () => void
  loading?: boolean
  disabled?: boolean
  variant?: 'primary' | 'secondary'
  trailing?: string
  className?: string
}

// Canonical button — mirrors web: rounded-xl, py-3.5, semibold, wine gradient (primary)
export function Button({
  label,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  trailing,
  className = '',
}: Props) {
  const isDisabled = disabled || loading

  if (variant === 'secondary') {
    return (
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        className={`w-full py-3.5 rounded-xl border border-cream-300 bg-cream-50 items-center justify-center active:bg-cream-100 ${isDisabled ? 'opacity-50' : ''} ${className}`}
      >
        <Text className="font-semibold text-charcoal">{label}</Text>
      </Pressable>
    )
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      className={`w-full active:opacity-90 ${className}`}
    >
      <LinearGradient
        colors={isDisabled ? [colors.warmgray[400], colors.warmgray[400]] : wineGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: 12,
          paddingVertical: 14,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        {loading && <ActivityIndicator color={colors.cream[50]} size="small" />}
        <Text className="font-semibold text-cream-50 text-base">{label}</Text>
        {!loading && trailing ? (
          <Text className="font-semibold text-cream-50 text-base">{trailing}</Text>
        ) : null}
      </LinearGradient>
    </Pressable>
  )
}
