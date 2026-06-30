import { useState } from 'react'
import { View, Text, Pressable, TextInput, Platform } from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import { format } from 'date-fns'
import { colors } from '../lib/theme'

type Props = {
  label: string
  value: string // 'yyyy-MM-dd' or ''
  onChange: (iso: string) => void
}

export function DateField({ label, value, onChange }: Props) {
  const [show, setShow] = useState(false)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Web fallback: simple typed date (native gets the real picker)
  if (Platform.OS === 'web') {
    return (
      <View>
        <Text className="text-sm font-semibold text-charcoal mb-1.5">{label}</Text>
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={colors.warmgray[400]}
          className="w-full border border-cream-300 rounded-xl px-4 py-3 text-charcoal bg-cream-50"
        />
      </View>
    )
  }

  const selected = value ? new Date(value + 'T00:00:00') : null

  return (
    <View>
      <Text className="text-sm font-semibold text-charcoal mb-1.5">{label}</Text>
      <Pressable
        onPress={() => setShow(true)}
        className="w-full border border-cream-300 rounded-xl px-4 py-3 bg-cream-50"
      >
        <Text className={selected ? 'text-charcoal' : 'text-warmgray-400'}>
          {selected ? format(selected, 'EEEE, MMMM d, yyyy') : 'Select a pickup date'}
        </Text>
      </Pressable>
      {show && (
        <DateTimePicker
          value={selected ?? today}
          mode="date"
          minimumDate={today}
          onChange={(_e, d) => {
            setShow(false)
            if (d) onChange(format(d, 'yyyy-MM-dd'))
          }}
        />
      )}
    </View>
  )
}
