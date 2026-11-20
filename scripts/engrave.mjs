// Rebuild the atlas plates with: node scripts/engrave.mjs
// All coordinates, hatch marks and ornaments in these plates are drawn here.
import { mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const out = fileURLToPath(new URL('../public/art/', import.meta.url))
mkdirSync(out, { recursive: true })
const ink = '#131922'
const copper = '#ac8959'
const gold = '#cfac74'
const light = '#ead2a0'
const dark = '#32302a'
const pi = Math.PI
const n = (value) => Number(value.toFixed(1))
const repeat = (count, callback) => Array.from({ length: count }, (_, i) => callback(i)).join('')
const xy = (x, y) => n(x) + ' ' + n(y)
const polar = (x, y, r, deg) =>
  xy(x + r * Math.cos((deg * pi) / 180), y + r * Math.sin((deg * pi) / 180))
const circle = (x, y, r, attrs = '') =>
  '<circle cx="' + n(x) + '" cy="' + n(y) + '" r="' + n(r) + '" ' + attrs + '/>'
const path = (d, attrs = '') => '<path d="' + d + '" ' + attrs + '/>'
const line = (x, y, x2, y2) => 'M' + xy(x, y) + 'L' + xy(x2, y2)
const group = (markup, attrs = '') => '<g ' + attrs + '>' + markup + '</g>'
const fill = (color) => 'fill="' + color + '" stroke="none"'
const stroke = (color, width) => 'fill="none" stroke="' + color + '" stroke-width="' + width + '"'
const seeded = (seed) => () => {
  seed = (Math.imul(1664525, seed) + 1013904223) >>> 0
  return seed / 4294967296
}
const label = (x, y, word, size, space = 2, color = light) =>
  '<text x="' +
  x +
  '" y="' +
  y +
  '" text-anchor="middle" font-family="Georgia,serif" font-size="' +
  size +
  '" letter-spacing="' +
  space +
  '" fill="' +
  color +
  '" stroke="none">' +
  word +
  '</text>'

function spark(x, y, radius, color = gold) {
  return path(
    'M' +
      xy(x, y - radius) +
      'q' +
      xy(radius * 0.1, radius * 0.8) +
      ' ' +
      xy(radius * 0.75, radius) +
      'q' +
      xy(-radius * 0.65, radius * 0.1) +
      ' ' +
      xy(-radius * 0.75, radius) +
      'q' +
      xy(-radius * 0.12, -radius * 0.85) +
      ' ' +
      xy(-radius * 0.75, -radius) +
      'q' +
      xy(radius * 0.62, -radius * 0.1) +
      ' ' +
      xy(radius * 0.75, -radius) +
      'z',
    fill(color),
  )
}

function stipple(seed, count, x, y, w, h) {
  const rand = seeded(seed)
  return group(
    repeat(count, () => circle(x + rand() * w, y + rand() * h, rand() * 0.52 + 0.15)),
    fill(copper) + ' opacity=".68"',
  )
}

function night(seed, count) {
  const rand = seeded(seed)
  return (
    stipple(seed, 140, 15, 23, 180, 260) +
    repeat(count, (i) =>
      spark(
        21 + rand() * 168,
        41 + rand() * 209,
        i % 5 === 0 ? 2.6 + rand() * 1.8 : 0.9 + rand() * 1.5,
        i % 3 ? copper : light,
      ),
    )
  )
}

function radialLines(x, y, r1, r2, count, every = 5) {
  return repeat(count, (i) => {
    const a = (i / count) * 360 - 90
    return (
      'M' + polar(x, y, r1, a) + 'L' + polar(x, y, i % every === 0 ? r2 : r1 + (r2 - r1) * 0.48, a)
    )
  })
}

const definitions = `<defs>
  <linearGradient id="paper" x2=".75" y2="1" gradientUnits="objectBoundingBox"><stop stop-color="#202630"/><stop offset=".42" stop-color="#141a24"/><stop offset="1" stop-color="#12151b"/></linearGradient>
  <linearGradient id="metal" x2="1" y2="1"><stop stop-color="#9b7953"/><stop offset=".26" stop-color="#ebd3a3"/><stop offset=".57" stop-color="#b69763"/><stop offset=".82" stop-color="#dcc190"/><stop offset="1" stop-color="#a78955"/></linearGradient>
  <linearGradient id="disc" x2=".9" y2="1"><stop stop-color="#edcf96"/><stop offset=".57" stop-color="#cba76e"/><stop offset="1" stop-color="#967744"/></linearGradient>
  <clipPath id="field"><rect x="13" y="14" width="184" height="311" rx="3"/></clipPath>
  <pattern id="shade" width="3.1" height="3.1" patternUnits="userSpaceOnUse" patternTransform="rotate(22)"><path d="M0 0v3.1" stroke="#262828" stroke-width=".64"/></pattern>
</defs>`

function corner(x, y, rotation) {
  const engraving =
    path(
      'M0 0H34Q22 1 16 8C12 14 15 18 18 16Q21 13 17 12Q20 10 22 13C25 23 11 23 10 14Q7 17 6 24L3 33L3 12Z',
      'fill="none" stroke="' + gold + '" stroke-width=".8"',
    ) +
    path('M4 4l6 1 -5 5zM15 4q7-2 11-1 -6 1-12 6zM6 12q-1 8-3 13 0-7 3-13z', fill(gold)) +
    circle(10, 10, 1.35, fill(light))
  return group(engraving, 'transform="translate(' + x + ' ' + y + ') rotate(' + rotation + ')"')
}

function frame(roman, name, scene, back = false) {
  const boundaries =
    '<rect x=".9" y=".9" width="208.2" height="338.2" rx="7" fill="url(#paper)" stroke="url(#metal)" stroke-width="1.8"/>' +
    '<rect x="4" y="4" width="202" height="332" rx="4" ' +
    stroke(copper, 0.65) +
    '/>' +
    '<rect x="8" y="8" width="194" height="324" rx="2.5" ' +
    stroke(gold, 1.4) +
    '/>' +
    '<rect x="11" y="11" width="188" height="318" rx="1" ' +
    stroke(copper, 0.45) +
    '/>'
  const trim = repeat(2, (side) =>
    group(
      path(
        repeat(45, (i) => 'M0 ' + (37 + i * 6) + 'l1.5 -2'),
        stroke(copper, 0.42),
      ) + path('M0 44V296', stroke(copper, 0.45)),
      'transform="translate(' + (side ? 204 : 5.4) + ' 0)"',
    ),
  )
  const title = back
    ? ''
    : group(
        path(
          'M72 15h66l-5 5v5q-4 0-7 4H84q-3-4-7-4v-5z',
          'fill="' + ink + '" stroke="' + copper + '" stroke-width=".7"',
        ) +
          label(105, 24, roman, 8.6, 1.5) +
          path('M19 280H191M19 284H191M19 317H191', stroke(gold, 0.65)) +
          path('M37 301q7 -2 15 0 -8 2 -15 0M173 301q-7 -2 -15 0 8 2 15 0', fill(copper)) +
          label(105, 306, name, 16, 3.2),
      )
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" width="210" height="340" viewBox="0 0 210 340">' +
    definitions +
    boundaries +
    trim +
    group(scene, 'clip-path="url(#field)"') +
    title +
    corner(13, 13, 0) +
    corner(197, 13, 90) +
    corner(197, 327, 180) +
    corner(13, 327, 270) +
    '</svg>'
  )
}

