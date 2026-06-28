'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PasswordInput } from '@/components/shared/PasswordInput'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError || !authData.user) {
      setLoading(false)
      setError('Invalid email or password. Please try again.')
      return
    }

    const { data: adminRow } = await supabase
      .from('admin_users')
      .select('id')
      .eq('id', authData.user.id)
      .maybeSingle()

    setLoading(false)

    if (!adminRow) {
      await supabase.auth.signOut()
      setError('Access denied. This account does not have admin privileges.')
      return
    }

    router.push('/admin/dashboard')
    router.refresh()
  }

  const inputClass = 'w-full border border-cream-300 rounded-xl px-4 py-3 text-charcoal placeholder-warmgray-400 bg-cream-50 focus:outline-none focus:ring-2 focus:ring-wine-500/25 focus:border-wine-500 transition-all'

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-wine-100/40 blur-3xl" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-brass-300/20 blur-3xl" />
      <div className="w-full max-w-md relative animate-fade-in-up">
        {/* Logo area */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-linear-to-br from-brass-400 to-brass-600 flex items-center justify-center mx-auto mb-4 shadow-warm ring-2 ring-cream-50">
            <span className="font-display text-wine-800 text-2xl font-bold">A</span>
          </div>
          <h1 className="font-display text-3xl font-semibold text-wine-700">Ahadu Admin</h1>
          <p className="text-warmgray-500 text-sm mt-1.5">Sign in to manage orders</p>
        </div>

        <div className="bg-cream-50 rounded-3xl shadow-warm-lg ring-1 ring-cream-300 p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-charcoal mb-1.5">Email</label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-charcoal mb-1.5">Password</label>
              <PasswordInput
                required
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className={inputClass}
              />
            </div>

            {error && (
              <div className="bg-wine-50 border border-wine-100 rounded-xl px-4 py-3 text-sm text-wine-700 animate-scale-in">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-linear-to-br from-wine-600 to-wine-800 hover:brightness-110 active:scale-[0.99] disabled:from-warmgray-400 disabled:to-warmgray-400 text-cream-50 font-semibold transition-all duration-300 flex items-center justify-center gap-2 shadow-warm"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Signing in…
                </>
              ) : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-warmgray-400 mt-6 tracking-wide">Ahadu Fresh Meat — Admin Portal</p>
      </div>
    </div>
  )
}
