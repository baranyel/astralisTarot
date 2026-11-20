import { test, expect } from '@playwright/test'
import { CONFIG } from '../src/config.js'

async function ready(page, path = '/#kartlar') {
  await page.goto(path)
  await page.locator('.fan-card').first().waitFor({ state: 'attached' })
}
test('perde klavyeyle açılır, oturum hatırlanır ve ses bir kullanıcı hareketiyle açılır', async ({
  page,
}) => {
  await page.goto('/')
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.keyboard.press('Tab')
  await expect(page.locator('#enter')).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.locator('#veil')).toBeHidden()
  await page.locator('#sound').click()
  await expect(page.locator('#sound')).toHaveAttribute('aria-pressed', 'true')
  await page.locator('#sound').click()
  await expect(page.locator('#sound')).toHaveAttribute('aria-pressed', 'false')
  await page.reload()
  await expect(page.locator('#veil')).toBeHidden()
  await expect(page.getByRole('heading', { name: 'Astralis', exact: true })).toBeVisible()
})
test('dört kart, seri dokunuş, dönüş, klavye ve yapılandırılmamış iletişim', async ({ page }) => {
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  await ready(page)
  for (const [i, service] of CONFIG.services.entries()) {
    const card = page.locator('.fan-card').nth(i)
    await card.focus()
    await page.keyboard.press('Enter')
    await card.evaluate((node) => {
      node.click()
      node.click()
    })
    await expect(page.locator('.selection-stage')).toHaveAttribute('data-state', 'REVEALED')
    await expect(page.locator('.reveal h3')).toHaveText(service.title)
    await expect(page.locator('.reveal p')).toHaveText(service.text)
    await expect(page.locator('.reveal .service-meta')).toHaveText(service.meta)
    await expect(page.locator('.reveal a')).toHaveAttribute(
      'href',
      'https://www.instagram.com/astralis/',
    )
    await page.keyboard.press('Escape')
    await expect(page.locator('.selection-stage')).toHaveAttribute('data-state', 'FAN_READY')
    await expect(card).toBeFocused()
  }
  await expect(page.locator('a[href*="wa.me"]')).toHaveCount(0)
  await page.keyboard.press('Home')
  await page.keyboard.press('ArrowRight')
  await expect(page.locator('.fan-card').nth(1)).toBeFocused()
  expect(errors).toEqual([])
})
test('hareket azaltma ve WebGL kaybında hizmetlere erişim sürer', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      return type.includes('webgl') ? null : original.call(this, type, ...args)
    }
    Object.defineProperty(window, 'sessionStorage', {
      get() {
        throw new DOMException('Storage blocked', 'SecurityError')
      },
    })
  })
  await page.goto('/')
  await page.locator('#enter').click()
  await expect(page.locator('#veil')).toBeHidden()
  await expect(page.locator('.reduced-deck h2')).toBeVisible()
  await page.locator('.sky-copy .button').click()
  await page.locator('.fan-card').first().click()
  await expect(page.locator('.reveal')).toBeVisible()
  await page.locator('.another').click()
  await page.locator('#nav a[href="#iletisim"]').click()
  await expect(page.locator('.foil')).toHaveAttribute('data-engine', 'svg')
  await expect(page.locator('.final-actions a')).toHaveAttribute('target', '_blank')
})
test('kaydırma geri sarılır ve son kart yön girişine tepki verir', async ({ page }) => {
  await ready(page, '/#gokyuzu')
  await page.evaluate(() => window.scrollTo(0, document.querySelector('.sky-window').offsetHeight))
  await expect(page.locator('.sheet-num')).toHaveText('N° II')
  const end = await page
    .locator('.orbit-card')
    .first()
    .evaluate((el) => getComputedStyle(el).transform)
  await page.evaluate(() => window.scrollTo(0, 0))
  await expect(page.locator('.sheet-num')).toHaveText('N° I')
  await page.evaluate(() => window.scrollTo(0, document.querySelector('.sky-window').offsetHeight))
  await expect(page.locator('.sheet-num')).toHaveText('N° II')
  expect(
    await page
      .locator('.orbit-card')
      .first()
      .evaluate((el) => getComputedStyle(el).transform),
  ).toBe(end)
  await page.locator('.foil').scrollIntoViewIfNeeded()
  await expect(page.locator('.foil')).toHaveAttribute('data-engine', 'webgl')
  await page.mouse.move(20, 20)
  await page.waitForTimeout(250)
  const before = await page.locator('.foil').getAttribute('style')
  await page.mouse.move(1370, 700)
  await expect.poll(() => page.locator('.foil').getAttribute('style')).not.toBe(before)
})
for (const [width, height] of [
  [390, 844],
  [320, 700],
]) {
  test(`${width}×${height} dokunma, yatay sürükleme, menü ve görünürlük`, async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext({
      viewport: { width, height },
      isMobile: true,
      hasTouch: true,
    })
    const page = await context.newPage()
    await page.addInitScript(() => {
      window.DeviceOrientationEvent = { requestPermission: async () => 'denied' }
    })
    await page.goto(baseURL)
    await page.locator('#enter').tap()
    await page.locator('#menu').tap()
    await expect(page.locator('#menu')).toHaveAttribute('aria-expanded', 'true')
    await page.locator('#nav a[href="#kartlar"]').tap()
    await expect(page.locator('#menu')).toHaveAttribute('aria-expanded', 'false')
    await page.waitForTimeout(800)
    const fan = await page.locator('.fan').boundingBox()
    const client = await context.newCDPSession(page)
    const x = width * 0.69,
      y = fan.y + fan.height * 0.5
    await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
    for (let i = 1; i <= 8; i++)
      await client.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: x - i * 12, y }],
      })
    await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    await expect(page.locator('.fan-position')).not.toHaveText('I  /  IV')
    await expect(page.locator('.selection-stage')).toHaveAttribute('data-state', 'FAN_READY')
    await page.locator('.fan-card.is-current').tap()
    await expect(page.locator('.selection-stage')).toHaveAttribute('data-state', 'REVEALED')
    const face = await page.locator('.reveal').boundingBox()
    const heading = await page.locator('.selection-heading').boundingBox()
    expect(face.y).toBeGreaterThan(heading.y + heading.height)
    expect(face.x).toBeGreaterThanOrEqual(0)
    expect(face.x + face.width).toBeLessThanOrEqual(width)
    await page.locator('.another').tap()
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width)
    await context.close()
  })
}

