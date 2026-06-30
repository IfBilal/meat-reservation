import { useState, useEffect, useCallback } from 'react'
import { View, Text, ScrollView, Pressable, Alert, Platform } from 'react-native'
import { Screen } from '../../src/components/Screen'
import { Field } from '../../src/components/Field'
import { PasswordField } from '../../src/components/PasswordField'
import { Button } from '../../src/components/Button'
import { Skeleton } from '../../src/components/Skeleton'
import { supabase } from '../../src/lib/supabase'
import { createAdmin, deleteAdmin } from '../../src/lib/adminApi'
import { AdminUser } from '../../src/types'

export default function Admins() {
  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [currentId, setCurrentId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [creating, setCreating] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const fetchAdmins = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setCurrentId(user?.id ?? null)
    const { data } = await supabase.from('admin_users').select('*').order('created_at')
    if (data) setAdmins(data as AdminUser[])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchAdmins()
  }, [fetchAdmins])

  async function handleCreate() {
    setError(null)
    setSuccess(null)
    if (!email.trim() || password.length < 6) {
      setError('Enter an email and a password of at least 6 characters.')
      return
    }
    setCreating(true)
    try {
      await createAdmin(email.trim(), password)
      setSuccess(`Admin ${email.trim()} created.`)
      setEmail('')
      setPassword('')
      fetchAdmins()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create admin.')
    } finally {
      setCreating(false)
    }
  }

  function confirmRemove(admin: AdminUser) {
    const doRemove = async () => {
      setRemovingId(admin.id)
      setError(null)
      setSuccess(null)
      try {
        await deleteAdmin(admin.id)
        setSuccess(`${admin.email} removed.`)
        fetchAdmins()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to remove admin.')
      } finally {
        setRemovingId(null)
      }
    }
    if (Platform.OS === 'web') {
      doRemove()
    } else {
      Alert.alert('Remove admin', `Remove ${admin.email}? They will lose all access.`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: doRemove },
      ])
    }
  }

  return (
    <Screen className="px-5 pt-6">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-8">
        <Text className="font-display text-3xl text-wine-700 mb-1">Admin users</Text>
        <Text className="text-warmgray-500 text-sm mb-6">Manage who has access to the admin panel.</Text>

        {/* Current admins */}
        <View className="bg-cream-50 rounded-2xl border border-cream-300 mb-6 overflow-hidden">
          <View className="px-5 py-4 border-b border-cream-300">
            <Text className="font-display text-charcoal">Current admins</Text>
          </View>
          {loading ? (
            <View className="p-5 gap-3">
              <Skeleton style={{ height: 24, width: '100%' }} />
              <Skeleton style={{ height: 24, width: '70%' }} />
            </View>
          ) : (
            admins.map((a) => (
              <View key={a.id} className="px-5 py-4 flex-row items-center justify-between border-b border-cream-200">
                <View className="flex-row items-center gap-3 flex-1">
                  <View className="w-9 h-9 rounded-full bg-brass-400 items-center justify-center">
                    <Text className="font-display text-wine-800">{a.email.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="font-medium text-charcoal">{a.email}</Text>
                    {a.id === currentId ? <Text className="text-xs text-brass-600 font-semibold">You</Text> : null}
                  </View>
                </View>
                {a.id !== currentId ? (
                  <Pressable
                    onPress={() => confirmRemove(a)}
                    disabled={removingId === a.id}
                    className="px-3 py-1.5 rounded-lg border border-wine-200 active:bg-wine-50"
                  >
                    <Text className="text-wine-600 text-xs font-medium">{removingId === a.id ? 'Removing…' : 'Remove'}</Text>
                  </Pressable>
                ) : null}
              </View>
            ))
          )}
        </View>

        {error ? (
          <View className="bg-wine-50 border border-wine-100 rounded-xl px-4 py-3 mb-4">
            <Text className="text-sm text-wine-700">{error}</Text>
          </View>
        ) : null}
        {success ? (
          <View className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 mb-4">
            <Text className="text-sm text-emerald-700">{success}</Text>
          </View>
        ) : null}

        {/* Add admin */}
        <View className="bg-cream-50 rounded-2xl border border-cream-300 overflow-hidden">
          <View className="px-5 py-4 border-b border-cream-300">
            <Text className="font-display text-charcoal">Add new admin</Text>
          </View>
          <View className="p-5 gap-4">
            <Field label="Email" value={email} onChangeText={setEmail} placeholder="newadmin@example.com" autoCapitalize="none" keyboardType="email-address" />
            <PasswordField label="Password" value={password} onChangeText={setPassword} placeholder="Min. 6 characters" />
            <Button label="Create admin" onPress={handleCreate} loading={creating} />
          </View>
        </View>
      </ScrollView>
    </Screen>
  )
}
