import './styles.css'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { CONFIG } from './config.js'
import { mountAtlas, mountSectionMotion } from './deck.js'
import { contacts, mountCards } from './cards.js'
import { mountSensory } from './sensory.js'

const $ = (selector) => document.querySelector(selector)
const motion = matchMedia('(prefers-reduced-motion: reduce)')
const desktop = matchMedia('(hover: hover) and (pointer: fine)')
const reduced = () => motion.matches
const abort = new AbortController(),
  opts = { signal: abort.signal }
const cleanups = []
let scene = null,
  disposed = false,
  lenis = null,
  lenisTick = null,
  removeDeck,
  removeSections

document.querySelectorAll('[data-brand]').forEach((node) => {
  node.textContent = CONFIG.brand
})
$('.masthead .brand').setAttribute('aria-label', CONFIG.brand + ' · Başlangıç')
$('.motto span').textContent = CONFIG.motto[0]
$('.motto em').textContent = CONFIG.motto[1]
$('#about-title').textContent = CONFIG.about.title
$('.about-text').textContent = CONFIG.about.text
$('.draft').hidden = !CONFIG.about.draft
for (const letter of CONFIG.brand) {
  const span = document.createElement('span')
  span.textContent = letter
  span.setAttribute('aria-hidden', 'true')
  $('#word').append(span)
}
$('.wordmark').setAttribute('aria-label', CONFIG.brand)
contacts($('.final-actions'))
const letters = $('#word').children
const phases = $('.moon-phases')
for (let i = 0; i < 8; i++) {
  const terminator = Math.cos((i * Math.PI) / 4) * 8
  const outer = i <= 4 ? 1 : 0
  const inner = i <= 4 ? Number(terminator >= 0) : Number(terminator < 0)
  const moon =
    i === 0
      ? ''
      : i === 4
        ? '<circle cx="11" cy="11" r="8" fill="#d0b881"/>'
        : `<path d="M11 3A8 8 0 0 ${outer} 11 19A${Math.max(0.001, Math.abs(terminator))} 8 0 0 ${1 - inner} 11 3Z" fill="#d0b881"/>`
  phases.insertAdjacentHTML(
    'beforeend',
    `<svg aria-hidden="true" viewBox="0 0 22 22"><circle cx="11" cy="11" r="8.5" fill="none" stroke="#aa9264" stroke-width=".8"/>${moon}</svg>`,
  )
}

const sensory = mountSensory({ reduced, onInput: () => scene?.request() })
cleanups.push(sensory.dispose, mountCards({ reduced, shimmer: sensory.shimmer }))
function setupMotion() {
  removeDeck?.()
  removeSections?.()
  if (lenisTick) gsap.ticker.remove(lenisTick)
  lenis?.destroy()
  lenis = null
  removeDeck = mountAtlas(reduced())
  removeSections = mountSectionMotion(reduced())
  if (!reduced() && desktop.matches && navigator.maxTouchPoints === 0) {
    lenis = new Lenis({ smoothWheel: true, syncTouch: false, autoRaf: false, lerp: 0.13 })
    lenis.on('scroll', ScrollTrigger.update)
    lenisTick = (time) => lenis?.raf(time * 1000)
    gsap.ticker.add(lenisTick)
  }
  ScrollTrigger.refresh()
  scene?.request()
}
setupMotion()
motion.addEventListener('change', setupMotion, opts)
desktop.addEventListener('change', setupMotion, opts)
document.fonts.ready.then(() => {
  if (!disposed) ScrollTrigger.refresh()
})
const menu = $('#menu'),
  nav = $('#nav')
function menuState(open) {
  menu.setAttribute('aria-expanded', String(open))
  menu.setAttribute('aria-label', open ? 'Menüyü kapat' : 'Menüyü aç')
  nav.classList.toggle('open', open)
}
menu.addEventListener('click', () => menuState(menu.getAttribute('aria-expanded') !== 'true'), opts)
document.addEventListener(
  'keydown',
  (e) => {
    if (e.key === 'Escape' && nav.classList.contains('open')) {
      menuState(false)
      menu.focus()
    }
  },
  opts,
)
document.addEventListener(
  'pointerdown',
  (e) => {
    if (nav.classList.contains('open') && !e.target.closest('.masthead')) menuState(false)
  },
  opts,
)
document.addEventListener(
  'focusin',
  (e) => {
    if (nav.classList.contains('open') && !e.target.closest('.masthead')) menuState(false)
  },
  opts,
)
function goTo(id, focus = false) {
  const node = document.getElementById(id)
  if (!node) return
  const y = scrollY + node.getBoundingClientRect().top - $('.masthead').offsetHeight
  if (lenis) lenis.scrollTo(y, { duration: 0.92 })
  else window.scrollTo({ top: y, behavior: reduced() ? 'instant' : 'smooth' })
  if (focus) {
    const dest = node.querySelector('h1,h2') || node
    if (!dest.hasAttribute('tabindex')) dest.tabIndex = -1
    dest.focus({ preventScroll: true })
  }
}
document.addEventListener(
  'click',
  (e) => {
    const a = e.target.closest('a[href^="#"]')
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    const id = a.hash.slice(1)
    if (!document.getElementById(id)) return
    e.preventDefault()
    menuState(false)
    goTo(id, true)
    if (location.hash !== a.hash) history.pushState(null, '', a.hash)
  },
  opts,
)
window.addEventListener('popstate', () => goTo(location.hash.slice(1) || 'gokyuzu'), opts)

