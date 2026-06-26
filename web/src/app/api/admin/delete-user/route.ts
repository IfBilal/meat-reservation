import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { userId } = await request.json()

  if (userId === user.id) {
    return NextResponse.json({ error: 'You cannot remove yourself.' }, { status: 400 })
  }

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { error: dbError } = await adminClient
    .from('admin_users')
    .delete()
    .eq('id', userId)

  if (dbError) {
    return NextResponse.json({ error: 'Failed to remove admin record.' }, { status: 500 })
  }

  const { error: authError } = await adminClient.auth.admin.deleteUser(userId)
  if (authError) {
    return NextResponse.json({ error: 'Admin record removed but failed to delete auth user.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
