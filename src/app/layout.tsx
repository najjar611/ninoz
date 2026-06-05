import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Ninoz',
  description: 'Delicious, healthy meals for your little one',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
