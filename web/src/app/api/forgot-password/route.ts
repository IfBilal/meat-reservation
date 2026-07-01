import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    if (!email) return NextResponse.json({ error: 'Email required.' }, { status: 400 })

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Generate a direct recovery link — no PKCE, works in any browser
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
      },
    })

    if (error || !data?.properties?.action_link) {
      // Don't reveal whether the email exists
      return NextResponse.json({ success: true })
    }

    const resetLink = data.properties.action_link

    const smtpUser = process.env.SMTP_USER
    const smtpPass = process.env.SMTP_PASS
    if (!smtpUser || !smtpPass) {
      return NextResponse.json({ error: 'Email not configured.' }, { status: 500 })
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST ?? 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT ?? '465'),
      secure: Number(process.env.SMTP_PORT ?? '465') === 465,
      auth: { user: smtpUser, pass: smtpPass },
    })

    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME ?? 'Ahadu Fresh Meat'}" <${smtpUser}>`,
      to: email,
      subject: 'Reset your Ahadu Fresh Meat password',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#333">
          <div style="background:#7A1420;padding:24px;text-align:center">
            <h1 style="color:#fff;margin:0;font-size:22px">Ahadu Fresh Meat</h1>
            <p style="color:#ffcccc;margin:4px 0 0">Password Reset</p>
          </div>
          <div style="padding:32px">
            <p>You requested a password reset. Click the button below to set a new password.</p>
            <p style="text-align:center;margin:32px 0">
              <a href="${resetLink}" style="background:#7A1420;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px">
                Reset my password
              </a>
            </p>
            <p style="color:#999;font-size:13px">This link expires in 1 hour. If you didn't request a reset, ignore this email.</p>
          </div>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('forgot-password error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
