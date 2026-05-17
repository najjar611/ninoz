import type { Metadata } from 'next'
import { Nunito, Nunito_Sans } from 'next/font/google'
import './globals.css'

// ── FONTS ──
// Nunito — rounded, friendly, not childish — perfect for Ninoz
const fontDisplay = Nunito({
  subsets: ['latin'],
  weight: ['700', '800', '900'],
  variable: '--font-hero',
})

const fontBody = Nunito_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-body',
})

export const metadata: Metadata = {
  title: 'Ninoz — Fresh Daily Baby Meals',
  description: 'Fresh, healthy & yumi daily meals for your little ones. Cooked today, delivered to your door.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${fontDisplay.variable} ${fontBody.variable}`}>
        {children}
      </body>
    </html>
  )
}
