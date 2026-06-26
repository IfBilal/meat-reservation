'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AdminUser } from '@/types'

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

  const inputClass = 'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8B0000] focus:border-transparent transition-shadow text-sm'

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Admin Users</h1>
      <p className="text-gray-500 text-sm mb-6">Manage who has access to this admin panel.</p>

      {/* Current admins */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-6">
        <div className="px-5 py-4 border-b border-gray-50">
          <h2 className="font-semibold text-gray-800">Current Admins</h2>
        </div>
        {loading ? (
          <div className="px-5 py-8 text-center text-gray-400 text-sm">Loading...</div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {admins.map(admin => (
              <li key={admin.id} className="px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{admin.email}</p>
                  {admin.id === currentUserId && (
                    <span className="text-xs text-[#8B0000] font-medium">You</span>
                  )}
                </div>
                {admin.id !== currentUserId && (
                  <button
                    onClick={() => handleRemove(admin)}
                    disabled={removingId === admin.id}
                    className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-40 text-xs font-medium transition-colors"
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
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 mb-4">{error}</div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700 mb-4">{success}</div>
      )}

      {/* Add admin */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-50">
          <h2 className="font-semibold text-gray-800">Add New Admin</h2>
        </div>
        <form onSubmit={handleCreate} className="px-5 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
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
            className="w-full py-2.5 rounded-xl bg-[#8B0000] hover:bg-[#6b0000] disabled:bg-gray-400 text-white font-semibold text-sm transition-colors"
          >
            {creating ? 'Creating…' : 'Create Admin'}
          </button>
        </form>
      </div>
    </div>
  )
}
