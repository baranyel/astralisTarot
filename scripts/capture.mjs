import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'

const base = process.env.ASTRALIS_BASE_URL || 'http://127.0.0.1:4173'
const out = process.env.ASTRALIS_CAPTURE_DIR || 'qa/screenshots'
await mkdir(out, { recursive: true })
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || undefined,
  headless: true,
  args: ['--enable-unsafe-swiftshader'],
})
try {
  for (const [width, height] of [
    [1440, 900],
    [390, 844],
    [320, 700],
  ]) {
    const page = await browser.newPage({
      viewport: { width, height },
      isMobile: width < 500,
      hasTouch: width < 500,
      deviceScaleFactor: 1,
    })
    page.on('pageerror', (err) => console.error('PAGE ERROR', String(err)))
    page.on('console', (msg) => {
      if (msg.type() === 'error' || msg.type() === 'warning') console.log(msg.type(), msg.text())
    })
    const shot = async (name) => page.screenshot({ path: `${out}/${width}-${name}.png` })
    await page.goto(base)
    await page.locator('#enter').waitFor()
    await page.evaluate(() => document.fonts.ready)
    await shot('0-veil')
    await page.locator('#enter').click()
    await page.waitForTimeout(2300)
    await shot('1-sky')
    const widthCheck = await page.evaluate(() => [
      document.documentElement.clientWidth,
      document.documentElement.scrollWidth,
    ])
    console.log(width, 'layout', widthCheck, 'WebGL', await page.locator('#stars canvas').count())
    for (const [id, name] of [
      ['deste', '2-deck'],
      ['kartlar', '3-cards'],
      ['hakkinda', '4-about'],
      ['surec', '5-process'],
      ['iletisim', '6-finale'],
    ]) {
      await page.evaluate((id) => {
        const target = document.getElementById(id)
        window.scrollTo({
          top:
            scrollY +
            target.getBoundingClientRect().top -
            document.querySelector('.masthead').offsetHeight,
          behavior: 'instant',
        })
      }, id)
      await page.waitForTimeout(550)
      await shot(name)
      if (id === 'kartlar') {
        await page.locator('.fan-card').first().click()
        await page.locator('[data-state="REVEALED"]').waitFor()
        await shot('3-reveal')
        await page.getByRole('button', { name: 'Başka kart çek' }).click()
        await page.locator('[data-state="FAN_READY"]').waitFor()
      }
    }
    await page.close()
  }
} finally {
  await browser.close()
}
