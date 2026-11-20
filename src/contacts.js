import { CONFIG } from './config.js'

export function whatsappUrl(config = CONFIG, service) {
  const phone = String(config.whatsapp ?? '')
    .trim()
    .replace(/[ ()-]/g, '')
    .replace(/^\+/, '')
  if (!/^[1-9]\d{7,14}$/.test(phone)) return null
  const message = service
    ? config.messages.service.replace('{hizmet}', () => service.title)
    : config.messages.generic
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
}

export function instagramUrl(config = CONFIG) {
  const handle = String(config.instagram ?? '')
    .trim()
    .replace(/^@/, '')
  return /^[\w.]{1,30}$/.test(handle) ? `https://www.instagram.com/${handle}/` : null
}
