import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Ninoz | Fresh Daily Meals for Babies & Toddlers in Riyadh',
  description: 'Ninoz delivers fresh, healthy, preservative-free meals for babies and toddlers in Riyadh. Prepared daily by certified nutritionists. No sugar, no salt, no additives. Subscribe now.',
  keywords: ['baby food Riyadh', 'وجبات أطفال الرياض', 'healthy baby meals Saudi Arabia', 'toddler meals Riyadh', 'أكل أطفال طازج', 'Ninoz'],
  openGraph: {
    title: 'Ninoz | Fresh Daily Meals for Babies & Toddlers',
    description: 'Fresh, preservative-free meals for babies 0–3 years. Delivered daily across Riyadh.',
    type: 'website',
    locale: 'en_SA',
    siteName: 'Ninoz',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ninoz | Fresh Daily Meals for Babies & Toddlers',
    description: 'Fresh, preservative-free meals for babies 0–3 years. Delivered daily across Riyadh.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
