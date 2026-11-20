export function mountSensory({ reduced, onInput }) {
  const abort = new AbortController(),
    opts = { signal: abort.signal }
  const input = { x: 0, y: 0 }
  const clamp = (x) => Math.max(-1, Math.min(1, x))
  const sound = document.querySelector('#sound')
  let audio = null,
    enabled = false,
    orientation = false,
    baseline = null
  async function chime() {
    if (!enabled || !audio) return
    if (audio.state === 'suspended') await audio.resume()
    const now = audio.currentTime
    for (const [pitch, delay] of [
      [523.25, 0],
      [783.99, 0.07],
      [1046.5, 0.16],
    ]) {
      const osc = audio.createOscillator(),
        gain = audio.createGain()
      osc.type = 'sine'
      osc.frequency.value = pitch
      gain.gain.setValueAtTime(0.0001, now + delay)
      gain.gain.exponentialRampToValueAtTime(0.027, now + delay + 0.045)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 1.1)
      osc.connect(gain)
      gain.connect(audio.destination)
      osc.start(now + delay)
      osc.stop(now + delay + 1.15)
      osc.onended = () => {
        osc.disconnect()
        gain.disconnect()
      }
    }
  }
  function shimmer() {
    chime().catch((error) => console.info('Ses başlatılamadı.', error.message))
  }
  sound.addEventListener(
    'click',
    async () => {
      const Context = window.AudioContext || window.webkitAudioContext
      if (!Context) {
        sound.disabled = true
        sound.setAttribute('aria-label', 'Ses desteklenmiyor')
        sound.querySelector('.sound-label').textContent = 'Ses yok'
        return
      }
      try {
        if (!audio) audio = new Context()
        enabled = !enabled
        if (enabled) {
          await audio.resume()
          shimmer()
        } else await audio.suspend()
      } catch (error) {
        console.info('Ses açılamadı.', error.message)
        enabled = false
      }
      sound.setAttribute('aria-pressed', String(enabled))
      sound.setAttribute('aria-label', enabled ? 'Sesi kapat' : 'Sesi aç')
      sound.querySelector('.sound-label').textContent = enabled ? 'Ses açık' : 'Ses kapalı'
    },
    opts,
  )
  function point(x, y) {
    if (reduced()) return
    input.x = clamp(x)
    input.y = clamp(y)
    onInput()
  }
  window.addEventListener(
    'pointermove',
    (e) => point((e.clientX / innerWidth) * 2 - 1, (e.clientY / innerHeight) * 2 - 1),
    { ...opts, passive: true },
  )
  async function orient() {
    const api = window.DeviceOrientationEvent
    if (orientation || !api || reduced()) return
    orientation = true
    try {
      if (
        typeof api.requestPermission === 'function' &&
        (await api.requestPermission()) !== 'granted'
      )
        return
      window.addEventListener(
        'deviceorientation',
        (e) => {
          if (!Number.isFinite(e.gamma) || !Number.isFinite(e.beta)) return
          if (baseline === null) baseline = e.beta
          point(e.gamma / 35, (e.beta - baseline) / 35)
        },
        { ...opts, passive: true },
      )
    } catch (error) {
      console.info('Yön sensörü kullanılamıyor.', error.name)
    }
  }
  let cursor = 0
  const dust = document.querySelector('#dust')
  const particles = Array.from({ length: 32 }, () => dust.appendChild(document.createElement('i')))
  const animations = new Map()
  function burst(x, y, count = 8) {
    if (reduced() || !particles[0].animate) return
    for (let i = 0; i < count; i++) {
      const el = particles[cursor++ % particles.length]
      animations.get(el)?.cancel()
      const a = (Math.PI * 2 * i) / count + Math.random() * 0.25,
        r = (18 + Math.random() * 48) * (count > 10 ? 2.6 : 1)
      animations.set(
        el,
        el.animate(
          [
            { opacity: 0.9, transform: `translate(${x}px,${y}px) scale(1)` },
            {
              opacity: 0,
              transform: `translate(${x + Math.cos(a) * r}px,${y + Math.sin(a) * r}px) scale(.35)`,
            },
          ],
          { duration: 650 + Math.random() * 250, easing: 'cubic-bezier(.13,.6,.3,1)' },
        ),
      )
    }
  }
  window.addEventListener(
    'pointerdown',
    (e) => {
      if (e.pointerType === 'touch') {
        point((e.clientX / innerWidth) * 2 - 1, (e.clientY / innerHeight) * 2 - 1)
        burst(e.clientX, e.clientY)
        orient()
      }
    },
    { ...opts, passive: true },
  )
  return {
    input,
    shimmer,
    orient,
    burst,
    dispose() {
      abort.abort()
      for (const animation of animations.values()) animation.cancel()
      dust.replaceChildren()
      if (audio) audio.close().catch((error) => console.info('Ses kapatılamadı.', error.name))
    },
  }
}
