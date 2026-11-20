import { gsap } from 'gsap'
import { CONFIG } from './config.js'
import { whatsappUrl, instagramUrl } from './contacts.js'

const NS = 'http://www.w3.org/2000/svg'
const shapes = {
  'heart-moon':
    'M32 47C26 41 12 32 14 23C16 15 25 16 29 23C35 14 46 16 48 24C50 32 39 42 32 47ZM38 5A12 12 0 0 0 52 19A13 13 0 0 1 38 5Z',
  key: 'M31 33L15 49M18 46L22 50M22 42L26 46M46 17a9 9 0 1 0 -13 13a9 9 0 0 0 13 -13ZM42 19a3 3 0 1 0 .1 .1',
  'eye-star':
    'M5 32Q32 5 59 32Q32 59 5 32ZM40 32a8 8 0 1 1 -16 0a8 8 0 1 1 16 0ZM32 10V3M18 16l-4-6M46 16l4-6',
  'arrow-star':
    'M12 49L48 13M34 14l15-2-2 15M10 40l9-3M19 49l4-10M41 38l2 6 6 2-6 2-2 6-2-6-6-2 6-2Z',
}
function emblem(id) {
  const svg = document.createElementNS(NS, 'svg')
  svg.setAttribute('viewBox', '0 0 64 64')
  svg.setAttribute('aria-hidden', 'true')
  svg.classList.add('emblem')
  const path = document.createElementNS(NS, 'path')
  path.setAttribute('d', shapes[id] || shapes['eye-star'])
  path.setAttribute('fill', 'none')
  path.setAttribute('stroke', 'currentColor')
  path.setAttribute('stroke-width', '1.35')
  svg.append(path)
  return svg
}
function element(tag, cls, text) {
  const node = document.createElement(tag)
  node.className = cls
  node.textContent = text
  return node
}
function link(href, label, cls) {
  const a = element('a', cls, label)
  a.href = href
  a.target = '_blank'
  a.rel = 'noopener noreferrer'
  return a
}
export function contacts(container, service) {
  const whats = whatsappUrl(CONFIG, service),
    insta = instagramUrl(CONFIG)
  if (whats)
    container.append(link(whats, service ? 'Bu açılım için yaz →' : 'WhatsApp’tan yaz', 'button'))
  if (insta && (!whats || !service))
    container.append(
      link(
        insta,
        service ? 'Instagram’dan yaz ↗' : 'Instagram · @' + CONFIG.instagram.replace(/^@/, ''),
        whats ? 'text-link' : 'button',
      ),
    )
  if (!whats)
    container.append(
      element(
        'small',
        'unavailable',
        insta ? 'WhatsApp hattı henüz eklenmedi.' : 'İletişim bilgileri henüz eklenmedi.',
      ),
    )
}
export function mountCards({ reduced, shimmer }) {
  const stage = document.querySelector('.selection-stage'),
    fan = stage.querySelector('.fan'),
    face = stage.querySelector('.reveal')
  const controls = document.querySelector('.fan-controls'),
    status = controls.querySelector('.fan-position')
  const prev = controls.querySelector('.prev'),
    next = controls.querySelector('.next')
  const abort = new AbortController(),
    opts = { signal: abort.signal }
  let current = 0,
    drag = null,
    suppressClick = false,
    active = -1,
    timeline = null
  let state = 'FAN_READY'
  const n = CONFIG.services.length
  const cards = CONFIG.services.map((service, i) => {
    const b = element('button', 'fan-card', '')
    b.dataset.service = service.id
    b.type = 'button'
    b.setAttribute('aria-label', service.numeral + ' · Kartı aç')
    const img = new Image()
    img.src = '/art/back.svg'
    img.width = 210
    img.height = 340
    img.alt = ''
    img.draggable = false
    b.append(img, element('span', 'ordinal', service.numeral))
    fan.append(b)
    b.addEventListener(
      'click',
      () => {
        if (!suppressClick) select(i)
      },
      opts,
    )
    return b
  })
  const wrap = (i) => ((i % n) + n) % n
  const setState = (s) => {
    state = s
    stage.dataset.state = s
  }
  function layout(pull = 0) {
    const gap = Math.min(stage.clientWidth / (Math.min(n, 5) + 0.6), 138)
    const center = (Math.min(n, 5) - 1) / 2
    for (let i = 0; i < n; i++) {
      const slot = wrap(i - current + Math.floor(center)),
        offset = slot - center + pull
      const b = cards[i]
      const show = slot < 5
      b.style.setProperty('--x', offset * gap + 'px')
      b.style.setProperty('--y', Math.abs(offset) ** 1.6 * 9 + 'px')
      b.style.setProperty('--angle', offset * 8 + 'deg')
      b.style.setProperty('--z', i === current ? 14 : Math.round(10 - Math.abs(offset)))
      b.classList.toggle('is-current', i === current)
      b.hidden = !show
      b.tabIndex = show ? 0 : -1
    }
    status.textContent = n
      ? `${CONFIG.services[current].numeral}  /  ${CONFIG.services[n - 1].numeral}`
      : ''
  }
  function rotate(steps, focus = false) {
    if (state !== 'FAN_READY' || !n) return
    current = wrap(current + steps)
    layout()
    if (focus) cards[current].focus({ preventScroll: true })
  }
  function select(i) {
    if (state !== 'FAN_READY') return
    active = i
    setState('SELECTING')
    const service = CONFIG.services[i],
      button = cards[i]
    face.replaceChildren(
      element('small', '', service.numeral),
      emblem(service.emblem),
      element('h3', '', service.title),
      element('p', '', service.text),
      element('span', 'service-meta', service.meta),
    )
    face.setAttribute('aria-label', service.title)
    contacts(face, service)
    const again = element('button', 'another', 'Başka kart çek')
    again.type = 'button'
    again.addEventListener('click', restore)
    face.append(again)
    face.hidden = false
    face.style.visibility = 'hidden'
    stage.style.setProperty('--face-space', face.offsetHeight + 48 + 'px')
    face.hidden = true
    face.style.visibility = ''
    fan.inert = true
    controls.inert = true
    shimmer()
    if (!reduced() && navigator.vibrate) navigator.vibrate(15)
    const duration = reduced() ? 0 : 0.48
    const available = cards.filter((b) => b !== button && !b.hidden)
    const rect = button.getBoundingClientRect(),
      bounds = stage.getBoundingClientRect()
    // Freeze the composed fan pose before taking ownership of its transform.
    const computed = getComputedStyle(button).transform
    button.style.transition = 'none'
    button.style.transform = computed
    const dx = bounds.left + bounds.width / 2 - (rect.left + rect.width / 2),
      dy = bounds.top + bounds.height / 2 - (rect.top + rect.height / 2)
    gsap.set(button, { zIndex: 20 })
    timeline = gsap.timeline({
      onComplete: () => {
        setState('REVEALED')
        face.focus({ preventScroll: true })
      },
    })
    if (available.length) timeline.to(available, { opacity: 0.08, duration: duration * 0.7 }, 0)
    timeline
      .to(
        button,
        {
          x: '+=' + dx,
          y: '+=' + dy,
          rotation: 0,
          rotationY: 90,
          scale: 1.08,
          duration,
          ease: 'power3.inOut',
        },
        0,
      )
      .call(() => {
        button.style.opacity = '0'
        face.hidden = false
      })
      .fromTo(
        face,
        { rotationY: -90, opacity: 1 },
        { rotationY: 0, duration, ease: 'power3.out', immediateRender: false },
      )
  }
  function restore() {
    if (state !== 'REVEALED') return
    setState('RETURNING')
    const duration = reduced() ? 0 : 0.36
    timeline = gsap.timeline({
      onComplete: () => {
        fan.inert = false
        controls.inert = false
        setState('FAN_READY')
        cards[current].focus({ preventScroll: true })
      },
    })
    timeline
      .to(face, { rotationY: 90, opacity: 0, duration, ease: 'power3.in' })
      .call(() => {
        face.hidden = true
        current = active
        stage.style.removeProperty('--face-space')
        gsap.set(cards, { clearProps: 'transform,opacity,zIndex,transition,filter' })
        layout()
      })
      .fromTo(fan, { opacity: 0.4 }, { opacity: 1, duration, immediateRender: false })
  }
  prev.addEventListener('click', () => rotate(-1), opts)
  next.addEventListener('click', () => rotate(1), opts)
  stage.addEventListener(
    'keydown',
    (e) => {
      if (state === 'REVEALED' && e.key === 'Escape') {
        e.preventDefault()
        restore()
        return
      }
      if (state !== 'FAN_READY') return
      const dir = { ArrowLeft: -1, ArrowRight: 1, Home: -current, End: n - 1 - current }[e.key]
      if (dir !== undefined) {
        e.preventDefault()
        rotate(dir, true)
      }
    },
    opts,
  )
  fan.addEventListener(
    'pointerdown',
    (e) => {
      if (state !== 'FAN_READY' || !e.isPrimary || e.button !== 0) return
      suppressClick = false
      drag = {
        id: e.pointerId,
        x: e.clientX,
        y: e.clientY,
        lastX: e.clientX,
        t: e.timeStamp,
        v: 0,
        swipe: false,
      }
    },
    opts,
  )
  fan.addEventListener(
    'pointermove',
    (e) => {
      if (!drag || e.pointerId !== drag.id) return
      const dx = e.clientX - drag.x,
        dy = e.clientY - drag.y
      if (!drag.swipe) {
        if (Math.abs(dy) > 9 && Math.abs(dy) > Math.abs(dx)) {
          drag = null
          return
        }
        if (Math.abs(dx) < 8) return
        drag.swipe = true
        fan.setPointerCapture(e.pointerId)
      }
      drag.v = drag.v * 0.6 + (0.4 * (e.clientX - drag.lastX)) / Math.max(1, e.timeStamp - drag.t)
      drag.lastX = e.clientX
      drag.t = e.timeStamp
      layout(Math.max(-1.2, Math.min(1.2, dx / 115)))
    },
    opts,
  )
  function release(e) {
    if (!drag || e.pointerId !== drag.id) return
    if (drag.swipe) {
      suppressClick = true
      if (fan.hasPointerCapture(e.pointerId)) fan.releasePointerCapture(e.pointerId)
      const distance = e.clientX - drag.x
      const inertia = e.timeStamp - drag.t < 100 ? drag.v * 65 : 0
      if (e.type === 'pointerup')
        rotate(
          -Math.sign(distance) *
            Math.max(1, Math.min(2, Math.round(Math.abs(distance + inertia) / 115))),
        )
      else layout()
      setTimeout(() => {
        suppressClick = false
      }, 0)
    }
    drag = null
  }
  window.addEventListener('pointerup', release, opts)
  window.addEventListener('pointercancel', release, opts)
  const observer = new ResizeObserver(() => {
    if (state === 'FAN_READY') layout()
  })
  observer.observe(stage)
  controls.hidden = n < 2
  if (!n) fan.append(element('p', '', 'Açılımlar hazırlanıyor.'))
  layout()
  return () => {
    abort.abort()
    observer.disconnect()
    timeline?.kill()
  }
}
