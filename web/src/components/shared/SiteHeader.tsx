'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { WhatsAppButton } from './WhatsAppButton'

export function SiteHeader() {
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserEmail(user?.email ?? null)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null)
    })
    return () => subscription.unsubscribe()
  }, [supabase])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="bg-[#8B0000] text-white shadow-lg">
      <div className="max-w-4xl mx-auto px-4 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center font-bold text-xl shadow-inner">
            A
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Ahadu Fresh Meat</h1>
            <p className="text-red-200 text-xs">Reserve your order online</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <WhatsAppButton />
          {userEmail ? (
            <div className="flex items-center gap-3">
              <Link
                href="/my-orders"
                className="text-sm text-red-100 hover:text-white transition-colors hidden sm:block"
              >
                My Orders
              </Link>
              <button
                onClick={handleSignOut}
                className="text-sm bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="text-sm text-red-100 hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="text-sm bg-white text-[#8B0000] font-semibold px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