function sunPortrait() {
  const x = 105,
    y = 125,
    r = 36
  const rays = repeat(30, (i) =>
    group(
      i % 2 === 0
        ? path(
            'M-2 -39Q-5 -52 -2 -58Q1 -66 0 -78Q4 -65 2 -56Q0 -48 2 -39Z',
            'fill="' + gold + '" stroke="' + copper + '" stroke-width=".5"',
          ) + path('M0 -41Q-3 -49 0 -59', stroke(dark, 0.58))
        : path('M-1.9 -40L0 -74L1.9 -40Z', fill(light)),
      'transform="translate(' + x + ' ' + y + ') rotate(' + i * 12 + ')"',
    ),
  )
  const face = group(
    circle(0, 0, r + 2.2, 'fill="' + ink + '" stroke="' + gold + '" stroke-width=".8"') +
      circle(0, 0, r, 'fill="url(#disc)" stroke="' + light + '" stroke-width=".9"') +
      circle(0, 0, r - 1.7, stroke(dark, 0.68)) +
      path(
        'M-30 1C-32 16-21 29-11 31Q-24 22-27 9ZM30 -12Q33 7 23 19Q29 4 28-5Z',
        'fill="url(#shade)" stroke="none"',
      ) +
      path(
        'M-26 -5Q-21-14-11-13Q-6-12-4-8Q-14-13-21-8ZM5-9Q11-17 20-13Q23-12 26-9Q17-14 8-7Z',
        fill(dark),
      ) +
      path(
        'M-24-3Q-16-9-6-3Q-16 3-24-3ZM6-3Q16-10 24-4Q16 3 6-3Z',
        'fill="none" stroke="' + dark + '" stroke-width="1.15"',
      ) +
      circle(-15.5, -3.3, 2.55, fill(dark)) +
      circle(15.2, -3.8, 2.55, fill(dark)) +
      circle(-16.2, -4.2, 0.66, fill(light)) +
      circle(14.5, -4.7, 0.66, fill(light)) +
      path(
        'M-23 0Q-15 5-7 .5M8 0Q17 4 23-1M-4-7Q-4-2-5 2Q-6 5-9 8Q-11 11-8 12Q-6 12-4 11M3-7Q1 1 4 8M-3 11Q0 14 4 11Q8 13 8 10M-14 20Q-9 19-5 17Q-2 16 0 18Q3 16 5 17L12 19Q6 19 3 21Q0 22-4 21Q-8 19-12 20M-8 23Q0 28 8 22M-6 30Q1 32 7 28',
        stroke(dark, 0.95),
      ) +
      path(
        'M-28-14Q-22-28-7-31M-28-18Q-22-29-13-31M-29-9Q-22-20-13-20M8-26Q18-25 27-17M-25 7Q-18 3-12 5M-25 10Q-19 5-14 6M-23 13Q-18 9-13 9M13 6Q18 3 24 4M13 9Q20 6 24 7M14 12Q18 9 23 9M15 16Q19 12 22 12M8 24Q14 21 15 17M11 25Q16 22 18 18M-22 18Q-20 23-15 25M-20 19Q-17 23-14 24M-18 18Q-17 21-15 21M-3 0Q-3 5-6 8',
        stroke(dark, 0.46),
      ),
    'transform="translate(105 125)"',
  )
  const fineRays = path(
    repeat(60, (i) => {
      const a = i * 6 - 87
      return (
        'M' +
        polar(x, y, 44 + 3 * Math.sin(i), a) +
        'L' +
        polar(x, y, 62 + 8 * Math.cos(i * 1.9), a)
      )
    }),
    stroke(copper, 0.4),
  )
  return fineRays + rays + face
}

