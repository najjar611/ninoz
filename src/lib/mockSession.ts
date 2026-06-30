// Stand-in for real WhatsApp OTP auth, which isn't wired up yet.
// Keeps the logged-in subscriber's id in localStorage so the account flow
// can be built and tested end-to-end now, then swapped for Supabase Auth
// (auth_user_id / auth.uid()) once WhatsApp + Maps credentials are ready.
const KEY = 'ninoz_mock_subscriber_id'

export function getMockSubscriberId(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(KEY)
}

export function setMockSubscriberId(id: string) {
  if (typeof window === 'undefined') return
  localStorage.setItem(KEY, id)
}

export function clearMockSession() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(KEY)
}
