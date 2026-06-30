import { useState } from 'react'
import { View, Text, TextInput, Pressable, TextInputProps } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '../lib/theme'

type Props = TextInputProps & { label: string }

export function PasswordField({ label, ...props }: Props) {
  const [show, setShow] = useState(false)
  const [focused, setFocused] = useState(false)
  return (
    <View>
      <Text className="text-sm font-semibold text-charcoal mb-1.5">{label}</Text>
      <View className="relative justify-center">
        <TextInput
          secureTextEntry={!show}
          placeholderTextColor={colors.warmgray[400]}
          onFocus={(e) => {
            setFocused(true)
            props.onFocus?.(e)
          }}
          onBlur={(e) => {
            setFocused(false)
            props.onBlur?.(e)
          }}
          className={`w-full border rounded-xl px-4 py-3 pr-12 text-charcoal bg-cream-50 ${focused ? 'border-wine-500' : 'border-cream-300'}`}
          {...props}
        />
        <Pressable
          onPress={() => setShow((s) => !s)}
          hitSlop={10}
          className="absolute right-3"
        >
          <Ionicons
            name={show ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color={colors.warmgray[400]}
          />
        </Pressable>
      </View>
    </View>
  )
}