function hillside(seed, y, amp, count, tone) {
  const rand = seeded(seed)
  let height = (x) =>
    y + Math.sin(x / (39 + (seed % 19)) + seed) * amp + Math.sin(x / 17.4 - seed) * amp * 0.28
  let ridge = 'M' + xy(13, height(13))
  for (let x = 15; x <= 198; x += 2) ridge += 'L' + xy(x, height(x))
  // Follow the contours of the ridge. Interrupted strokes suggest burrs in a copperplate.
  let contours = ''
  for (let row = 0; row < 9; row++) {
    let x = 12 - rand() * 10
    while (x < 197) {
      const length = 4 + rand() * (14 + 2 * row)
      let segment = ''
      for (let t = 0; t <= length; t += 2) {
        const px = Math.min(198, x + t)
        const py =
          height(px - row * 1.8) + 2.5 + row * 2.4 + Math.sin(px / 9.6 + row * 0.58) * row * 0.13
        segment += (t ? 'L' : 'M') + xy(px, py)
      }
      contours += segment
      x += length + 1 + rand() * 4
    }
  }
  const tufts = repeat(Math.round(count / 6), () => {
    const x = 14 + rand() * 180,
      y = height(x) + 1
    return 'M' + xy(x, y) + 'l-1.4 -2.3m1.4 2.3l1.6 -3.2'
  })
  return (
    path(ridge + 'V280H13Z', 'fill="' + tone + '" stroke="none"') +
    path(ridge, stroke(gold, 0.89)) +
    path(contours, stroke(copper, 0.51)) +
    path(tufts, stroke(copper, 0.51))
  )
}

