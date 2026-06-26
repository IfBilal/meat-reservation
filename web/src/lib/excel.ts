import * as XLSX from 'xlsx'
import { Order } from '@/types'
import { format } from 'date-fns'
import { STATUS_LABELS, MEAT_TYPES } from './constants'

export function exportOrdersToExcel(orders: Order[], filename = 'ahadu-orders') {
  const rows = orders.map(o => {
    const meatDetails = MEAT_TYPES
      .filter(mt => o[mt.key] > 0)
      .map(mt => `${mt.label}: ${o[mt.key]} lbs`)
      .join(', ')

    return {
      'Customer Name': o.customer_name,
      'Phone':         o.customer_phone,
      'Email':         o.customer_email,
      'Pickup Date':   format(new Date(o.pickup_date + 'T00:00:00'), 'MMM d, yyyy'),
      'Tire (lbs)':    o.tire_lbs,
      'Kitfo (lbs)':   o.kitfo_lbs,
      'Tibs (lbs)':    o.tibs_lbs,
      'Godin (lbs)':   o.godin_lbs,
      'Gubet (lbs)':   o.gubet_lbs,
      'Kidney (lbs)':  o.kidney_lbs,
      'Order Details': meatDetails,
      'Notes':         o.notes ?? '',
      'Status':        STATUS_LABELS[o.status],
      'Ordered At':    format(new Date(o.created_at), 'MMM d, yyyy h:mm a'),
    }
  })

  const worksheet = XLSX.utils.json_to_sheet(rows)
  const colWidths = Object.keys(rows[0] ?? {}).map(key => ({
    wch: Math.max(key.length, ...rows.map(r => String((r as any)[key] ?? '').length))
  }))
  worksheet['!cols'] = colWidths

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders')
  const dateStr = format(new Date(), 'yyyy-MM-dd')
  XLSX.writeFile(workbook, `${filename}-${dateStr}.xlsx`)
}
