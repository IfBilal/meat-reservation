// admin-manage — shared Edge Function for add/remove admin (web + mobile).
// Verifies the caller is an admin via their JWT, then uses the service-role
// key (server-side only) to create/delete the auth user + admin_users row.
import { createClient } from 'jsr:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const url = Deno.env.get('SUPABASE_URL')!
    const anon = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const jwt = (req.headers.get('Authorization') ?? '').replace('Bearer ', '')
    if (!jwt) return json({ error: 'Unauthorized' }, 401)

    // 1) Caller client bound to their JWT — verify they are an admin.
    const caller = createClient(url, anon, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    })
    const { data: { user } } = await caller.auth.getUser()
    if (!user) return json({ error: 'Unauthorized' }, 401)

    const { data: adminRow } = await caller
      .from('admin_users')
      .select('id')
      .eq('id', user.id)
      .maybeSingle()
    if (!adminRow) return json({ error: 'Forbidden — not an admin.' }, 403)

    // 2) Service-role client (key never leaves the function) does the work.
    const admin = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const body = await req.json()
    const action = body?.action

    if (action === 'create') {
      const email = String(body.email ?? '').trim()
      const password = String(body.password ?? '')
      if (!email || !password) return json({ error: 'Email and password are required.' }, 400)

      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      })
      if (createError || !created.user) {
        return json({ error: createError?.message ?? 'Failed to create user.' }, 500)
      }
      const { error: insertError } = await admin.from('admin_users').insert([{ id: created.user.id, email }])
      if (insertError) {
        await admin.auth.admin.deleteUser(created.user.id)
        return json({ error: 'Failed to register admin.' }, 500)
      }
      return json({ success: true })
    }

    if (action === 'delete') {
      const userId = String(body.userId ?? '')
      if (!userId) return json({ error: 'userId is required.' }, 400)
      if (userId === user.id) return json({ error: 'You cannot remove yourself.' }, 400)

      const { error: dbError } = await admin.from('admin_users').delete().eq('id', userId)
      if (dbError) return json({ error: 'Failed to remove admin record.' }, 500)
      await admin.auth.admin.deleteUser(userId)
      return json({ success: true })
    }

    return json({ error: 'Unknown action.' }, 400)
  } catch (e) {
    return json({ error: String(e) }, 500)
  }
})
