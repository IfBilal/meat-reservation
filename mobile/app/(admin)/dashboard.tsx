import { useState, useEffect, useCallback } from 'react'
import { View, Text, ScrollView, TextInput, Pressable, Modal, RefreshControl } from 'react-native'
import { format } from 'date-fns'
import { Screen } from '../../src/components/Screen'
import { StatusBadge } from '../../src/components/StatusBadge'
import { TotalsPanel } from '../../src/components/TotalsPanel'
import { Skeleton } from '../../src/components/Skeleton'
import { DateField } from '../../src/components/DateField'
import { supabase } from '../../src/lib/supabase'
import { MEAT_TYPES, STATUS_LABELS, STATUS_ORDER } from '../../src/lib/constants'
import { Order, OrderStatus } from '../../src/types'
import { colors } from '../../src/lib/theme'
import { exportOrdersCsv } from '../../src/lib/exportCsv'

export default function Dashboard() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all')
  const [dateFilter, setDateFilter] = useState('')
  const [editing, setEditing] = useState<Order | null>(null)

  const fetchOrders = useCallback(async () => {
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false })
    if (data) setOrders(data as Order[])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchOrders()
    const ch = supabase
      .channel('orders-mobile-admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchOrders)
      .subscribe()
    return () => {
      supabase.removeChannel(ch)
    }
  }, [fetchOrders])

  const filtered = orders.filter((o) => {
    const s = search.trim().toLowerCase()
    const matchSearch = !s || [o.customer_name, o.customer_phone, o.customer_email].some((v) => v.toLowerCase().includes(s))
    const matchStatus = statusFilter === 'all' || o.status === statusFilter
    const matchDate = !dateFilter || o.pickup_date === dateFilter
    return matchSearch && matchStatus && matchDate
  })

  async function changeStatus(order: Order, status: OrderStatus) {
    setEditing(null)
    if (status === order.status) return
    setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status } : o)))
    await supabase.from('orders').update({ status }).eq('id', order.id)
  }

  async function onRefresh() {
    setRefreshing(true)
    await fetchOrders()
    setRefreshing(false)
  }

  const filters: (OrderStatus | 'all')[] = ['all', 'pending', 'confirmed', 'ready', 'picked_up']

  return (
    <Screen className="px-5 pt-6">
      <View className="flex-row items-center justify-between mb-4">
        <Text className="font-display text-3xl text-wine-700">Orders</Text>
        <Pressable
          onPress={() => exportOrdersCsv(filtered)}
          disabled={filtered.length === 0}
          className={`px-4 py-2 rounded-xl border border-cream-300 bg-cream-50 active:bg-cream-100 ${filtered.length === 0 ? 'opacity-40' : ''}`}
        >
          <Text className="text-sm font-medium text-charcoal">Export CSV</Text>
        </Pressable>
      </View>

      {loading ? (
        <View className="gap-4">
          <Skeleton style={{ height: 120, width: '100%' }} />
          <Skeleton style={{ height: 80, width: '100%' }} />
          <Skeleton style={{ height: 200, width: '100%' }} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerClassName="pb-8"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.wine[600]} />}
        >
          <TotalsPanel orders={filtered} dateFilter={dateFilter || undefined} />

          {/* Search */}
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search by name, phone, or email…"
            placeholderTextColor={colors.warmgray[400]}
            className="w-full border border-cream-300 bg-cream-50 rounded-xl px-4 py-3 text-charcoal mb-3"
          />

          {/* Status filter chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
            <View className="flex-row gap-2">
              {filters.map((f) => (
                <Pressable
                  key={f}
                  onPress={() => setStatusFilter(f)}
                  className={`px-3.5 py-1.5 rounded-full border ${statusFilter === f ? 'bg-wine-700 border-wine-700' : 'bg-cream-50 border-cream-300'}`}
                >
                  <Text className={`text-sm font-medium ${statusFilter === f ? 'text-cream-50' : 'text-charcoal'}`}>
                    {f === 'all' ? 'All' : STATUS_LABELS[f]}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>

          {/* Date filter */}
          <View className="mb-3">
            <DateField label="Filter by pickup date" value={dateFilter} onChange={setDateFilter} />
            {dateFilter ? (
              <Pressable onPress={() => setDateFilter('')} className="mt-1.5">
                <Text className="text-xs text-wine-600 underline">Clear date</Text>
              </Pressable>
            ) : null}
          </View>

          <Text className="text-sm text-warmgray-500 mb-3">
            Showing <Text className="font-semibold text-charcoal">{filtered.length}</Text> of {orders.length} orders
          </Text>

          {filtered.length === 0 ? (
            <View className="items-center py-12">
              <Text className="text-4xl mb-2">🥩</Text>
              <Text className="font-display text-lg text-charcoal">No orders found</Text>
            </View>
          ) : (
            <View className="gap-3">
              {filtered.map((order) => {
                const meats = MEAT_TYPES.filter((m) => order[m.key] > 0)
                return (
                  <View key={order.id} className="bg-cream-50 rounded-2xl border border-cream-300 p-4">
                    <View className="flex-row items-start justify-between mb-2">
                      <View className="flex-1 pr-2">
                        <Text className="font-semibold text-charcoal">{order.customer_name}</Text>
                        <Text className="text-xs text-warmgray-500">{order.customer_phone}</Text>
                        <Text className="text-xs text-warmgray-400">{order.customer_email}</Text>
                      </View>
                      <StatusBadge status={order.status} />
                    </View>
                    <Text className="text-sm text-charcoal mb-2">
                      Pickup: {format(new Date(order.pickup_date + 'T00:00:00'), 'MMM d, yyyy')}
                    </Text>
                    <View className="flex-row flex-wrap gap-1.5 mb-3">
                      {meats.map((m) => (
                        <View key={m.key} className="bg-wine-50 border border-wine-100 px-2 py-0.5 rounded-full">
                          <Text className="text-wine-700 text-xs font-medium">{m.label} {order[m.key]}lb</Text>
                        </View>
                      ))}
                    </View>
                    {order.notes ? <Text className="text-xs text-warmgray-500 italic mb-3">Note: {order.notes}</Text> : null}
                    <Pressable
                      onPress={() => setEditing(order)}
                      className="self-start px-3.5 py-2 rounded-lg bg-wine-700 active:opacity-80"
                    >
                      <Text className="text-cream-50 text-sm font-medium">Change status</Text>
                    </Pressable>
                  </View>
                )
              })}
            </View>
          )}
        </ScrollView>
      )}

      {/* Status change modal */}
      <Modal visible={!!editing} transparent animationType="fade" onRequestClose={() => setEditing(null)}>
        <Pressable className="flex-1 bg-black/40 justify-end" onPress={() => setEditing(null)}>
          <Pressable className="bg-cream-50 rounded-t-3xl p-6" onPress={(e) => e.stopPropagation()}>
            <Text className="font-display text-xl text-wine-700 mb-1">Set order status</Text>
            <Text className="text-warmgray-500 text-sm mb-4">{editing?.customer_name}</Text>
            <View className="gap-2">
              {STATUS_ORDER.map((s) => {
                const active = editing?.status === s
                return (
                  <Pressable
                    key={s}
                    onPress={() => editing && changeStatus(editing, s)}
                    className={`px-4 py-3 rounded-xl border flex-row items-center justify-between ${active ? 'bg-wine-50 border-wine-300' : 'bg-cream-50 border-cream-300'}`}
                  >
                    <Text className={`font-medium ${active ? 'text-wine-700' : 'text-charcoal'}`}>{STATUS_LABELS[s]}</Text>
                    {active ? <Text className="text-wine-600">●</Text> : null}
                  </Pressable>
                )
              })}
            </View>
            <Pressable onPress={() => setEditing(null)} className="mt-4 py-3 items-center">
              <Text className="text-warmgray-500 font-medium">Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  )
}
