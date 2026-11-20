import * as THREE from 'three'

const tiers = [
  { stars: 1200, dpr: 1 },
  { stars: 3000, dpr: 1.35 },
  { stars: 6000, dpr: 1.75 },
]

function makeRenderer(canvas) {
  try {
    const options = {
      alpha: true,
      antialias: false,
      powerPreference: 'low-power',
      premultipliedAlpha: true,
    }
    const context = canvas.getContext('webgl2', options)
    if (!context) return null
    return new THREE.WebGLRenderer({ ...options, canvas, context })
  } catch (error) {
    console.info('Gök atlası SVG görünümüne geçti.', error.message)
    return null
  }
}

const starVertex = `
attribute float size; attribute float phase; uniform float clock; uniform float ratio;
uniform vec2 pointer; varying float vIntensity; varying float vWarmth;
void main(){
  vec3 p=position;
  p.xy+=pointer*(.005+.011*p.z);
  gl_Position=vec4(p.xy,0.,1.);
  gl_PointSize=max(1.,size*ratio*(.7+.4*p.z));
  vIntensity=(.35+.65*p.z)*(.78+.22*sin(clock*(.35+fract(phase))+phase));
  vWarmth=fract(phase*17.);
}`
const starFragment = `
varying float vIntensity; varying float vWarmth;
void main(){
  vec2 v=gl_PointCoord*2.-1.;
  float d=length(v);
  float a=(1.-smoothstep(.03,1.,d))*.55;
  vec3 c=mix(vec3(.66,.72,.85),vec3(.94,.82,.6),vWarmth);
  gl_FragColor=vec4(c,a*vIntensity);
}`

// The brightest engraved strokes catch the directional foil. Ink stays matte.
const foilVertex = `varying vec2 vUv; void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`
const foilFragment = `
uniform sampler2D plate; uniform vec2 pointer; varying vec2 vUv;
float lum(vec3 c){return dot(c,vec3(.30,.57,.13));}
void main(){
  vec4 sampleColor=texture2D(plate,vUv);
  float ink=lum(sampleColor.rgb);
  vec2 delta=vec2(1./512.,1./840.);
  vec3 normal=normalize(vec3((ink-lum(texture2D(plate,vUv+vec2(delta.x,0.)).rgb))*2.,
    (ink-lum(texture2D(plate,vUv+vec2(0.,delta.y)).rgb))*2.,1.));
  vec3 light=normalize(vec3(pointer*.8+vec2(-.3,.22),1.));
  float spec=pow(max(dot(normal,light),0.),13.);
  float band=exp(-pow((vUv.x*.85+vUv.y*.48-.65-pointer.x*.36-pointer.y*.18)*4.8,2.));
  float rim=pow(1.-max(dot(normal,vec3(0.,0.,1.)),0.),2.);
  float metal=smoothstep(.14,.64,ink);
  vec3 c=sampleColor.rgb+vec3(.34,.24,.10)*metal*(band*(.32+spec)+.46*rim);
  gl_FragColor=vec4(c,sampleColor.a);
}`

