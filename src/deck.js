import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
gsap.registerPlugin(ScrollTrigger)
ScrollTrigger.config({ ignoreMobileResize: true })

const clamp = (x, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, x))
function ease(a, b, progress) {
  const t = clamp((progress - a) / (b - a))
  return t * t * (3 - 2 * t)
}

// All scroll poses are absolute. Reversing the page retraces exactly the same shuffle.
export function mountAtlas(reduce) {
  const wrapper = document.querySelector('.journey')
  const stage = wrapper.querySelector('.illustration')
  const group = wrapper.querySelector('.orbital-deck')
  const sky = wrapper.querySelector('.sky-copy')
  const deck = wrapper.querySelector('.deck-copy')
  const sheet = wrapper.querySelector('.sheet-num')
  const cue = wrapper.querySelector('.scroll-cue')
  const labels = wrapper.querySelector('.plate-note')
  const constellation = wrapper.querySelector('.points')
  const points = [
    [35, 197],
    [89, 149],
    [128, 155],
    [177, 91],
    [224, 102],
    [247, 55],
    [56, 638],
    [110, 613],
    [135, 558],
    [203, 547],
    [416, 63],
    [441, 99],
    [494, 87],
    [527, 136],
    [1182, 650],
    [1234, 676],
    [1280, 637],
    [1335, 650],
    [1368, 603],
    [341, 582],
    [375, 517],
    [417, 580],
    [358, 556],
    [401, 557],
  ]
  constellation.innerHTML = points
    .map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i % 4 === 0 ? 2.1 : 1.35}"/>`)
    .join('')
  const art = ['moon', 'star', 'sun']
  const cards = Array.from({ length: 13 }, (_, i) => {
    const node = document.createElement('div')
    node.className = 'orbit-card' + (i < 3 ? '' : ' satellite')
    const img = document.createElement('img')
    img.src = '/art/' + (art[i] || 'back') + '.svg'
    img.alt = ''
    img.width = 210
    img.height = 340
    node.style.setProperty('--float-delay', -i * 1.73 + 's')
    img.draggable = false
    node.append(img)
    group.append(node)
    return node
  })
  // Three legible plates in the foreground. Smaller plates trace the distant ecliptic.
  const starts = [
    [-0.181, 0.004, -24, 0.86, 1],
    [0.186, 0.039, 24, 0.84, 1],
    [0.002, -0.034, 6, 1.04, 1],
    [-0.351, -0.24, -31, 0.102, 0.47],
    [0.3, -0.29, 27, 0.106, 0.41],
    [0.416, 0.105, 36, 0.081, 0.46],
    [-0.31, 0.3, -40, 0.073, 0.47],
    [0.132, 0.36, 21, 0.066, 0.42],
    [-0.101, -0.386, 17, 0.064, 0.48],
    [-0.423, 0.089, -23, 0.046, 0.48],
    [0.374, -0.117, 36, 0.054, 0.55],
    [0.054, -0.319, -16, 0.055, 0.35],
    [-0.18, 0.37, 35, 0.04, 0.4],
  ]
  let width = 0,
    height = 0,
    progress = 0,
    chapter = -1
  const fanSlots = [3, 9, 6, 0, 1, 2, 4, 5, 7, 8, 10, 11, 12]
  function render() {
    const p = reduce ? 0 : progress
    const converge = ease(0.035, 0.43, p),
      split = Math.sin(ease(0.43, 0.7, p) * Math.PI)
    const fan = ease(0.69, 0.99, p)
    group.style.setProperty('--float-distance', (reduce ? 0 : 1 - converge) * 3.2 + 'px')
    group.style.perspectiveOrigin = 50 + p * 4 + '% 50%'
    for (let i = 0; i < cards.length; i++) {
      const [sx, sy, sr, ss, so] = starts[i]
      const stackZ = i < 3 ? [9, 10, 12][i] : i - 3
      const slot = fanSlots[i]
      const slotOffset = slot - 6
      const x =
        sx * (1 - converge) +
        (stackZ - 5) * 0.0013 * converge +
        (i % 2 ? 1 : -1) * split * 0.102 +
        slotOffset * 0.032 * fan
      const y =
        sy * (1 - converge) +
        (stackZ - 6) * -0.0015 * converge +
        (i % 2 ? 1 : -1) * 0.017 * split +
        (0.0018 * slotOffset * slotOffset - 0.005) * fan
      const angle = sr * (1 - converge) + split * (i % 2 ? 7 : -8) + slotOffset * 5.1 * fan
      const scale = ss + (1.02 - ss) * converge
      cards[i].style.transform =
        `translate3d(${width * x}px,${height * y}px,0) rotate(${angle}deg) scale(${scale})`
      cards[i].style.opacity = so + (1 - so) * converge
      cards[i].style.zIndex = p < 0.36 ? stackZ + 1 : slot + 1
    }
  }
  function scrollPose(p) {
    progress = p
    const fade = ease(0.1, 0.36, p),
      show = ease(0.4, 0.69, p)
    gsap.set(sky, { autoAlpha: 1 - fade, clipPath: `inset(0 0 ${fade * 100}% 0)` })
    gsap.set(deck, { autoAlpha: show, clipPath: `inset(0 0 ${(1 - show) * 100}% 0)` })
    gsap.set(stage.querySelector('.hero-orbits'), {
      scale: 1 + p * 0.08,
      rotation: p * 8,
      opacity: 1 - p * 0.34,
    })
    const current = p > 0.42 ? 2 : 1
    if (chapter !== current) {
      chapter = current
      sky.inert = current !== 1
      deck.inert = current !== 2
      sky.setAttribute('aria-hidden', String(sky.inert))
      deck.setAttribute('aria-hidden', String(deck.inert))
      sheet.textContent = current === 1 ? 'N° I' : 'N° II'
      cue.href = current === 1 ? '#deste' : '#kartlar'
      labels.lastChild.textContent = current === 1 ? ' ARKANA' : ' DESTE'
    }
    render()
  }
  const resize = new ResizeObserver(() => {
    width = stage.clientWidth
    height = stage.clientHeight
    render()
  })
  resize.observe(stage)
  const marker = document.querySelector('#deste')
  let trigger
  if (reduce) {
    marker.classList.add('reduced-deck')
    marker.innerHTML =
      '<div class="kicker">LEVHA II / DESTE</div><h2>Bir deste, <em>bin ihtimal.</em></h2><p>Kartlar bir araya gelir. İçlerinden biri seni bekler.</p><a class="text-link" href="#kartlar">Açılımlara geç</a>'
    scrollPose(0)
  } else {
    trigger = ScrollTrigger.create({
      trigger: wrapper,
      start: () => `top top+=${document.querySelector('.masthead').offsetHeight}`,
      end: () => '+=' + wrapper.querySelector('.sky-window').offsetHeight,
      onUpdate: (self) => scrollPose(self.progress),
      onRefresh: (self) => scrollPose(self.progress),
    })
  }
  const observer = new IntersectionObserver(([entry]) =>
    wrapper.classList.toggle('in-view', entry.isIntersecting),
  )
  observer.observe(wrapper)
  return () => {
    resize.disconnect()
    observer.disconnect()
    trigger?.kill()
    group.replaceChildren()
    marker.replaceChildren()
    marker.classList.remove('reduced-deck')
  }
}

