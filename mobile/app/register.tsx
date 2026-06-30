import { useState } from 'react'
import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from 'react-native'
import { Link, router } from 'expo-router'
import { Screen } from '../src/components/Screen'
import { Field } from '../src/components/Field'
import { PasswordField } from '../src/components/PasswordField'
import { Button } from '../src/components/Button'
import { supabase } from '../src/lib/supabase'

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleRegister() {
    setError(null)
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setLoading(true)
    const { error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: name.trim() } },
    })
    setLoading(false)
    if (authError) {
      setError(authError.message)
      return
    }
    router.replace({ pathname: '/verify-email', params: { email: email.trim() } })
  }

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView contentContainerClassName="flex-grow justify-center px-6 py-10">
          <View className="items-center mb-8">
            <View className="w-16 h-16 rounded-full bg-brass-500 items-center justify-center mb-4">
              <Text className="font-display text-wine-800 text-2xl">A</Text>
            </View>
            <Text className="font-display text-3xl text-wine-700">Create your account</Text>
            <Text className="font-sans text-warmgray-500 text-sm mt-1.5">Register to place and track your orders</Text>
          </View>

          <View className="bg-cream-50 rounded-2xl border border-cream-300 p-6 gap-5">
            <Field label="Full Name" value={name} onChangeText={setName} placeholder="Enter your full name" autoComplete="name" />
            <Field
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="your@email.com"
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
            <PasswordField label="Password" value={password} onChangeText={setPassword} placeholder="Min. 6 characters" autoComplete="new-password" />

            {error ? (
              <View className="bg-wine-50 border border-wine-100 rounded-xl px-4 py-3">
                <Text className="text-sm text-wine-700">{error}</Text>
              </View>
            ) : null}

            <Button label="Create account" trailing="→" onPress={handleRegister} loading={loading} />

            <Text className="text-center text-sm text-warmgray-500">
              Already have an account?{' '}
              <Link href="/login" className="text-wine-600 font-semibold">Sign in</Link>
            </Text>
          </View>

          <Text className="text-center text-xs text-warmgray-400 mt-6">Ahadu Fresh Meat · Reserve your cut</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  )
}
