'use client'

import { usePathname } from 'next/navigation'

// Fades + rises the page content in on every route change, and staggers the
// entrance of direct child "cards" for a native, polished feel.
export default function AccountPageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return (
    <div key={pathname} className="acct-page">
      <style>{`
        @keyframes acctPageIn { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes acctRise { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .acct-page { animation: acctPageIn 0.42s cubic-bezier(.16,1,.3,1) both; }
        /* Stagger the first several direct blocks so cards cascade in. */
        .acct-page > * { animation: acctRise 0.5s cubic-bezier(.16,1,.3,1) both; }
        .acct-page > *:nth-child(1) { animation-delay: 0.04s; }
        .acct-page > *:nth-child(2) { animation-delay: 0.10s; }
        .acct-page > *:nth-child(3) { animation-delay: 0.16s; }
        .acct-page > *:nth-child(4) { animation-delay: 0.22s; }
        .acct-page > *:nth-child(5) { animation-delay: 0.28s; }
        @media (prefers-reduced-motion: reduce) {
          .acct-page, .acct-page > * { animation: none !important; }
        }
      `}</style>
      {children}
    </div>
  )
}
