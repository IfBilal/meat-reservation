import { Platform } from 'react-native'
import * as FileSystem from 'expo-file-system/legacy'
import * as Sharing from 'expo-sharing'
import { format } from 'date-fns'
import { Order } from '../types'
import { MEAT_TYPES, STATUS_LABELS } from './constants'

function toCsv(orders: Order[]): string {
  const headers = [
    'Customer Name', 'Phone', 'Email', 'Pickup Date',
    ...MEAT_TYPES.map((m) => `${m.label} (lbs)`),
    'Notes', 'Status', 'Ordered At',
  ]
  const rows = orders.map((o) => [
    o.customer_name, o.customer_phone, o.customer_email,
    format(new Date(o.pickup_date + 'T00:00:00'), 'MMM d, yyyy'),
    ...MEAT_TYPES.map((m) => String(o[m.key] ?? 0)),
    o.notes ?? '', STATUS_LABELS[o.status],
    format(new Date(o.created_at), 'MMM d, yyyy h:mm a'),
  ])
  const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`
  return [headers, ...rows].map((r) => r.map(esc).join(',')).join('\n')
}

export async function exportOrdersCsv(orders: Order[]) {
  const csv = toCsv(orders)
  const filename = `ahadu-orders-${format(new Date(), 'yyyy-MM-dd')}.csv`

  if (Platform.OS === 'web') {
    // Browser download
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
    return
  }

  const uri = FileSystem.cacheDirectory + filename
  await FileSystem.writeAsStringAsync(uri, csv, { encoding: FileSystem.EncodingType.UTF8 })
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'text/csv', dialogTitle: 'Export orders' })
  }
}
