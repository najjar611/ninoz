'use client'

import { usePathname } from 'next/navigation'

export default function AccountWidthWrap({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const wide = pathname?.startsWith('/account/dashboard')
  return <div style={{ width: '100%', maxWidth: wide ? 1000 : 420, transition: 'max-width 0.2s' }}>{children}</div>
}
