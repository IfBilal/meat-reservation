'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { PasswordInput } from '@/components/shared/PasswordInput'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    let resolved = false

    const resolve = (ready: boolean, err?: string) => {
      if (resolved) return
      resolved = true
      if (ready) setSessionReady(true)
      else setError(err ?? 'Reset link expired. Please request a new one.')
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') resolve(true)
    })

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) resolve(true)
    })

    // If neither fires within 6s the link is stale or wrong-browser
    const timer = setTimeout(() => resolve(false, 'Reset link expired or was opened in a different browser. Please request a new one.'), 6000)

    return () => { subscription.unsubscribe(); clearTimeout(timer) }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }
    setLoading(true)
    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (updateError) { setError(updateError.message); return }
    setDone(true)
    setTimeout(() => router.replace('/login'), 2500)
  }

  const inputClass = 'w-full border border-cream-300 rounded-xl px-4 py-3 text-charcoal placeholder-warmgray-400 bg-cream-50 focus:outline-none focus:ring-2 focus:ring-wine-500/25 focus:border-wine-500 transition-all'

  if (done) return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <div className="w-20 h-20 rounded-full bg-linear-to-br from-brass-400 to-brass-600 flex items-center justify-center mx-auto mb-5 shadow-warm">
          <span className="text-3xl">✓</span>
        </div>
        <h1 className="font-display text-3xl font-semibold text-wine-700 mb-2">Password updated!</h1>
        <p className="text-warmgray-500">Redirecting you to sign in…</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-wine-100/40 blur-3xl" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-brass-300/20 blur-3xl" />
      <div className="w-full max-w-md relative animate-fade-in-up">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-linear-to-br from-brass-400 to-brass-600 flex items-center justify-center mx-auto mb-4 shadow-warm ring-2 ring-cream-50">
            <span className="font-display text-wine-800 text-2xl font-bold">A</span>
          </div>
          <h1 className="font-display text-3xl font-semibold text-wine-700">Set new password</h1>
          <p className="text-warmgray-500 text-sm mt-1.5">Choose a strong password for your account</p>
        </div>

        <div className="bg-cream-50 rounded-2xl shadow-warm-lg ring-1 ring-cream-300 p-8">
          {!sessionReady && !error ? (
            <div className="flex flex-col items-center gap-3 py-6">
              <svg className="animate-spin w-8 h-8 text-wine-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              <p className="text-sm text-warmgray-500">Verifying reset link…</p>
            </div>
          ) : error ? (
            <div className="space-y-4">
              <div className="bg-wine-50 border border-wine-100 rounded-xl px-4 py-3 text-sm text-wine-700">{error}</div>
              <Link href="/forgot-password" className="block w-full py-3.5 rounded-xl bg-linear-to-br from-wine-600 to-wine-800 text-cream-50 font-semibold text-center shadow-warm">
                Send a new reset link →
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-charcoal mb-1.5">New password</label>
                <PasswordInput required autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-charcoal mb-1.5">Confirm password</label>
                <PasswordInput required autoComplete="new-password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="••••••••" className={inputClass} />
              </div>
              {error && <div className="bg-wine-50 border border-wine-100 rounded-xl px-4 py-3 text-sm text-wine-700">{error}</div>}
              <button type="submit" disabled={loading} className="group w-full py-3.5 rounded-xl bg-linear-to-br from-wine-600 to-wine-800 hover:brightness-110 active:scale-[0.99] disabled:from-warmgray-400 disabled:to-warmgray-400 text-cream-50 font-semibold transition-all duration-300 flex items-center justify-center gap-2 shadow-warm">
                {loading ? (<><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Updating…</>) : (<><span>Update password</span><span className="transition-transform duration-300 group-hover:translate-x-1">→</span></>)}
              </button>
              <p className="text-center text-sm text-warmgray-500">
                <Link href="/login" className="text-wine-600 font-semibold hover:text-wine-700 hover:underline">Back to sign in</Link>
              </p>
            </form>
          )}
        </div>
        <p className="text-center text-xs text-warmgray-400 mt-6 tracking-wide">Ahadu Fresh Meat · Reserve your cut</p>
      </div>
    </div>
  )
}
