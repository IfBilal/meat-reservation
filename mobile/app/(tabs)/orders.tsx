import { useState, useEffect, useCallback } from 'react'
import { View, Text, ScrollView, RefreshControl } from 'react-native'
import { Link } from 'expo-router'
import { format } from 'date-fns'
import { Screen } from '../../src/components/Screen'
import { StatusBadge } from '../../src/components/StatusBadge'
import { StatusProgress } from '../../src/components/StatusProgress'
import { Skeleton } from '../../src/components/Skeleton'
import { Button } from '../../src/components/Button'
import { supabase } from '../../src/lib/supabase'
import { MEAT_TYPES } from '../../src/lib/constants'
import { Order } from '../../src/types'
import { colors } from '../../src/lib/theme'

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchOrders = useCallback(async () => {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setOrders(data as Order[])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchOrders()
    const channel = supabase
      .channel('orders-mobile-customer')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchOrders)
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchOrders])

  async function onRefresh() {
    setRefreshing(true)
    await fetchOrders()
    setRefreshing(false)
  }

  return (
    <Screen className="px-5 pt-6">
      <Text className="font-display text-3xl text-wine-700 mb-5">My orders</Text>

      {loading ? (
        <View className="gap-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} style={{ height: 150, width: '100%' }} />
          ))}
        </View>
      ) : orders.length === 0 ? (
        <View className="bg-cream-50 rounded-2xl border border-cream-300 p-10 items-center mt-4">
          <Text className="text-5xl mb-4">🥩</Text>
          <Text className="font-display text-xl text-charcoal mb-1">No orders yet</Text>
          <Text className="text-warmgray-500 text-sm text-center mb-6">
            Place your first meat reservation to see it here.
          </Text>
          <Link href="/(tabs)/order" asChild>
            <Button label="Place an order" />
          </Link>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerClassName="gap-4 pb-8"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.wine[600]} />
          }
        >
          {orders.map((order) => {
            const meats = MEAT_TYPES.filter((m) => order[m.key] > 0)
            return (
              <View key={order.id} className="bg-cream-50 rounded-2xl border border-cream-300 p-5">
                <View className="flex-row items-start justify-between mb-3">
                  <View className="flex-1 pr-3">
                    <Text className="font-display text-lg text-charcoal">
                      {format(new Date(order.pickup_date + 'T00:00:00'), 'EEEE, MMMM d, yyyy')}
                    </Text>
                    <Text className="text-xs text-warmgray-400 mt-0.5">
                      Ordered {format(new Date(order.created_at), 'MMM d, yyyy · h:mm a')}
                    </Text>
                  </View>
                  <StatusBadge status={order.status} />
                </View>

                <View className="flex-row flex-wrap gap-2 mb-3">
                  {meats.map((m) => (
                    <View key={m.key} className="bg-wine-50 border border-wine-100 px-3 py-1 rounded-full">
                      <Text className="text-wine-700 text-sm font-medium">
                        {m.icon} {m.label} — {order[m.key]} lb{order[m.key] !== 1 ? 's' : ''}
                      </Text>
                    </View>
                  ))}
                </View>

                {order.notes ? (
                  <Text className="text-sm text-warmgray-500 italic mb-3">Note: {order.notes}</Text>
                ) : null}

                <View className="pt-4 border-t border-cream-300">
                  <StatusProgress status={order.status} />
                </View>
              </View>
            )
          })}
        </ScrollView>
      )}
    </Screen>
  )
}