export function mountScene({ reduced, input }) {
  const sky = document.querySelector('#stars'),
    foil = document.querySelector('.foil'),
    foilCanvas = foil.querySelector('canvas')
  const skyCanvas = document.createElement('canvas')
  sky.append(skyCanvas)
  let tier =
    (navigator.deviceMemory || 4) <= 2 || (navigator.hardwareConcurrency || 4) <= 3
      ? 0
      : matchMedia('(pointer:coarse)').matches
        ? 1
        : 2
  let disposed = false,
    frame = 0,
    previous = 0,
    clock = 0,
    average = 17,
    samples = 0,
    moving = false
  const dimensions = new Map(),
    objects = [],
    visible = new Set()
  const vec = new THREE.Vector2()
  const scene = new THREE.Scene(),
    camera = new THREE.Camera()
  const skyRenderer = makeRenderer(skyCanvas)
  let starGeometry = null,
    starMaterial = null,
    foilRenderer = null,
    foilScene = null,
    foilTexture = null,
    foilMaterial = null
  let seed = 621
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    return seed / 4294967296
  }
  const quality = () => {
    starGeometry?.setDrawRange(0, tiers[tier].stars)
    for (const [node, renderer] of [
      [sky, skyRenderer],
      [foil, foilRenderer],
    ]) {
      if (!renderer) continue
      renderer.setPixelRatio(Math.min(devicePixelRatio || 1, tiers[tier].dpr))
      const size = dimensions.get(node)
      if (size) renderer.setSize(size.width, size.height, false)
    }
    if (starMaterial) starMaterial.uniforms.ratio.value = skyRenderer.getPixelRatio()
  }
  if (skyRenderer) {
    const count = tiers[tier].stars
    const positions = new Float32Array(count * 3),
      sizes = new Float32Array(count),
      phases = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (random() - 0.5) * 2.1
      positions[i * 3 + 1] = (random() - 0.5) * 2.1
      positions[i * 3 + 2] = random()
      sizes[i] = 0.52 + random() ** 4 * 2.3
      phases[i] = random() * 150
    }
    starGeometry = new THREE.BufferGeometry()
    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    starGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    starGeometry.setAttribute('phase', new THREE.BufferAttribute(phases, 1))
    starMaterial = new THREE.ShaderMaterial({
      vertexShader: starVertex,
      fragmentShader: starFragment,
      uniforms: { clock: { value: 0 }, ratio: { value: 1 }, pointer: { value: vec } },
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    })
    const points = new THREE.Points(starGeometry, starMaterial)
    points.frustumCulled = false
    scene.add(points)
    objects.push(starGeometry, starMaterial)
    quality()
  }
  function setupFoil() {
    if (foilRenderer || foil.dataset.engine === 'svg') return
    foilRenderer = makeRenderer(foilCanvas)
    if (!foilRenderer) {
      foil.dataset.engine = 'svg'
      return
    }
    foilTexture = new THREE.TextureLoader().load(
      '/art/finale.svg',
      () => {
        if (disposed) return
        foil.dataset.engine = 'webgl'
        foilCanvas.style.visibility = 'visible'
        request()
      },
      undefined,
      () => {
        foilCanvas.style.visibility = 'hidden'
        foil.dataset.engine = 'svg'
      },
    )
    foilCanvas.style.visibility = 'hidden'
    foilMaterial = new THREE.ShaderMaterial({
      uniforms: { plate: { value: foilTexture }, pointer: { value: vec } },
      vertexShader: foilVertex,
      fragmentShader: foilFragment,
      transparent: true,
    })
    const geometry = new THREE.PlaneGeometry(2, 2)
    const mesh = new THREE.Mesh(geometry, foilMaterial)
    mesh.frustumCulled = false
    foilScene = new THREE.Scene()
    foilScene.add(mesh)
    objects.push(foilTexture, foilMaterial, geometry)
    quality()
  }
  function request() {
    if (!frame && !disposed && !document.hidden && visible.size) frame = requestAnimationFrame(draw)
  }
  function draw(now) {
    frame = 0
    if (disposed || document.hidden || !visible.size) return
    const elapsed = previous ? Math.min(now - previous, 80) : 16.7
    previous = now
    clock += elapsed * 0.001
    if (skyRenderer && visible.has(sky) && !reduced()) {
      average = average * 0.965 + elapsed * 0.035
      if (++samples > 120) {
        if (average > 29 && tier > 0) {
          tier--
          quality()
        }
        samples = 0
      }
    }
    const smoothing = 1 - Math.exp(-elapsed / 140)
    vec.x += (input.x - vec.x) * smoothing
    vec.y += (input.y - vec.y) * smoothing
    moving = Math.abs(input.x - vec.x) + Math.abs(input.y - vec.y) > 0.003
    if (visible.has(sky) && skyRenderer) {
      starMaterial.uniforms.clock.value = reduced() ? 0 : clock
      skyRenderer.render(scene, camera)
    }
    if (visible.has(foil) && foilRenderer) foilRenderer.render(foilScene, camera)
    if (visible.has(foil) && !reduced())
      foil.style.transform = `rotateY(${vec.x * 8}deg) rotateX(${-vec.y * 6}deg) rotate(-5deg)`
    if (!reduced() && ((visible.has(sky) && skyRenderer) || moving)) request()
    else previous = 0
  }
  const resize = new ResizeObserver((entries) => {
    for (const entry of entries) dimensions.set(entry.target, entry.contentRect)
    quality()
    request()
  })
  const intersections = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting && !entry.target.querySelector('canvas[hidden]')) {
        visible.add(entry.target)
        if (entry.target === foil) setupFoil()
      } else visible.delete(entry.target)
    }
    previous = 0
    request()
  })
  for (const node of [sky, foil]) {
    resize.observe(node)
    intersections.observe(node)
  }
  const abort = new AbortController()
  const opts = { signal: abort.signal }
  for (const [canvas, node] of [
    [skyCanvas, sky],
    [foilCanvas, foil],
  ])
    canvas.addEventListener(
      'webglcontextlost',
      (e) => {
        e.preventDefault()
        visible.delete(node)
        canvas.hidden = true
        node.dataset.engine = 'svg'
      },
      opts,
    )
  document.addEventListener(
    'visibilitychange',
    () => {
      previous = 0
      if (document.hidden) {
        cancelAnimationFrame(frame)
        frame = 0
      } else request()
    },
    opts,
  )
  return {
    request,
    dispose() {
      disposed = true
      cancelAnimationFrame(frame)
      resize.disconnect()
      intersections.disconnect()
      abort.abort()
      objects.forEach((resource) => resource.dispose())
      for (const renderer of [skyRenderer, foilRenderer]) {
        renderer?.dispose()
        renderer?.forceContextLoss()
      }
      skyCanvas.remove()
    },
  }
}
