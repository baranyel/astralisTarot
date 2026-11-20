// TODO (yayın öncesi): İletişim bilgilerini, tanıtımı, hizmetleri ve süreleri işletme onaylamalıdır.
export const CONFIG = {
  brand: 'Astralis',
  whatsapp: '90XXXXXXXXXX',
  instagram: 'astralis',
  siteUrl: '', // TODO: Yayındaki sitenin tam HTTPS adresi (sosyal paylaşım görseli için).
  description:
    'Astralis’in gök atlasında bir kart seç. Aşk, kariyer ve hayatındaki sorular için tarot açılımlarını keşfet.',
  motto: ['Kartlar konuşmaz.', 'Onları okuyan konuşur.'],
  about: {
    // TODO: Bu taslak metni Astralis’in kendi tanıtımıyla değiştirin.
    draft: true,
    title: 'Astralis üzerine.',
    text: 'Astralis, tarotun görsel dilinden yola çıkan bir okuma alanı. Her açılım, aklındaki soruya başka bir açıdan bakmak için bir davet.',
  },
  process: ['Kartını seç.', 'WhatsApp’tan yaz.', 'Astralis senin için açsın.'],
  // TODO: Dört örnek açılımın kapsamını, teslim biçimini ve sürelerini doğrulayın.
  services: [
    {
      id: 'ask',
      numeral: 'I',
      title: 'Aşk Açılımı',
      emblem: 'heart-moon',
      text: 'İlişkin, kalbin ve önündeki yol üzerine.',
      meta: 'Sesli mesaj · 1 gün içinde',
    },
    {
      id: 'kariyer',
      numeral: 'II',
      title: 'Kariyer Açılımı',
      emblem: 'key',
      text: 'İş, para ve verilecek kararlar üzerine.',
      meta: 'Sesli mesaj · 1 gün içinde',
    },
    {
      id: 'genel',
      numeral: 'III',
      title: 'Genel Açılım',
      emblem: 'eye-star',
      text: 'Önümüzdeki dönemin genel enerjisi.',
      meta: 'Sesli mesaj · 1 gün içinde',
    },
    {
      id: 'soru',
      numeral: 'IV',
      title: 'Tek Soru',
      emblem: 'arrow-star',
      text: 'Aklındaki tek bir soruya net bir bakış.',
      meta: 'Yazılı · aynı gün',
    },
  ],
  messages: {
    service: 'Merhaba Astralis ✦ Sitenden geliyorum, {hizmet} için yazıyorum.',
    generic: 'Merhaba Astralis ✦ Sitenden geliyorum, fal baktırmak istiyorum.',
  },
}
