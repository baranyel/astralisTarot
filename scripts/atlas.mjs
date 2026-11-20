import { mkdirSync, writeFileSync } from 'node:fs'
import { deflateSync } from 'node:zlib'

const dir = new URL('../public/art/', import.meta.url)
mkdirSync(dir, { recursive: true })
let seed = 7401
function random() {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
  return seed / 4294967296
}
const n = (value) => Number(value.toFixed(2))
const point = (angle, radius) =>
  [Math.cos(angle) * radius, Math.sin(angle) * radius].map(n).join(',')
const star = (x, y, r) =>
  `<path transform="translate(${x} ${y})" d="M0 -${r} Q1 -1 ${r * 0.78} 0 Q1 1 0 ${r} Q-1 1 -${r * 0.78} 0 Q-1 -1 0 -${r}Z" fill="#e4c98c"/>`
const circle = (r, opacity, extra = '') => `<circle r="${r}" opacity="${opacity}" ${extra}/>`
let rings = [
  circle(202, 0.45),
  circle(211, 0.25),
  circle(249, 0.48),
  circle(253, 0.3),
  circle(289, 0.3, 'stroke-dasharray="1 6"'),
  circle(320, 0.3),
  circle(324, 0.18),
].join('')
for (let i = 0; i < 360; i++) {
  const a = (i * Math.PI) / 180
  rings += `<path d="M${point(a, 250)} L${point(a, 250 + (i % 30 === 0 ? 14 : i % 5 === 0 ? 7 : 3))}" opacity="${i % 5 === 0 ? 0.68 : 0.35}"/>`
}
let meridians = ''
for (const [rx, ry, deg, dash] of [
  [332, 102, -23, ''],
  [316, 144, 42, '2 7'],
  [310, 86, -70, ''],
  [355, 175, 4, '1 6'],
]) {
  meridians += `<ellipse rx="${rx}" ry="${ry}" transform="rotate(${deg})" opacity=".36" stroke-dasharray="${dash}"/>`
}
let planets = ''
for (const [a, r, size] of [
  [-0.94, 251, 7],
  [-2.92, 253, 5],
  [0.5, 251, 7],
  [1.75, 251, 5],
  [-1.65, 319, 4],
  [2.45, 322, 4],
]) {
  const [x, y] = point(a, r).split(',').map(Number)
  planets += star(x, y, size) + `<circle cx="${x}" cy="${y}" r="${size + 3}" opacity=".5"/>`
}
let labels = ''
for (let i = 0; i < 12; i++) {
  const a = ((i * 30 - 90) * Math.PI) / 180
  const [x, y] = point(a, 274).split(',')
  labels += `<text x="${x}" y="${y}" text-anchor="middle">${String(i * 30).padStart(3, '0')}°</text>`
}
writeFileSync(
  new URL('orbits.svg', dir),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-380 -350 760 700"><g fill="none" stroke="#ba9e68" stroke-width=".75">${rings}${meridians}${planets}<path d="M-345 0H345M0 -327V327" stroke-dasharray="8 8 1 8" opacity=".22"/></g><g fill="#c2ac7f" opacity=".68" font-family="monospace" font-size="7" letter-spacing="1">${labels}</g></svg>`,
)

let stars = ''
for (let i = 0; i < 270; i++) {
  const x = n(random() * 920),
    y = n(random() * 650),
    s = random()
  stars +=
    s > 0.978
      ? star(x, y, n(1.9 + random() * 2.1))
      : `<circle cx="${x}" cy="${y}" r="${n(0.29 + random() * 0.58)}" opacity="${n(0.17 + random() * 0.65)}"/>`
}
writeFileSync(
  new URL('sky.svg', dir),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 920 650" fill="#e4d8bd">${stars}</svg>`,
)
// A small repeatable grain tile avoids a full-screen SVG noise filter.
function chunk(type, data) {
  const body = Buffer.concat([Buffer.from(type), data])
  let crc = 0xffffffff
  for (const byte of body) {
    crc ^= byte
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0)
  }
  const header = Buffer.alloc(4),
    tail = Buffer.alloc(4)
  header.writeUInt32BE(data.length)
  tail.writeUInt32BE((crc ^ 0xffffffff) >>> 0)
  return Buffer.concat([header, body, tail])
}
const side = 112,
  raw = Buffer.alloc((side + 1) * side),
  ihdr = Buffer.alloc(13)
ihdr.writeUInt32BE(side)
ihdr.writeUInt32BE(side, 4)
ihdr[8] = 8
for (let y = 0; y < side; y++)
  for (let x = 1; x <= side; x++) raw[y * (side + 1) + x] = Math.floor(random() * 256)
writeFileSync(
  new URL('grain.png', dir),
  Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]),
)
