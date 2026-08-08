'use client'

import { useEffect } from 'react'

// Runs only inside the native app: once the web app has mounted (site is ready),
// hide the native splash — so the splash stays up through the load instead of
// leaving a dark gap. Also matches the status bar to the dark theme.
// On the web (normal browser) every call is a no-op.
export default function CapacitorInit() {
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { Capacitor } = await import('@capacitor/core')
        if (!Capacitor.isNativePlatform()) return
        try {
          const { StatusBar, Style } = await import('@capacitor/status-bar')
          await StatusBar.setStyle({ style: Style.Dark })      // light icons on dark bg
          await StatusBar.setBackgroundColor({ color: '#0C1A15' }) // Android only
        } catch {}
        if (!cancelled) {
          const { SplashScreen } = await import('@capacitor/splash-screen')
          await SplashScreen.hide()
        }
      } catch {
        // packages absent (plain web) — nothing to do
      }
    })()
    return () => { cancelled = true }
  }, [])
  return null
}
