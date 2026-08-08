# Ninoz — Native app (Capacitor)

The native app is a **thin shell that loads the live site** (`https://ninoz.app`).
That means: **you update the app by deploying the website.** Users get the change
on their next app open — no App Store / Play Store resubmission needed.

You only rebuild + resubmit the native app when you change something *native*:
the app icon, splash screen, name/id, permissions, or a Capacitor plugin.

Config lives in `capacitor.config.ts` (appId `app.ninoz`, name `Ninoz`,
`server.url = https://ninoz.app`).

---

## One-time setup (on YOUR machine)

You need the platform tools locally — this can't be done in the cloud:
- **Android:** [Android Studio](https://developer.android.com/studio) + a Google Play account ($25 one-time).
- **iOS:** a **Mac** with **Xcode** + an Apple Developer account ($99/yr) + CocoaPods (`sudo gem install cocoapods`).

```bash
# in the project root
npm install                 # installs Capacitor (already in package.json)

# add the native projects (creates android/ and ios/ folders)
npx cap add android
npx cap add ios             # Mac only

# pull config + plugins into the native projects
npx cap sync
```

---

## Permissions (do once, after `cap add`)

The location picker uses GPS, so declare it:

**Android** — `android/app/src/main/AndroidManifest.xml`, inside `<manifest>`:
```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.INTERNET" />
```

**iOS** — `ios/App/App/Info.plist`, add:
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>نستخدم موقعك لتحديد عنوان التوصيل. / Used to set your delivery address.</string>
```

---

## App icon & splash screen

1. Put a 1024×1024 PNG icon at `resources/icon.png` and a 2732×2732 splash at `resources/splash.png`.
2. Generate all sizes:
```bash
npm install --save-dev @capacitor/assets
npx capacitor-assets generate --iconBackgroundColor '#0C1A15' --splashBackgroundColor '#0C1A15'
npx cap sync
```

---

## Run it

```bash
npx cap open android     # opens Android Studio → press Run
npx cap open ios         # opens Xcode → pick a device → press Run   (Mac only)
```
Because `server.url` points at ninoz.app, the app loads the live site immediately.

---

## Updating the app

- **Content / logic / UI / prices / text** → just deploy the website. Done. ✅
- **Native change** (icon, splash, permission, plugin, name/id) → `npx cap sync`,
  then rebuild in Android Studio / Xcode and upload a new build to the store.

---

## Publishing checklist

- **Android:** in Android Studio → Build → Generate Signed Bundle (`.aab`) → upload to Play Console.
- **iOS:** in Xcode → Product → Archive → Distribute App → upload to App Store Connect.
- Store listing needs: app name, description, screenshots, privacy policy URL, and a note
  that delivery is currently limited to specific areas.

> Note on Apple review (guideline 4.2): a pure website wrapper can be flagged. Ninoz has
> real functionality (accounts, plans, payments) + native geolocation, which normally clears
> this. If Apple pushes back, the fallback is bundling the web build + an OTA service
> (e.g. Capgo) — still push-to-update, without store review.
