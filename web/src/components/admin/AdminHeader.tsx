'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function AdminHeader() {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  return (
    <header className="bg-wine-700 text-cream-50 shadow-warm print:hidden">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-full bg-linear-to-br from-brass-400 to-brass-600 flex items-center justify-center font-display font-bold text-wine-800 text-sm">A</span>
            <span className="font-display font-semibold text-lg">Ahadu Admin</span>
          </span>
          <nav className="flex items-center gap-1">
            <Link
              href="/admin/dashboard"
              className={`text-sm font-medium px-3 py-1.5 rounded-full transition-colors ${pathname === '/admin/dashboard' ? 'bg-cream-50/15 text-white ring-1 ring-cream-50/20' : 'text-cream-100 hover:text-white hover:bg-cream-50/10'}`}
            >
              Orders
            </Link>
            <Link
              href="/admin/admins"
              className={`text-sm font-medium px-3 py-1.5 rounded-full transition-colors ${pathname === '/admin/admins' ? 'bg-cream-50/15 text-white ring-1 ring-cream-50/20' : 'text-cream-100 hover:text-white hover:bg-cream-50/10'}`}
            >
              Admins
            </Link>
          </nav>
        </div>
        <button
          onClick={handleSignOut}
          className="text-sm bg-cream-50/10 hover:bg-cream-50/20 px-3.5 py-1.5 rounded-full ring-1 ring-cream-50/15 transition-colors"
        >
          Sign out
        </button>
      </div>
    </header>
  )
}
