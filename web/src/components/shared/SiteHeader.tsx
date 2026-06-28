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
    <header className="sticky top-0 z-30 bg-wine-700/95 text-cream-50 shadow-warm-lg backdrop-blur-md">
      <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-12 h-12 rounded-full bg-linear-to-br from-brass-400 to-brass-600 flex items-center justify-center font-display font-bold text-xl text-wine-800 shadow-inner ring-2 ring-cream-50/20 transition-transform duration-500 group-hover:scale-105">
            A
          </div>
          <div>
            <h1 className="font-display text-xl font-semibold tracking-tight leading-none">Ahadu Fresh Meat</h1>
            <p className="text-brass-300 text-xs mt-1 tracking-wide">Reserve your cut · pick up fresh</p>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <WhatsAppButton />
          {userEmail ? (
            <div className="flex items-center gap-3">
              <Link
                href="/my-orders"
                className="text-sm text-cream-100 hover:text-white transition-colors hidden sm:block relative after:absolute after:left-0 after:-bottom-1 after:h-px after:w-0 after:bg-brass-400 after:transition-all hover:after:w-full"
              >
                My Orders
              </Link>
              <button
                onClick={handleSignOut}
                className="text-sm bg-cream-50/10 hover:bg-cream-50/20 px-3.5 py-1.5 rounded-full transition-colors ring-1 ring-cream-50/15"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="text-sm text-cream-100 hover:text-white transition-colors px-2"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="text-sm bg-linear-to-br from-brass-400 to-brass-600 text-wine-800 font-semibold px-4 py-1.5 rounded-full hover:shadow-warm hover:brightness-105 transition-all"
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
