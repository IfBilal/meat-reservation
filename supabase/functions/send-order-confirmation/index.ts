import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts'

interface OrderRecord {
  customer_name: string
  customer_email: string
  customer_phone: string
  pickup_date: string
  tire_lbs: number
  kitfo_lbs: number
  tibs_lbs: number
  godin_lbs: number
  gubet_lbs: number
  kidney_lbs: number
  notes: string | null
}

const MEAT_LABELS: Record<string, string> = {
  tire_lbs:   'Tire / Tere (Raw Beef)',
  kitfo_lbs:  'Kitfo (Minced Raw Beef)',
  tibs_lbs:   'Tibs (Sautéed Beef)',
  godin_lbs:  'Godin (Beef Ribs)',
  gubet_lbs:  'Gubet (Tripe / Offal)',
  kidney_lbs: 'Kidney',
}

function buildEmailHtml(order: OrderRecord): string {
  const meatRows = Object.entries(MEAT_LABELS)
    .filter(([key]) => order[key as keyof OrderRecord] as number > 0)
    .map(([key, label]) => `<tr><td style="padding:6px 12px;color:#555">${label}</td><td style="padding:6px 12px;font-weight:600">${order[key as keyof OrderRecord]} lbs</td></tr>`)
    .join('')

  return `
<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#333">
  <div style="background:#8B0000;padding:24px;text-align:center">
    <h1 style="color:#fff;margin:0;font-size:22px">Ahadu Fresh Meat</h1>
    <p style="color:#ffcccc;margin:4px 0 0">Order Confirmation</p>
  </div>
  <div style="padding:24px">
    <p>Hello <strong>${order.customer_name}</strong>,</p>
    <p>Thank you for your reservation! We've received your order and will contact you to confirm.</p>
    <h3 style="color:#8B0000;border-bottom:2px solid #8B0000;padding-bottom:6px">Order Details</h3>
    <p><strong>Pickup Date:</strong> ${new Date(order.pickup_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
    <table style="width:100%;border-collapse:collapse;margin:12px 0">
      <thead>
        <tr style="background:#f5f5f5">
          <th style="padding:8px 12px;text-align:left;color:#555">Item</th>
          <th style="padding:8px 12px;text-align:left;color:#555">Quantity</th>
        </tr>
      </thead>
      <tbody>${meatRows}</tbody>
    </table>
    ${order.notes ? `<p><strong>Special Requests:</strong> ${order.notes}</p>` : ''}
    <hr style="margin:24px 0;border:none;border-top:1px solid #eee">
    <p style="color:#777;font-size:14px">Questions? Call us or reply to this email.</p>
  </div>
  <div style="background:#f5f5f5;padding:16px;text-align:center;font-size:12px;color:#999">
    Ahadu Market — Fresh Meat Reservation System
  </div>
</body>
</html>`
}

serve(async (req) => {
  try {
    const payload = await req.json()
    const order: OrderRecord = payload.record

    const client = new SMTPClient({
      connection: {
        hostname: Deno.env.get('SMTP_HOST') ?? 'smtp.gmail.com',
        port: Number(Deno.env.get('SMTP_PORT') ?? '465'),
        tls: true,
        auth: {
          username: Deno.env.get('SMTP_USER')!,
          password: Deno.env.get('SMTP_PASS')!,
        },
      },
    })

    await client.send({
      from: Deno.env.get('SMTP_USER')!,
      to: order.customer_email,
      subject: 'Your Ahadu Fresh Meat Reservation is Confirmed',
      html: buildEmailHtml(order),
    })

    await client.close()
    return new Response(JSON.stringify({ success: true }), { status: 200 })
  } catch (err) {
    console.error('Email send error:', err)
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
})
