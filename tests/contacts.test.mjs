import test from 'node:test'
import assert from 'node:assert/strict'
import { CONFIG } from '../src/config.js'
import { instagramUrl, whatsappUrl } from '../src/contacts.js'

test('yer tutucu ve geçersiz telefon numaraları bağlantıya dönüşmez', () => {
  for (const whatsapp of [
    CONFIG.whatsapp,
    '',
    '123',
    null,
    '0049abc',
    '9000000000000000',
    '+90#1234567890',
  ])
    assert.equal(whatsappUrl({ ...CONFIG, whatsapp }), null)
})
test('uluslararası numara ve tüm Türkçe mesajlar kodlanır', () => {
  const config = { ...CONFIG, whatsapp: '+90 (555) 123-45-67' }
  for (const service of [undefined, ...config.services]) {
    const link = new URL(whatsappUrl(config, service))
    assert.equal(link.origin, 'https://wa.me')
    assert.equal(link.pathname, '/905551234567')
    assert.equal(
      link.searchParams.get('text'),
      service
        ? `Merhaba Astralis ✦ Sitenden geliyorum, ${service.title} için yazıyorum.`
        : config.messages.generic,
    )
  }
})
test('Instagram kullanıcı adları doğrulanır', () => {
  assert.equal(
    instagramUrl({ ...CONFIG, instagram: '@astralis' }),
    'https://www.instagram.com/astralis/',
  )
  for (const instagram of ['', null, 'a/b', 'x?y', 'http://örnek.com'])
    assert.equal(instagramUrl({ ...CONFIG, instagram }), null)
})
