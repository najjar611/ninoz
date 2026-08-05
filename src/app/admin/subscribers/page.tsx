'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Replaced by the Customers hub — keep this path working for old bookmarks.
export default function SubscribersRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace('/admin/customers') }, [router])
  return <div style={{ padding: 40, fontFamily: 'Nunito, sans-serif', color: '#B0A098' }}>Redirecting to Customers…</div>
}