function sunPlate() {
  return (
    night(19, 36) +
    path(radialLines(105, 125, 81, 88, 180, 6), stroke(copper, 0.4)) +
    circle(105, 125, 80, stroke(copper, 0.4) + ' stroke-dasharray="1.1 3"') +
    sunPortrait() +
    group(
      path(
        'M17 200Q37 198 50 194T84 191M25 203Q38 201 55 198M130 197Q155 194 187 195M139 199Q163 197 178 198',
        stroke(copper, 0.66),
      ),
    ) +
    hillside(33, 222, 12, 125, '#20262a') +
    hillside(13, 244, 12, 150, '#1d2227') +
    hillside(15, 262, 7, 175, '#161c23') +
    spark(105, 42, 3.2, light)
  )
}

function moonPortrait() {
  const moon =
    'M31 -44C5 -54 -24 -42 -39 -21C-58 7 -45 40 -19 49C0 55 23 48 36 33C20 40 5 38 -4 27C-9 22 -11 18 -8 16Q-3 13 -7 10Q-12 9 -7 7Q-5 6 -6 3Q-13 1 -13-2Q-12-5 -16-12Q-19-18 -15-26Q-4-42 17-44Q23-45 31-44Z'
  const hatches =
    repeat(20, (i) => 'M' + xy(-39 + i * 0.66, -8 - i * 1.45) + 'q-5 18 1 32') +
    repeat(11, (i) => 'M' + xy(-33 + i * 1.9, 26 + i * 1.64) + 'q8 12 22 13')
  return group(
    circle(0, 0, 54.5, stroke(copper, 0.55)) +
      circle(0, 0, 57.3, stroke(copper, 0.48) + ' stroke-dasharray="1 3"') +
      path(radialLines(0, 0, 63, 70, 84, 7), stroke(copper, 0.48)) +
      path(moon, 'fill="url(#disc)" stroke="' + light + '" stroke-width="1.1"') +
      '<defs><clipPath id="moon-profile">' +
      path(moon) +
      '</clipPath></defs>' +
      group(path(hatches, stroke(dark, 0.57)), 'clip-path="url(#moon-profile)"') +
      path(
        'M-28-17Q-24-22-18-20M-29-13Q-23-16-18-13Q-22-9-28-12M-28-10Q-23-8-20-11M-18-23Q-24-23-28-19M-29 1Q-25-3-20-2M-28 3Q-24 0-21 0M-17 23Q-12 37 1 40M-16 27Q-9 39 0 41M-10 8q-3 .6-4-.2M-10 11q-3 0-4 1',
        stroke(dark, 0.76),
      ) +
      circle(-22, -12.8, 1.2, fill(dark)),
    'transform="translate(106 123) rotate(-7)"',
  )
}

