'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AdminUser } from '@/types'
import { PasswordInput } from '@/components/shared/PasswordInput'

export default function AdminsPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)

  const supabase = createClient()

  async function fetchAdmins() {
    const { data: { user } } = await supabase.auth.getUser()
    setCurrentUserId(user?.id ?? null)
    const { data } = await supabase.from('admin_users').select('*').order('created_at')
    if (data) setAdmins(data as AdminUser[])
    setLoading(false)
  }

  useEffect(() => { fetchAdmins() }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setCreating(true)

    const res = await fetch('/api/admin/create-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), password }),
    })
    const result = await res.json()
    setCreating(false)

    if (!res.ok) {
      setError(result.error ?? 'Failed to create admin.')
      return
    }

    setSuccess(`Admin ${email} created successfully.`)
    setEmail('')
    setPassword('')
    fetchAdmins()
  }

  async function handleRemove(admin: AdminUser) {
    if (!confirm(`Remove ${admin.email} as admin? They will lose all access.`)) return
    setRemovingId(admin.id)
    setError(null)
    setSuccess(null)

    const res = await fetch('/api/admin/delete-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: admin.id }),
    })
    const result = await res.json()
    setRemovingId(null)

    if (!res.ok) {
      setError(result.error ?? 'Failed to remove admin.')
      return
    }

    setSuccess(`${admin.email} has been removed.`)
    fetchAdmins()
  }

  const inputClass = 'w-full border border-cream-300 bg-cream-50 rounded-xl px-4 py-3 text-charcoal placeholder-warmgray-400 focus:outline-none focus:ring-2 focus:ring-wine-500/25 focus:border-wine-500 transition-all'

  return (
    <div className="max-w-2xl animate-fade-in-up">
      <h1 className="font-display text-3xl font-semibold text-wine-700 mb-1">Admin users</h1>
      <p className="text-warmgray-500 text-sm mb-6">Manage who has access to this admin panel.</p>

      {/* Current admins */}
      <div className="bg-cream-50 rounded-2xl ring-1 ring-cream-300 shadow-warm mb-6">
        <div className="px-5 py-4 border-b border-cream-200">
          <h2 className="font-display font-semibold text-charcoal">Current admins</h2>
        </div>
        {loading ? (
          <div className="px-5 py-5 space-y-3">
            <div className="skeleton h-6 w-full" />
            <div className="skeleton h-6 w-3/4" />
          </div>
        ) : (
          <ul className="divide-y divide-cream-200">
            {admins.map(admin => (
              <li key={admin.id} className="px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-linear-to-br from-brass-300 to-brass-500 flex items-center justify-center font-display font-bold text-wine-800 text-sm uppercase">
                    {admin.email.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-charcoal">{admin.email}</p>
                    {admin.id === currentUserId && (
                      <span className="text-xs text-brass-600 font-semibold">You</span>
                    )}
                  </div>
                </div>
                {admin.id !== currentUserId && (
                  <button
                    onClick={() => handleRemove(admin)}
                    disabled={removingId === admin.id}
                    className="px-3 py-1.5 rounded-lg border border-wine-200 text-wine-600 hover:bg-wine-50 disabled:opacity-40 text-xs font-medium transition-colors"
                  >
                    {removingId === admin.id ? 'Removing…' : 'Remove'}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Notifications */}
      {error && (
        <div className="bg-wine-50 border border-wine-100 rounded-xl px-4 py-3 text-sm text-wine-700 mb-4 animate-scale-in">{error}</div>
      )}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-700 mb-4 animate-scale-in">{success}</div>
      )}

      {/* Add admin */}
      <div className="bg-cream-50 rounded-2xl ring-1 ring-cream-300 shadow-warm">
        <div className="px-5 py-4 border-b border-cream-200">
          <h2 className="font-display font-semibold text-charcoal">Add new admin</h2>
        </div>
        <form onSubmit={handleCreate} className="px-5 py-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-charcoal mb-1.5">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="newadmin@example.com"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-charcoal mb-1.5">Password</label>
            <PasswordInput
              required
              minLength={6}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Min. 6 characters"
              className={inputClass}
            />
          </div>
          <button
            type="submit"
            disabled={creating}
            className="w-full py-3.5 rounded-xl bg-linear-to-br from-wine-600 to-wine-800 hover:brightness-110 active:scale-[0.99] disabled:from-warmgray-400 disabled:to-warmgray-400 text-cream-50 font-semibold transition-all duration-300 shadow-warm"
          >
            {creating ? 'Creating…' : 'Create admin'}
          </button>
        </form>
      </div>
    </div>
  )
}
