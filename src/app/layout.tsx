import type { Metadata } from 'next'
import { Fascinate, Changa_One, Love_Ya_Like_A_Sister, Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'

const fontLogo = Fascinate({ subsets: ['latin'], weight: '400', variable: '--font-logo' })
const fontHero = Changa_One({ subsets: ['latin'], weight: '400', variable: '--font-hero' })
const fontDesc = Love_Ya_Like_A_Sister({ subsets: ['latin'], weight: '400', variable: '--font-desc' })
const fontBody = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-body' })

export const metadata: Metadata = {
  title: 'Ninoz — Fresh Daily Baby Meals',
  description: 'Fresh organic meals for babies 3 months to 3 years. Delivered daily across Riyadh.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${fontLogo.variable} ${fontHero.variable} ${fontDesc.variable} ${fontBody.variable}`}>
        {children}
      </body>
    </html>
  )
}
