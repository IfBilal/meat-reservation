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
    <header className="bg-[#8B0000] text-white shadow print:hidden">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="font-bold text-lg">Ahadu Admin</span>
          <nav className="flex items-center gap-4">
            <Link
              href="/admin/dashboard"
              className={`text-sm font-medium transition-colors ${pathname === '/admin/dashboard' ? 'text-white' : 'text-red-200 hover:text-white'}`}
            >
              Orders
            </Link>
            <Link
              href="/admin/admins"
              className={`text-sm font-medium transition-colors ${pathname === '/admin/admins' ? 'text-white' : 'text-red-200 hover:text-white'}`}
            >
              Admins
            </Link>
          </nav>
        </div>
        <button
          onClick={handleSignOut}
          className="text-sm text-red-200 hover:text-white transition-colors"
        >
          Sign Out
        </button>
      </div>
    </header>
  )
}
