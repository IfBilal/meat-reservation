import { supabase } from './supabase'

const FN_URL = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/admin-manage`

async function call(body: Record<string, unknown>) {
  const { data: { session } } = await supabase.auth.getSession()
  const res = await fetch(FN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.access_token ?? ''}`,
      apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
    },
    body: JSON.stringify(body),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error || 'Request failed')
  return json
}

export const createAdmin = (email: string, password: string) =>
  call({ action: 'create', email, password })

export const deleteAdmin = (userId: string) => call({ action: 'delete', userId })