function moonPlate() {
  const rand = seeded(35)
  const waves = repeat(23, (i) => {
    let d = ''
    for (let x = 12; x < 197; x += 29 + rand() * 15) {
      const y = 210 + i * 3.2 + 1.8 * Math.sin(x / 29 + i)
      const w = 5 + rand() * 27
      d +=
        'M' +
        xy(x + rand() * 7, y) +
        'q' +
        xy(w / 4, -2 - rand() * 1.2) +
        ' ' +
        xy(w / 2, -0.4) +
        't' +
        xy(w / 2, -0.2)
    }
    return path(d, stroke(i % 4 === 0 ? light : copper, i % 5 === 0 ? 0.78 : 0.47))
  })
  const reflection = repeat(27, (i) => {
    const x = 99 + rand() * 17 - i * 0.52,
      y = 210 + i * 2.3
    return line(x, y, x + 3 + rand() * (3 + i * 0.75), y - 0.3)
  })
  return (
    night(91, 66) +
    moonPortrait() +
    spark(141, 109, 5.6, light) +
    path(
      'M14 209L32 204L40 205L58 198L69 201L87 206L103 205L116 207L140 200L158 198L166 195L182 198L198 193V280H14Z',
      'fill="' + ink + '" stroke="' + copper + '" stroke-width=".8"',
    ) +
    path(
      'M17 210L46 207L58 201M33 210L53 206M142 202L166 197M148 203L177 199M170 201L190 198',
      stroke(copper, 0.55),
    ) +
    waves +
    path(reflection, stroke(light, 0.82)) +
    group(
      path('M0 0Q9 3 22-.2L19 2H4Z', fill(gold)) +
        path(
          'M12 -19V0M11-18L2-2Q8-3 11-2ZM14-15L20-2L14-3Z',
          'fill="' + copper + '" stroke="' + gold + '" stroke-width=".38"',
        ),
      'transform="translate(139 224)"',
    )
  )
}

function mountain(points, base, tone) {
  const silhouette = 'M' + points.map(([x, y]) => xy(x, y)).join('L')
  let facets = ''
  let striae = ''
  for (let i = 1; i < points.length - 1; i++) {
    const [x, y] = points[i]
    if (y >= points[i - 1][1] || y >= points[i + 1][1]) continue
    const run = (points[i + 1][0] - x) * 0.65
    const [leftX, leftY] = points[i - 1]
    // Short diagonal cuts describe the lit mineral face above each fault.
    for (let f = 0.13; f < 1; f += 0.105) {
      const px = leftX + (x - leftX) * f
      const py = leftY + (y - leftY) * f
      striae +=
        'M' +
        xy(px, py + 1) +
        'l' +
        xy((x - leftX) * 0.05, 4 + f * 2.5) +
        ' ' +
        xy(-(x - leftX) * 0.1, 3 + f * 3.2)
    }
    const drop = Math.min(27, base - y)
    facets +=
      'M' +
      xy(x, y) +
      'l' +
      xy(run * 0.1, drop * 0.25) +
      ' ' +
      xy(run * 0.35, drop * 0.2) +
      ' ' +
      xy(-run * 0.15, drop * 0.2) +
      ' ' +
      xy(run * 0.7, drop * 0.35)
    for (let t = 0.08; t < 1; t += 0.11) {
      const endY = y + (points[i + 1][1] - y) * t
      const endX = x + (points[i + 1][0] - x) * t
      striae +=
        'M' +
        xy(endX, endY + 1) +
        'l' +
        xy(-run * 0.095, drop * 0.18) +
        ' ' +
        xy(run * 0.25, drop * 0.31)
    }
  }
  return (
    path(silhouette + 'V' + base + 'H13Z', 'fill="' + tone + '" stroke="none"') +
    path(silhouette, stroke(light, 0.82)) +
    path(facets, stroke(gold, 0.86)) +
    path(striae, stroke(copper, 0.54))
  )
}

function compassStar(x, y, radius) {
  return group(
    repeat(8, (i) => {
      const a = i * 45 - 90
      const r = i % 2 ? radius * 0.67 : radius
      return (
        path('M0 0L' + polar(0, 0, 8, a - 22.5) + 'L' + polar(0, 0, r, a) + 'Z', fill(light)) +
        path(
          'M0 0L' + polar(0, 0, 8, a + 22.5) + 'L' + polar(0, 0, r, a) + 'Z',
          'fill="' + copper + '" stroke="' + gold + '" stroke-width=".45"',
        )
      )
    }),
    'transform="translate(' + x + ' ' + y + ')"',
  )
}

