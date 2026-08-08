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
    SplashScreen: {
      // The web app calls SplashScreen.hide() as soon as it's mounted, so the
      // splash stays up through the load (no dark gap) and then hands straight
      // to the site. launchShowDuration is only a safety cap so the splash can
      // never get stuck if the site is slow or hasn't been redeployed yet.
      launchShowDuration: 4000,
      launchAutoHide: true,
      backgroundColor: '#0C1A15',
      showSpinner: true,
      spinnerColor: '#FF7A33',
      androidScaleType: 'CENTER_CROP',
    },
  },
}

export default config
