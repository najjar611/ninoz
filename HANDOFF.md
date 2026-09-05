# Ninoz — Project Handoff / Current Status

> Read this first. It captures where the project stands so a new session (or a
> new person) can continue without re-deriving everything.
> Last updated: 2026-09 (Play Store submission stage).

## What Ninoz is
A bilingual (Arabic RTL / English) subscription service for freshly prepared
baby & toddler meals, serving North Riyadh (more areas "coming soon").
- **Customer web app** (home, meals, stages, sign-in, plan, delivery location, dashboard)
- **Admin portal** (`/admin`) to manage catalog, website content, delivery, customers, etc.

## Architecture
- **Next.js 16** (a customized fork — see `AGENTS.md`: read `node_modules/next/dist/docs/` before writing Next code) + **Supabase** (auth-lite via mock session, data, RLS).
- **Hosting:** Vercel, connected to GitHub repo `najjar611/ninoz`, branch **`master`**. Push to `master` → Vercel auto-deploys → **https://ninoz.app**.
- **Native app:** **Capacitor (Option A)** — a thin native shell whose WebView loads the LIVE site (`server.url = https://ninoz.app`). See `capacitor.config.ts` + `CAPACITOR.md`.
  - **Consequence:** updating the app = **deploying the website** (push to master). No app rebuild/resubmission for content/logic/UI changes. Only *native* changes (icon, splash, permissions, plugins, `capacitor.config.ts`) need `npx cap sync` + a rebuild.
  - App id: **`app.ninoz`** · App name: **Ninoz — Baby Meals**.

## How to update (important mental model)
| You changed… | What to do |
|---|---|
| Anything in `src/` (the app) | commit + push to `master` → Vercel deploys → app shows it on next open |
| `capacitor.config.ts`, `capacitor-webroot/`, a plugin, icon, splash | `npx cap sync` → rebuild in Android Studio |

## Current status (Google Play)
- **Play Console account:** "Little Meals" — **personal** account. Identity verified.
- **Device-access verification:** requires a *physical* Android phone signed into the Play Console app (emulators are rejected). (Check if still pending.)
- **App:** created, package `app.ninoz`, registered for Android developer verification.
- **Internal testing:** release 1 (1.0) LIVE ("Available to internal testers").
- **Closed testing (Alpha):** release 1 (1.0) submitted, **In review** (first-app review, a few days).
- **Production gate (personal account rule):** need **≥12 testers opted in to the closed test for 14 continuous days**, THEN "Apply for production" unlocks → final review → live.
  - Plan: add a paid tester-community **Google Group** to Closed testing → Testers, + a few real friends/family. Keep ≥12 opted in for 14 days.
- **Store listing:** name, short/full descriptions (EN + AR), category Food & Drink, privacy URL, data safety, content rating (Everyone), target audience 18+ — all completed.
- **Signed bundle:** `app-release.aab` built. **Keystore** at `OneDrive\Ninoz\Document\APP\` (keystore file + both passwords MUST be kept forever — required for every future update).

## Live/legal pages
- **Privacy policy:** public at **https://ninoz.app/privacy** (bilingual). Editable in **Admin → Website → Privacy** (`site_content` keys `privacy_content` / `privacy_content_ar`).

## Parked / TODO
1. **Splash background green** doesn't exactly match the logo green. Fix in `android/app/src/main/res/values/styles.xml` → `windowSplashScreenBackground` (and re-run `@capacitor/assets` with `--splashBackgroundColor`/`--iconBackgroundColor` set to the logo's exact hex). Uninstall app + Clean Project + Run to see it.
2. **Real OTP (Msegat):** sign-in currently uses **MOCK OTP `1234`** (`src/app/account/signin/page.tsx`, `MOCK_OTP`). When real OTP is wired, UPDATE the Play Console "Sign in details" (App access) demo login, or reviewers/updates get blocked.
3. **Real payment (Moyasar):** currently mock/deferred.
4. **iOS:** needs macOS access (no Mac available → use a cloud Mac like MacinCloud, or CI like Codemagic) + Apple Developer $99/yr. Steps: `npx cap add ios`, add `NSLocationWhenInUseUsageDescription` to `ios/App/App/Info.plist`, icons/splash, Archive in Xcode. iOS build canNOT be produced on Windows.
5. **Optional SQL not yet required:** out-of-area modal text keys (`ooa_modal_*`), and the privacy seed (already run if `/privacy` shows real text).

## Gotchas / environment notes
- **git push from the AI cloud container is blocked (403).** The USER pushes to `master` from their own machine (that's how Vercel deploys). AI-side commits are local only — treat the deployed `master` as source of truth.
- **Do file changes via copy-paste** where possible (drag-drop into VS Code once mixed up `capacitor.config.ts` with an HTML file, breaking the build — first line of `capacitor.config.ts` must be `import type { CapacitorConfig }`).
- **Emulator caveat:** the API 37 / 2 GB emulator caused OOM black screens; use **Pixel + API 34 + 4 GB RAM**, or rely on the Play **pre-launch report** (runs on real devices).
- **CapacitorInit lesson:** do NOT `import '@capacitor/*'` into the web bundle for a remote-loaded app — it clashes with the native-injected runtime (`window.Capacitor.triggerEvent is not a function`). Use the injected `window.Capacitor` global instead. (Splash was ultimately removed — `launchShowDuration: 0`.)

## How to continue in a new session
1. Make sure the new session is working on the up-to-date `master` (the deployed code).
2. Point it at **this file (`HANDOFF.md`)** and `CAPACITOR.md` first.
3. State the specific task (e.g., "wire Moyasar payment" or "iOS setup"). It will read the files for current state.