function starPlate() {
  return (
    night(262, 69) +
    circle(105, 119, 42, stroke(copper, 0.55)) +
    circle(105, 119, 54, stroke(copper, 0.5) + ' stroke-dasharray="1 3.5"') +
    path(radialLines(105, 119, 47.1, 53, 72, 6), stroke(copper, 0.51)) +
    path('M105 44V192M33 119H178M60 76L148 162M61 160L149 77', stroke(copper, 0.43)) +
    compassStar(105, 119, 52) +
    mountain(
      [
        [12, 226],
        [26, 216],
        [33, 219],
        [61, 189],
        [68, 196],
        [74, 192],
        [88, 211],
        [104, 197],
        [123, 216],
        [136, 208],
        [150, 192],
        [155, 195],
        [171, 174],
        [176, 182],
        [182, 181],
        [199, 201],
      ],
      278,
      '#23272b',
    ) +
    mountain(
      [
        [12, 205],
        [26, 200],
        [35, 208],
        [50, 200],
        [60, 213],
        [81, 226],
        [96, 212],
        [110, 195],
        [118, 197],
        [132, 180],
        [149, 218],
        [160, 214],
        [175, 229],
        [196, 214],
        [199, 216],
      ],
      280,
      '#1b2025',
    ) +
    hillside(551, 254, 9, 145, '#182025') +
    hillside(814, 270, 4, 95, '#14191e')
  )
}

function rosette(x, y, radius, petals) {
  const petal = path(
    'M0 0Q' +
      xy(radius * 0.28, -radius * 0.63) +
      ' ' +
      xy(0, -radius) +
      'Q' +
      xy(-radius * 0.28, -radius * 0.63) +
      ' 0 0Z',
    stroke(copper, 0.54),
  )
  const petalsDrawing = repeat(petals, (i) =>
    group(petal, 'transform="rotate(' + (360 * i) / petals + ')"'),
  )
  return group(petalsDrawing, 'transform="translate(' + x + ' ' + y + ')"')
}

function eye(x, y) {
  return group(
    path(
      'M-28 0Q-1-25 28 0Q1 23-28 0Z',
      'fill="' + ink + '" stroke="' + light + '" stroke-width="1.25"',
    ) +
      path('M-28 0Q-2-31 27-2M-25 4Q-1 25 24 4', stroke(copper, 0.71)) +
      circle(0, 0, 8.3, 'fill="url(#disc)" stroke="' + gold + '" stroke-width=".8"') +
      circle(0, 0, 3.1, fill(ink)) +
      circle(1.5, -2, 1.1, fill(light)) +
      path(radialLines(0, 0, 4.3, 7.6, 24, 2), stroke(dark, 0.43)),
    'transform="translate(' + x + ' ' + y + ')"',
  )
}

function compassBack(finale) {
  const radius = finale ? 65 : 57
  const x = 105,
    y = 170
  const tiling = repeat(15, (i) => {
    const a = Math.abs(7 - i) / 7
    return (
      'M13 ' +
      n(52 + i * 6) +
      'C' +
      xy(33 + 25 * a, 73 + i * 3) +
      ' ' +
      xy(65 + 9 * a, 45 + i * 5) +
      ' 105 ' +
      n(30 + i * 2)
    )
  })
  let fields = ''
  for (const tf of [
    '',
    'translate(210 0) scale(-1 1)',
    'translate(0 340) scale(1 -1)',
    'translate(210 340) scale(-1 -1)',
  ]) {
    fields += group(
      path(tiling, stroke(copper, 0.5)) +
        path(
          'M17 32Q48 83 98 88Q52 102 24 138M17 34Q45 84 95 88M23 139Q18 163 19 166',
          stroke(gold, 0.9),
        ) +
        path('M20 41Q38 85 66 109M20 45Q35 80 62 108', stroke(copper, 0.57)) +
        spark(31, 113, 4) +
        spark(57, 87, 2.5),
      'transform="' + tf + '"',
    )
  }
  const topEmblem = group(
    circle(105, 67, 13.1, stroke(copper, 0.7)) +
      path('M109 56A11 11 0 1 0 113 75Q96 73 109 56Z', fill(gold)) +
      path('M105 21L111 32L105 42L99 32Z', stroke(copper, 0.9)) +
      spark(105, 32, 5) +
      path('M105 83V98', stroke(gold, 0.7)) +
      circle(105, 93, 1.8, fill(gold)),
  )
  return (
    night(89, 37) +
    fields +
    path('M105 32L183 170L105 308L27 170Z M105 41L176 170L105 299L34 170Z', stroke(copper, 0.72)) +
    topEmblem +
    group(topEmblem, 'transform="rotate(180 105 170)"') +
    circle(x, y, radius + 6.6, 'fill="' + ink + '" stroke="' + copper + '" stroke-width=".63"') +
    path(radialLines(x, y, radius + 2, radius + 6, 144, 6), stroke(gold, 0.58)) +
    circle(x, y, radius + 1.2, stroke(light, 0.91)) +
    circle(x, y, radius - 2.7, stroke(copper, 0.6)) +
    rosette(x, y, radius - 5, finale ? 32 : 22) +
    (finale ? path('M105 111L148 193H62Z M105 229L63 148H147Z', stroke(light, 0.84)) : '') +
    circle(x, y, radius * 0.57, 'fill="' + ink + '" stroke="' + gold + '" stroke-width=".82"') +
    path(radialLines(x, y, radius * 0.51, radius * 0.56, 80, 4), stroke(copper, 0.48)) +
    (finale ? eye(x, y) : compassStar(x, y, 27)) +
    spark(20, 170, 4.5) +
    spark(190, 170, 4.5)
  )
}