test('geçerli yapılandırmada dört açılım ve genel iletişim gerçek bağlantı üretir', async ({
  page,
}) => {
  // The response override is scoped to this isolated test context. No outbound link is opened.
  await page.route('**/*.js*', async (route) => {
    const request = route.request()
    const path = new URL(request.url()).pathname
    if (path !== '/src/config.js' && !/^\/assets\/index-[^/]+\.js$/.test(path)) {
      await route.continue()
      return
    }
    const response = await route.fetch()
    const body = (await response.text()).replace('90XXXXXXXXXX', '905550000001')
    await route.fulfill({ response, body })
  })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await ready(page)
  const generic = new URL(
    await page.locator('.final-actions a[href*="wa.me"]').getAttribute('href'),
  )
  expect(generic.pathname).toBe('/905550000001')
  expect(generic.searchParams.get('text')).toBe(CONFIG.messages.generic)
  for (const service of CONFIG.services) {
    await page.locator(`[data-service="${service.id}"]`).click()
    await expect(page.locator('.selection-stage')).toHaveAttribute('data-state', 'REVEALED')
    const action = page.getByRole('link', { name: 'Bu açılım için yaz →' })
    const url = new URL(await action.getAttribute('href'))
    expect(url.searchParams.get('text')).toBe(
      CONFIG.messages.service.replace('{hizmet}', service.title),
    )
    await expect(action).toHaveAttribute('rel', 'noopener noreferrer')
    await page.locator('.another').click()
    await expect(page.locator('.selection-stage')).toHaveAttribute('data-state', 'FAN_READY')
  }
})

test('çalışan WebGL bağlamı kaybolunca kart ve iletişim çalışır', async ({ page }) => {
  await ready(page, '/#gokyuzu')
  await page.waitForFunction(() => document.querySelector('#stars canvas')?.getContext('webgl2'))
  await page.locator('#stars canvas').evaluate((canvas) => {
    canvas.getContext('webgl2').getExtension('WEBGL_lose_context').loseContext()
  })
  await expect(page.locator('#stars')).toHaveAttribute('data-engine', 'svg')
  await expect(page.locator('#stars canvas')).toBeHidden()
  await page.locator('.sky-copy .button').click()
  await page.locator('[data-service="genel"]').click()
  await expect(page.locator('.selection-stage')).toHaveAttribute('data-state', 'REVEALED')
  await expect(page.locator('.reveal h3')).toHaveText('Genel Açılım')
  await expect(page.locator('.reveal a')).toHaveAttribute(
    'href',
    'https://www.instagram.com/astralis/',
  )
})
