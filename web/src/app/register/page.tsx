'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { PasswordInput } from '@/components/shared/PasswordInput'

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [verifyEmail, setVerifyEmail] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setLoading(true)
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name.trim() } },
    })
    setLoading(false)
    if (authError) {
      setError(authError.message)
      return
    }
    setVerifyEmail(email)
  }

  if (verifyEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-wine-100/40 blur-3xl" />
        <div className="w-full max-w-md text-center relative animate-scale-in">
          <div className="w-20 h-20 rounded-full bg-linear-to-br from-brass-300 to-brass-500 flex items-center justify-center mx-auto mb-5 text-3xl shadow-warm ring-2 ring-cream-50 animate-floaty">
            📬
          </div>
          <h1 className="font-display text-3xl font-semibold text-wine-700 mb-2">Check your email</h1>
          <p className="text-warmgray-500 mb-1">We sent a verification link to:</p>
          <p className="font-semibold text-charcoal mb-6">{verifyEmail}</p>
          <div className="bg-cream-50 rounded-2xl ring-1 ring-cream-300 shadow-warm p-6 text-left space-y-3 mb-6">
            <p className="text-sm text-warmgray-600 flex items-start gap-2">
              <span className="text-brass-600 mt-0.5">✓</span>
              Open the email from Ahadu Fresh Meat
            </p>
            <p className="text-sm text-warmgray-600 flex items-start gap-2">
              <span className="text-brass-600 mt-0.5">✓</span>
              Click the <span className="font-semibold text-charcoal">&quot;Confirm your email&quot;</span> link
            </p>
            <p className="text-sm text-warmgray-600 flex items-start gap-2">
              <span className="text-brass-600 mt-0.5">✓</span>
              Then sign in with your new account
            </p>
          </div>
          <button
            onClick={() => router.push('/login')}
            className="w-full py-3.5 rounded-xl bg-linear-to-br from-wine-600 to-wine-800 hover:brightness-110 text-cream-50 font-semibold transition-all shadow-warm"
          >
            Go to sign in
          </button>
          <p className="text-xs text-warmgray-400 mt-4">Didn&apos;t receive it? Check your spam folder.</p>
        </div>
      </div>
    )
  }

  const inputClass = 'w-full border border-cream-300 rounded-xl px-4 py-3 text-charcoal placeholder-warmgray-400 bg-cream-50 focus:outline-none focus:ring-2 focus:ring-wine-500/25 focus:border-wine-500 transition-all'

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 relative overflow-hidden">
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-wine-100/40 blur-3xl" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-brass-300/20 blur-3xl" />
      <div className="w-full max-w-md relative animate-fade-in-up">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-linear-to-br from-brass-400 to-brass-600 flex items-center justify-center mx-auto mb-4 shadow-warm ring-2 ring-cream-50">
            <span className="font-display text-wine-800 text-2xl font-bold">A</span>
          </div>
          <h1 className="font-display text-3xl font-semibold text-wine-700">Create your account</h1>
          <p className="text-warmgray-500 text-sm mt-1.5">Register to place and track your orders</p>
        </div>

        <div className="bg-cream-50 rounded-2xl shadow-warm-lg ring-1 ring-cream-300 p-8">
          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-charcoal mb-1.5">Full Name</label>
              <input
                type="text"
                required
                autoComplete="name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Enter your full name"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-charcoal mb-1.5">Email</label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-charcoal mb-1.5">Password</label>
              <PasswordInput
                required
                minLength={6}
                autoComplete="new-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                className={inputClass}
              />
            </div>

            {error && (
              <div className="bg-wine-50 border border-wine-100 rounded-xl px-4 py-3 text-sm text-wine-700 animate-scale-in">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="group w-full py-3.5 rounded-xl bg-linear-to-br from-wine-600 to-wine-800 hover:brightness-110 active:scale-[0.99] disabled:from-warmgray-400 disabled:to-warmgray-400 text-cream-50 font-semibold transition-all duration-300 flex items-center justify-center gap-2 shadow-warm"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Creating account…
                </>
              ) : (
                <>
                  <span>Create account</span>
                  <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-warmgray-500 mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-wine-600 font-semibold hover:text-wine-700 hover:underline">Sign in</Link>
          </p>
        </div>

        <p className="text-center text-xs text-warmgray-400 mt-6 tracking-wide">Ahadu Fresh Meat · Reserve your cut</p>
      </div>
    </div>
  )
}
