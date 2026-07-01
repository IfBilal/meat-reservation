import { useState } from 'react'
import { View, Text, ScrollView } from 'react-native'
import { Link, router } from 'expo-router'
import { Screen } from '../src/components/Screen'
import { Field } from '../src/components/Field'
import { Button } from '../src/components/Button'
const API_URL = process.env.EXPO_PUBLIC_APP_URL ?? 'https://meat-reservation.vercel.app'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  async function handleReset() {
    setError(null)
    if (!email.trim()) {
      setError('Please enter your email.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Something went wrong. Please try again.')
        return
      }
      setSent(true)
    } catch {
      setError('Could not send reset email. Check your connection.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <Screen className="items-center justify-center px-6">
        <View className="w-full max-w-md items-center">
          <View className="w-20 h-20 rounded-full bg-brass-400 items-center justify-center mb-5">
            <Text className="text-3xl">📬</Text>
          </View>
          <Text className="font-display text-3xl text-wine-700 text-center mb-2">Check your email</Text>
          <Text className="text-warmgray-500 text-center mb-6">
            If an account exists for {email.trim()}, we sent a password reset link.
          </Text>
          <Button label="Back to sign in" onPress={() => router.replace('/login')} />
        </View>
      </Screen>
    )
  }

  return (
    <Screen>
      <ScrollView contentContainerClassName="flex-grow justify-center px-6 py-10">
        <View className="items-center mb-8">
          <Text className="font-display text-3xl text-wine-700">Reset password</Text>
          <Text className="font-sans text-warmgray-500 text-sm mt-1.5 text-center">
            Enter your email and we&apos;ll send you a reset link
          </Text>
        </View>

        <View className="bg-cream-50 rounded-2xl border border-cream-300 p-6 gap-5">
          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="your@email.com"
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
          {error ? (
            <View className="bg-wine-50 border border-wine-100 rounded-xl px-4 py-3">
              <Text className="text-sm text-wine-700">{error}</Text>
            </View>
          ) : null}
          <Button label="Send reset link" onPress={handleReset} loading={loading} />
          <Text className="text-center text-sm text-warmgray-500">
            Remember it?{' '}
            <Link href="/login" className="text-wine-600 font-semibold">Sign in</Link>
          </Text>
        </View>
      </ScrollView>
    </Screen>
  )
}
