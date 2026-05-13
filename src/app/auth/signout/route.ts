// ════════════════════════════════════════════════════════════
// SIGN OUT ROUTE
// Signs the user out and redirects to /login
// Called from the sign out button in any layout
// ════════════════════════════════════════════════════════════

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'))
}
