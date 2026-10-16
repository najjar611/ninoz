/**
 * Capture App Store / Play Store screenshots from the live Ninoz site.
 *
 * The native app is a thin shell that loads https://ninoz.app, so screenshots
 * of the live site ARE screenshots of the app. Nothing is captured from a local
 * dev server on purpose: without Supabase credentials the pages render empty,
 * and store screenshots that misrepresent the app are a rejection risk.
 *
 * Usage (from the project root):
 *
 *   npm install --save-dev playwright
 *   npx playwright install chromium
 *   node scripts/appstore-screenshots.mjs
 *
 * Options:
 *   --url=https://ninoz.app     site to capture (default: https://ninoz.app)
 *   --out=appstore-screenshots  output directory
 *   --devices=iphone,ipad       which sizes to produce (default: both)
 *
 * Output sizes match what App Store Connect accepts:
 *   iPhone (Dynamic Island, medium display)  1206 x 2622
 *   iPad 13"                                  2048 x 2732  (not needed: iPhone-only)
 */

import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=')
    return [k, v ?? true]
  })
)

const SITE = args.url || 'https://ninoz.app'
const OUT = args.out || 'appstore-screenshots'

const DEVICES = {
  // App Store Connect's "iPhone with Dynamic Island (medium display)" slot is
  // the only iPhone size required now. It accepts 1179x2556 or 1206x2622 — the
  // older 6.9" 1290x2796 is rejected there with "File dimensions are invalid".
  iphone: {
    label: 'iphone-dynamic-island',
    viewport: { width: 402, height: 874 },
    deviceScaleFactor: 3, // -> 1206 x 2622
    isMobile: true,
  },
  // Kept for the alternative accepted size, in case the slot wants it.
  iphone61: {
    label: 'iphone-6.1',
    viewport: { width: 393, height: 852 },
    deviceScaleFactor: 3, // -> 1179 x 2556
    isMobile: true,
  },
  ipad: {
    label: 'ipad-13',
    viewport: { width: 1024, height: 1366 },
    deviceScaleFactor: 2, // -> 2048 x 2732
    isMobile: false,
  },
}

// Each entry becomes one screenshot. `scroll` is a fraction of full page height,
// so the same shot lands sensibly on both device sizes.
const SHOTS = [
  { name: '1-home-top', path: '/', scroll: 0 },
  { name: '2-home-second', path: '/', scroll: 0.18 },
  { name: '3-home-third', path: '/', scroll: 0.38 },
  { name: '4-home-fourth', path: '/', scroll: 0.58 },
  { name: '5-home-fifth', path: '/', scroll: 0.78 },
]

const selected = String(args.devices || 'iphone,ipad')
  .split(',')
  .map((d) => d.trim())
  .filter((d) => DEVICES[d])

if (selected.length === 0) {
  console.error('No valid devices selected. Use --devices=iphone,ipad')
  process.exit(1)
}

const browser = await chromium.launch()

for (const key of selected) {
  const device = DEVICES[key]
  const dir = path.join(OUT, device.label)
  await mkdir(dir, { recursive: true })

  const context = await browser.newContext({
    viewport: device.viewport,
    deviceScaleFactor: device.deviceScaleFactor,
    isMobile: device.isMobile,
    hasTouch: device.isMobile,
    locale: 'ar-SA',
  })
  const page = await context.newPage()

  // ninoz.app shows a full-screen welcome gate to logged-out visitors, so
  // without getting past it every capture is the same sign-in screen. Guest
  // entry reaches the real app without credentials in a screenshot run.
  async function passWelcomeGate() {
    const labels = ['المتابعة كضيف', 'المتابعة كضيفة', 'Continue as guest']
    for (const label of labels) {
      const button = page.locator(`text=${label}`).first()
      if ((await button.count()) === 0) continue
      try {
        await button.click({ timeout: 5000 })
        await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {})
        await page.waitForTimeout(2000)
        console.log(`  passed welcome gate via "${label}"`)
        return true
      } catch {
        // fall through and try the next label
      }
    }
    return false
  }

  let currentPath = null
  for (const shot of SHOTS) {
    // Navigate only when the path changes. Re-visiting the same URL triggers
    // the browser's scroll restoration, which fires asynchronously and resets
    // scrollTo back to the top — producing a set of identical screenshots.
    if (shot.path !== currentPath) {
      const url = SITE + shot.path
      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 })
      } catch {
        // networkidle can time out on pages that poll; a load event is enough.
        await page.goto(url, { waitUntil: 'load', timeout: 60000 })
      }
      await page.evaluate(() => {
        if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
      })
      if (currentPath === null) await passWelcomeGate()
      currentPath = shot.path

      const info = await page.evaluate(() => ({
        title: document.title,
        height: document.body.scrollHeight,
        viewport: window.innerHeight,
      }))
      console.log(
        `  ${shot.path} — "${info.title}", page height ${info.height}px, viewport ${info.viewport}px`
      )
      if (info.height <= info.viewport * 1.2) {
        console.warn('  ! This page barely scrolls — every shot of it will look the same.')
        console.warn('    You are probably still on a full-screen gate rather than the app.')
      }
    }

    const scrolledTo = await page.evaluate((fraction) => {
      window.scrollTo(0, document.body.scrollHeight * fraction)
      return window.scrollY
    }, shot.scroll)
    // let lazy images and scroll-triggered animations settle
    await page.waitForTimeout(1500)

    const settled = await page.evaluate(() => window.scrollY)
    if (shot.scroll > 0 && settled === 0) {
      console.warn(`  ! ${shot.name}: page did not scroll (asked ${scrolledTo}px).`)
      console.warn('    This shot will duplicate the top of the page — drop it.')
    }

    const file = path.join(dir, `${shot.name}.png`)
    await page.screenshot({ path: file }) // viewport-sized, not fullPage
    const { width, height } = device.viewport
    const scale = device.deviceScaleFactor
    console.log(`${file}  (${width * scale} x ${height * scale})  scrollY=${settled}`)
  }

  await context.close()
}

await browser.close()
console.log(`\nDone. Screenshots are in ./${OUT}/`)
console.log('Review them before uploading — drop any that show a loading state,')
console.log('an empty section, or a half-finished animation.')