const links = [...nav.querySelectorAll('a')]
function activate(id) {
  for (const a of links) {
    if (a.hash === '#' + id) a.setAttribute('aria-current', 'location')
    else a.removeAttribute('aria-current')
  }
}
const navMarkers = [
  ['gokyuzu', 'gokyuzu'],
  ['kartlar', 'kartlar'],
  ['hakkinda', 'hakkinda'],
  ['surec', 'hakkinda'],
  ['iletisim', 'iletisim'],
]
for (const [node, id] of navMarkers) {
  const trigger = ScrollTrigger.create({
    trigger: '#' + node,
    start: 'top 48%',
    end: 'bottom 48%',
    onToggle: (self) => {
      if (self.isActive) activate(id)
    },
  })
  cleanups.push(() => trigger.kill())
}

// A fragment is an intentional deep link. A returning visitor can go straight to the plate.
let seen = false
try {
  seen = sessionStorage.getItem('astralis:sky') === 'open'
} catch (error) {
  console.info('Oturum bilgisi saklanamıyor.', error.name)
}
const veil = $('#veil'),
  experience = $('#experience'),
  enter = $('#enter')
enter.querySelector('span').textContent =
  (matchMedia('(pointer:coarse)').matches ? 'DOKUN' : 'TIKLA') + ' · GÖKYÜZÜ AÇILSIN'
let opening = false,
  loadStarted = false
function loadScene() {
  if (loadStarted) return
  loadStarted = true
  import('./scene.js')
    .then(({ mountScene }) => {
      if (!disposed) scene = mountScene({ reduced, input: sensory.input })
    })
    .catch((error) => console.info('Statik gök atlası etkin.', error.message))
}
function finishOpening() {
  veil.hidden = true
  experience.inert = false
  document.body.classList.remove('veiled')
  if (lenis) lenis.start()
  const title = $('.wordmark')
  title.tabIndex = -1
  title.focus({ preventScroll: true })
  if (!reduced())
    gsap.fromTo(
      letters,
      { opacity: 0, y: 6 },
      { opacity: 1, y: 0, duration: 0.65, stagger: 0.055, ease: 'power3.out', clearProps: 'all' },
    )
  ScrollTrigger.refresh()
  loadScene()
}
function openSky() {
  if (opening) return
  opening = true
  void sensory.orient()
  try {
    sessionStorage.setItem('astralis:sky', 'open')
  } catch (error) {
    console.info('Oturum tercihi kaydedilemedi.', error.name)
  }
  sensory.burst(innerWidth / 2, innerHeight / 2 - 18, 28)
  if (reduced()) finishOpening()
  else {
    const timeline = gsap.timeline({ onComplete: finishOpening })
    timeline
      .to('#enter i', { scale: 4, opacity: 0, duration: 0.47, ease: 'power3.out' }, 0)
      .to('#enter span', { opacity: 0, duration: 0.24 }, 0)
      .to(veil, { opacity: 0, duration: 0.75, ease: 'power3.inOut' }, 0.13)
  }
}
if (!seen && !location.hash) {
  veil.hidden = false
  experience.inert = true
  document.body.classList.add('veiled')
  lenis?.stop()
  enter.addEventListener('click', openSky, opts)
} else {
  loadScene()
  if (location.hash)
    requestAnimationFrame(() => {
      const node = document.getElementById(location.hash.slice(1))
      if (node) node.scrollIntoView({ behavior: 'instant' })
    })
}
function cleanup() {
  disposed = true
  abort.abort()
  scene?.dispose()
  removeDeck?.()
  removeSections?.()
  cleanups.forEach((fn) => fn())
  if (lenisTick) gsap.ticker.remove(lenisTick)
  lenis?.destroy()
  gsap.killTweensOf(letters)
}
window.addEventListener(
  'pagehide',
  (e) => {
    if (!e.persisted) cleanup()
  },
  { once: false, signal: abort.signal },
)
if (import.meta.hot) import.meta.hot.dispose(cleanup)
