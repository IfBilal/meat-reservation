import { useState } from 'react'
import { View, Text, TextInput, TextInputProps } from 'react-native'
import { colors } from '../lib/theme'

type Props = TextInputProps & { label: string }

export function Field({ label, ...props }: Props) {
  const [focused, setFocused] = useState(false)
  return (
    <View>
      <Text className="text-sm font-semibold text-charcoal mb-1.5">{label}</Text>
      <TextInput
        placeholderTextColor={colors.warmgray[400]}
        onFocus={(e) => {
          setFocused(true)
          props.onFocus?.(e)
        }}
        onBlur={(e) => {
          setFocused(false)
          props.onBlur?.(e)
        }}
        className={`w-full border rounded-xl px-4 py-3 text-charcoal bg-cream-50 ${focused ? 'border-wine-500' : 'border-cream-300'}`}
        {...props}
      />
    </View>
  )
}
