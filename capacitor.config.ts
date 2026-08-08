import type { CapacitorConfig } from '@capacitor/cli'

// Ninoz native shell (Option A): the app loads the live hosted site, so any web
// deploy updates the app instantly — no store resubmission for content/logic.
// `capacitor-webroot` is only the offline fallback shown when there's no network.
const config: CapacitorConfig = {
  appId: 'app.ninoz',
  appName: 'Ninoz',
  webDir: 'capacitor-webroot',
  server: {
    url: 'https://ninoz.app',
    cleartext: false,
    // Keep every ninoz.app address inside the app's WebView instead of
    // bouncing to the system browser (e.g. an apex -> www redirect).
    allowNavigation: ['ninoz.app', 'www.ninoz.app', '*.ninoz.app'],
  },
  backgroundColor: '#0C1A15',
  plugins: {
    // Splash disabled — hide immediately on launch (dark background only).
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: true,
      backgroundColor: '#0C1A15',
    },
  },
}

export default config
