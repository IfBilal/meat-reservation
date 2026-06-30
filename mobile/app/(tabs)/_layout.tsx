import { Tabs, Redirect } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../src/context/AuthContext'
import { colors } from '../../src/lib/theme'

export default function TabsLayout() {
  const { session, isAdmin, loading } = useAuth()
  if (loading) return null
  if (!session) return <Redirect href="/login" />
  if (isAdmin) return <Redirect href="/(admin)/dashboard" />

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.wine[700],
        tabBarInactiveTintColor: colors.warmgray[400],
        tabBarStyle: { backgroundColor: colors.cream[50], borderTopColor: colors.cream[300] },
        tabBarLabelStyle: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="order"
        options={{ title: 'Order', tabBarIcon: ({ color, size }) => <Ionicons name="cart-outline" color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="orders"
        options={{ title: 'My Orders', tabBarIcon: ({ color, size }) => <Ionicons name="receipt-outline" color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Account', tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" color={color} size={size} /> }}
      />
    </Tabs>
  )
}
