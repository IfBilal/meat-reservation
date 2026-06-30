// Fire-and-forget confirmation email — never blocks order success (mirrors web).
export function sendConfirmation(order: Record<string, unknown>) {
  const endpoint = process.env.EXPO_PUBLIC_EMAIL_ENDPOINT
  if (!endpoint) return
  fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(order),
  }).catch(() => {})
}
