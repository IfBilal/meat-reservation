import { useState } from 'react'
import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from 'react-native'
import { Link, router } from 'expo-router'
import { Screen } from '../src/components/Screen'
import { Field } from '../src/components/Field'
import { PasswordField } from '../src/components/PasswordField'
import { Button } from '../src/components/Button'
import { supabase } from '../src/lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLogin() {
    setError(null)
    setLoading(true)
    const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setLoading(false)
    if (authError) {
      setError('Invalid email or password. Please try again.')
      return
    }
    router.replace('/')
  }

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView contentContainerClassName="flex-grow justify-center px-6 py-10">
          <View className="items-center mb-8">
            <View className="w-16 h-16 rounded-full bg-brass-500 items-center justify-center mb-4">
              <Text className="font-display text-wine-800 text-2xl">A</Text>
            </View>
            <Text className="font-display text-3xl text-wine-700">Welcome back</Text>
            <Text className="font-sans text-warmgray-500 text-sm mt-1.5">Sign in to place and track your orders</Text>
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
            <PasswordField
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              autoComplete="current-password"
            />

            {error ? (
              <View className="bg-wine-50 border border-wine-100 rounded-xl px-4 py-3">
                <Text className="text-sm text-wine-700">{error}</Text>
              </View>
            ) : null}

            <Button label="Sign in" trailing="→" onPress={handleLogin} loading={loading} />

            <Text className="text-center text-sm text-warmgray-500">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-wine-600 font-semibold">Register</Link>
            </Text>
            <Link href="/forgot-password" className="text-center text-sm text-warmgray-500">
              Forgot password?
            </Link>
          </View>

          <Text className="text-center text-xs text-warmgray-400 mt-6">Ahadu Fresh Meat · Reserve your cut</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  )
}