function astrolabe() {
  const cx = 250,
    cy = 250
  const rand = seeded(372)
  const rings = [64, 99, 137, 151, 174, 179, 193, 198, 210, 213]
    .map((r, i) => circle(cx, cy, r, stroke(i % 2 ? copper : gold, i % 3 === 0 ? 1.15 : 0.65)))
    .join('')
  const ticks =
    path(radialLines(cx, cy, 194, 208, 360, 5), stroke(copper, 0.62)) +
    path(radialLines(cx, cy, 153, 163, 120, 10), stroke(copper, 0.55)) +
    path(radialLines(cx, cy, 138, 149, 12, 1), stroke(light, 0.82))
  const lace = repeat(12, (i) =>
    group(
      path('M250 67V59M250 47v-8M246 77l4 -4 4 4-4 4Z', stroke(copper, 0.7)) +
        label(
          250,
          91,
          ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'][i],
          9.3,
          1,
          gold,
        ) +
        '<ellipse cx="250" cy="250" rx="136" ry="27" ' +
        stroke(copper, 0.39) +
        '/>',
      'transform="rotate(' + i * 30 + ' 250 250)"',
    ),
  )
  const fields = repeat(12, (i) => {
    const a = i * 30 + 5
    let coords = []
    for (let j = 0; j < 6; j++)
      coords.push(polar(cx, cy, 73 + rand() * 57, a + j * 3.8 + rand() * 1.8))
    return (
      path('M' + coords.join('L'), stroke(copper, 0.63)) +
      coords
        .map((coord, j) => {
          const [x, y] = coord.split(' ').map(Number)
          return j % 4 === 0 ? spark(x, y, 3, gold) : circle(x, y, 1.1, fill(light))
        })
        .join('')
    )
  })
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500">' +
    definitions +
    rings +
    ticks +
    lace +
    fields +
    group(
      '<ellipse cx="250" cy="250" rx="234" ry="57" ' +
        stroke(copper, 0.85) +
        '/>' +
        '<ellipse cx="250" cy="250" rx="236" ry="60" ' +
        stroke(copper, 0.4) +
        '/>',
      'transform="rotate(-32 250 250)"',
    ) +
    path('M250 26V474M26 250H474', stroke(copper, 0.56) + ' stroke-dasharray="3 6 14 6"') +
    compassStar(250, 250, 55) +
    spark(250, 36, 5) +
    spark(250, 464, 5) +
    spark(37, 250, 5) +
    spark(463, 250, 5) +
    '</svg>'
  )
}

for (const [name, content] of Object.entries({
  sun: frame('XIX', 'GÜNEŞ', sunPlate()),
  moon: frame('XVIII', 'AY', moonPlate()),
  star: frame('XVII', 'YILDIZ', starPlate()),
  back: frame('', '', compassBack(false), true),
  finale: frame('', '', compassBack(true), true),
  astrolabe: astrolabe(),
})) {
  writeFileSync(out + name + '.svg', content + '\n')
}
