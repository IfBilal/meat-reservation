import { useState, useEffect } from 'react'
import { View, Text, ScrollView } from 'react-native'
import { router } from 'expo-router'
import { Screen } from '../../src/components/Screen'
import { Field } from '../../src/components/Field'
import { Button } from '../../src/components/Button'
import { MeatCounter } from '../../src/components/MeatCounter'
import { DateField } from '../../src/components/DateField'
import { MEAT_TYPES } from '../../src/lib/constants'
import { supabase } from '../../src/lib/supabase'
import { sendConfirmation } from '../../src/lib/email'

type Lbs = { tire_lbs: number; kitfo_lbs: number; tibs_lbs: number; godin_lbs: number; gubet_lbs: number; kidney_lbs: number }
const ZERO: Lbs = { tire_lbs: 0, kitfo_lbs: 0, tibs_lbs: 0, godin_lbs: 0, gubet_lbs: 0, kidney_lbs: 0 }

export default function Order() {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [pickup, setPickup] = useState('')
  const [lbs, setLbs] = useState<Lbs>(ZERO)
  const [notes, setNotes] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const totalLbs = Object.values(lbs).reduce((a, b) => a + b, 0)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id)
        setEmail(user.email ?? '')
        setName((user.user_metadata?.full_name as string) ?? '')
      }
    })
  }, [])

  async function handleSubmit() {
    setError(null)
    if (!name.trim()) return setError('Please enter your name.')
    if (!phone.trim()) return setError('Please enter your phone number.')
    if (!email.trim()) return setError('Please enter your email address.')
    if (!pickup) return setError('Please select a pickup date.')
    if (totalLbs === 0) return setError('Please select at least one meat type.')

    setLoading(true)
    const payload = {
      customer_name: name.trim(),
      customer_phone: phone.trim(),
      customer_email: email.trim(),
      pickup_date: pickup,
      ...lbs,
      notes: notes.trim() || null,
    }
    const { error: insertError } = await supabase
      .from('orders')
      .insert([{ ...payload, status: 'pending', user_id: userId }])
    setLoading(false)
    if (insertError) {
      setError('Something went wrong submitting your order. Please try again.')
      return
    }
    sendConfirmation(payload)
    setLbs(ZERO)
    setNotes('')
    setPickup('')
    router.push({ pathname: '/order/success', params: { email: email.trim() } })
  }

  return (
    <Screen>
      <ScrollView contentContainerClassName="pb-10">
        {/* Hero */}
        <View className="px-6 pt-6 pb-2 items-center">
          <Text className="text-xs font-semibold tracking-widest uppercase text-brass-600">Ahadu Market</Text>
          <Text className="font-display text-3xl text-wine-700 text-center mt-2 leading-tight">Reserve your cut</Text>
          <Text className="text-warmgray-600 text-center mt-2 text-sm">
            Choose your cuts and the day you&apos;ll collect.
          </Text>
        </View>

        <View className="px-5 mt-4">
          <View className="bg-cream-50 rounded-2xl border border-cream-300 p-5 gap-5">
            <Text className="font-display text-lg text-wine-700">Your information</Text>
            <Field label="Full Name" value={name} onChangeText={setName} placeholder="Enter your full name" />
            <Field label="Phone Number" value={phone} onChangeText={setPhone} placeholder="e.g. 513-000-0000" keyboardType="phone-pad" />
            <Field label="Email Address" value={email} onChangeText={setEmail} placeholder="your@email.com" autoCapitalize="none" keyboardType="email-address" />
            <DateField label="Pickup Date" value={pickup} onChange={setPickup} />

            <View className="h-px bg-cream-300 my-1" />

            <View className="flex-row items-center justify-between">
              <Text className="font-display text-lg text-wine-700">Select cuts &amp; pounds</Text>
              {totalLbs > 0 ? (
                <View className="bg-wine-50 border border-wine-100 px-3 py-1 rounded-full">
                  <Text className="text-sm font-semibold text-wine-700">{totalLbs} lbs total</Text>
                </View>
              ) : null}
            </View>

            <View className="rounded-2xl border border-cream-300 bg-cream-100/60 px-4">
              {MEAT_TYPES.map((m) => (
                <MeatCounter
                  key={m.key}
                  label={m.label}
                  description={m.description}
                  icon={m.icon}
                  value={lbs[m.key]}
                  onChange={(v) => setLbs((prev) => ({ ...prev, [m.key]: v }))}
                />
              ))}
            </View>

            <View className="h-px bg-cream-300 my-1" />

            <Text className="font-display text-lg text-wine-700">Special requests</Text>
            <Field
              label="Notes"
              value={notes}
              onChangeText={setNotes}
              placeholder="e.g. Please call me when ready"
              multiline
              numberOfLines={3}
              style={{ minHeight: 72, textAlignVertical: 'top' }}
            />

            {error ? (
              <View className="bg-wine-50 border border-wine-100 rounded-xl px-4 py-3">
                <Text className="text-sm text-wine-700">⚠️ {error}</Text>
              </View>
            ) : null}

            <Button label="Reserve my order" trailing="→" onPress={handleSubmit} loading={loading} />
            <Text className="text-center text-xs text-warmgray-400">🔒 Your order is saved securely</Text>
          </View>
        </View>
      </ScrollView>
    </Screen>
  )
}
