import { chromium } from 'playwright'

// Run against a local development server. The social plate reuses the live typography and engraving.
const base = process.env.ASTRALIS_BASE_URL || 'http://127.0.0.1:4173'
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined })
try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
  })
  await page.goto(base + '/#gokyuzu')
  await page.addStyleTag({
    content: `
    .masthead,.hero-foot,.sky-copy .button,#stars,.plate-note,.meteor{display:none!important}
    .journey,.sky-window{height:630px!important}
    .sky-copy{left:6%;top:48%}.wordmark{font-size:132px}.illustration{width:58%;right:-.5%;top:50%}
    .kicker{font-size:13px}.motto{font-size:31px}
  `,
  })
  await page.evaluate(async () => {
    await document.fonts.ready
    await Promise.all([...document.querySelectorAll('.orbit-card img')].map((img) => img.decode()))
  })
  await page.waitForTimeout(150)
  await page.locator('.sky-window').screenshot({ path: 'public/og.png' })
} finally {
  await browser.close()
}