export function mountSectionMotion(reduce) {
  const context = gsap.context(() => {
    const length = reduce ? 0 : 1
    gsap.to('.route-draw', {
      strokeDashoffset: 0,
      duration: length,
      ease: 'none',
      scrollTrigger: reduce
        ? undefined
        : { trigger: '.route', start: 'top 85%', end: 'center 46%', scrub: true },
    })
    gsap.to('.route', {
      '--draw': '100%',
      duration: length,
      ease: 'none',
      scrollTrigger: reduce
        ? undefined
        : { trigger: '.route', start: 'top 85%', end: 'bottom 62%', scrub: true },
    })
    gsap.fromTo(
      '.moon-phases svg',
      { opacity: reduce ? 1 : 0.45 },
      {
        opacity: 1,
        stagger: 0.12,
        duration: length,
        ease: 'none',
        scrollTrigger: reduce
          ? undefined
          : { trigger: '.moon-phases', start: 'top 92%', end: 'top 38%', scrub: true },
      },
    )
    if (!reduce)
      gsap.fromTo(
        '.chart-arch img',
        { rotation: -12 },
        {
          rotation: 12,
          ease: 'none',
          scrollTrigger: { trigger: '.about', start: 'top bottom', end: 'bottom top', scrub: true },
        },
      )
  })
  return () => context.revert()
}
