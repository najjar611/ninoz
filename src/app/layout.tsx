import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Ninoz — Fresh Daily Meals for Babies',
  description: 'Fresh organic meals for babies 3 months to 3 years. Delivered daily across Riyadh.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}