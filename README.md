# Astralis · Tarot

Ziyaretçi gök atlasını açar, on üç kartın bir destede toplanmasını izler ve bir kart seçerek ilgili hizmeti keşfeder. Açılım talepleri WhatsApp veya Instagram üzerinden işletmeye gider. Sitede ödeme alınmaz ve otomatik fal üretilmez.

## Kurulum ve çalıştırma

Node.js 20.19+ veya 22.12+ ve npm gerekir. Proje kökünde çalıştırın.

```bash
npm ci
npm run dev
```

Terminaldeki yerel adresi açın. Üretim çıktısını oluşturmak ve kontrol etmek için aşağıdaki komutları kullanın.

```bash
npm run build
npm run preview
```

Derleme, yayına yüklenebilecek statik dosyaları `dist/` içinde üretir.

## Telefonda deneme

Bilgisayarı ve telefonu aynı yerel ağa bağlayın.

```bash
npm run dev -- --host
```

Telefonda Vite’ın **Network** satırındaki adresi açın. İlk ziyarette ortadaki yıldıza dokunun. Kartları yatay olarak kaydırabilir, ok düğmelerini kullanabilir veya doğrudan bir karta dokunabilirsiniz. Kart açıldığında **Başka kart çek** desteye döndürür. Klavyeyle Tab, Enter, yön tuşları, Home, End ve Escape kullanılabilir.

Hareket sensörü için bazı telefonlarda HTTPS ve kullanıcı izni gerekir. Yerel HTTP üzerinden dokunma, kart seçimi ve kaydırma denenebilir. Ses düğmesi sesi açar. Perdeyi aynı sekmede yeniden görmek için tarayıcının oturum depolamasından `astralis:sky` anahtarını kaldırıp sayfanın kök adresini açın.

## İşletme bilgileri ve yayın öncesi TODO

[Merkezî yapılandırma](src/config.js) marka adını, mottosunu, tanıtımı, süreç adımlarını, hizmetleri, iletişim bilgilerini, paylaşım açıklamasını ve WhatsApp mesaj şablonlarını içerir.

- `whatsapp` alanına ülke koduyla birlikte gerçek işletme numarasını yazın. Baştaki artı işareti, boşluklar, tireler ve parantezler kabul edilir. Yer tutucu numara WhatsApp bağlantısı üretmez. Bu durumda ziyaretçi, yapılandırılmış Instagram hesabına yönlendirilebilir.
- `instagram` alanındaki `astralis` örnek hesabının işletmeye ait olduğunu doğrulayın veya gerçek kullanıcı adıyla değiştirin.
- `services` içindeki dört açılım, açıklamalar, teslim yöntemleri ve süreleri işletme onayı bekleyen taslaklardır. Her kaydın benzersiz bir `id` değeri, bir `numeral`, `title`, `emblem`, `text` ve `meta` alanı bulunur. Kayıt eklemek veya sıralarını değiştirmek kart yelpazesini günceller. Beşten fazla kartta oklar ve kaydırma diğer kartları getirir.
- Kullanılabilir amblemler `heart-moon`, `key`, `eye-star` ve `arrow-star`. Yeni bir amblemi [kart çizimleri](src/cards.js) içindeki `shapes` nesnesine ekleyebilirsiniz.
- `about.text` ve `about.title` alanlarını onaylanmış tanıtımla değiştirip `about.draft` değerini `false` yapın. Taslak durumunda tanıtım bölümünde bir etiket görünür.
- `siteUrl` alanına sitenin yayımlanacağı tam HTTPS adresini yazın ve yeniden derleyin. Böylece Open Graph etiketi, 1200×630 görselin tam adresini içerir.

Geçerli bir telefon numarası girildiğinde her açılımın düğmesi, hizmet adıyla doldurulmuş WhatsApp mesajını açar. Son kart genel iletişim şablonunu kullanır. Telefon numarasının WhatsApp’a kayıtlı olduğunu işletme doğrulamalıdır.

## Uygulama yapısı

| Dosya | Sorumluluk |
| --- | --- |
| `src/main.js` | Perde, oturum, gezinme, masaüstü Lenis ve hareket tercihleri |
| `src/deck.js` | ScrollTrigger ile toplanma, karılma ve yelpaze. Her konum kaydırma ilerlemesinden hesaplanır |
| `src/cards.js` | Klavye ve dokunma, kart seçme ve geri dönme durumları, HTML hizmet yüzleri |
| `src/contacts.js` | Telefon ve kullanıcı adı doğrulama, mesaj kodlama |
| `src/scene.js` | Three.js yıldız alanı, GLSL varak ışığı, uyarlanabilir çözünürlük ve kaynak temizliği |
| `src/sensory.js` | Yön sensörü, işaretçi, parçacık havuzu ve kullanıcı hareketiyle başlatılan Web Audio |
| `src/styles.css` | Tasarım değişkenleri, yerel Bodoni Moda, Spectral ve DM Mono, mobil düzenler |

Kart gravürleri, usturlap, yörüngeler ve kâğıt dokusu [özgün görsel dosyalarda](public/art) bulunur. `npm run art` bu dosyaları aynı başlangıç değerleriyle yeniden üretir. Yazı tipleri ve görseller sitenin kendi dağıtımından yüklenir.

## Testler ve görsel kontrol

```bash
npx playwright install chromium
npm test
```

Test komutu iletişim birim testlerini ve tarayıcı testlerini çalıştırır, gerekirse yerel test sunucusunu başlatır. Kurulu Chrome’u kullanmak için `CHROME_PATH` değişkenine çalıştırılabilir dosyanın yolunu verin. Var olan bir sunucu üzerinde test için `ASTRALIS_BASE_URL` kullanılabilir.

Tüm sahnelerin ekran görüntülerini ve paylaşım görselini yeniden üretmek için bir terminalde `npm run dev -- --port 4173` çalıştırın, ikinci terminalde aşağıdaki komutları girin.

```bash
node scripts/capture.mjs
node scripts/share.mjs
```

Ekran görüntüleri `qa/screenshots/` içine 390×844, 320×700 ve 1440×900 boyutlarında yazılır. Paylaşım görseli `public/og.png` olarak kaydedilir. Görseli değiştirdikten sonra üretim derlemesini yenileyin.

## Netlify veya Vercel’e dağıtım

- **Netlify** üzerinde projeyi Git deposundan içe aktarın. Proje kökünü seçin, derleme komutunu `npm run build`, yayın klasörünü `dist` yapın. Üretim çıktısını elle dağıtmak için derlenmiş `dist` klasörünü de yükleyebilirsiniz. [Netlify’dan depodan dağıtım](https://docs.netlify.com/start/quickstarts/deploy-from-repository/) · [Vite statik dağıtım kılavuzu](https://vite.dev/guide/static-deploy.html)
- **Vercel** üzerinde depoyu yeni proje olarak içe aktarın. Vite önayarını ve proje kökünü seçin. Derleme komutu `npm run build`, çıktı dizini `dist` olmalıdır. [Vite dağıtım kılavuzu](https://vite.dev/guide/static-deploy.html)
- **Özel alan adı** için barındırma panelindeki projenin **Domains** veya **Domain management** bölümüne alan adını ekleyin. DNS sağlayıcınızda panelin bu alan adı için gösterdiği kayıtları girin. Doğrulama ve HTTPS sertifikası hazır olduğunda `siteUrl` alanını güncelleyip yeniden dağıtın. [Netlify alan adları](https://docs.netlify.com/manage/domains/get-started-with-domains/) · [Vercel özel alan adı kurulumu](https://vercel.com/docs/domains/set-up-custom-domain)

## Bilinen sınırlamalar

Hizmet ayrıntıları ve hesap sahipliği yayından önce doğrulanmalıdır. Gerçek bir alıcıya mesaj gönderilmesi ziyaretçinin WhatsApp oturumuna ve onayına bağlıdır.

WebGL 2 kullanılamadığında atlas SVG olarak, seçilebilir kartlar HTML ve CSS ile çalışır. Hareketi azaltma tercihinde sabitlenmiş kaydırma dizisi iki ayrı levha olarak gösterilir. Yön izni, titreşim ve Web Audio desteği tarayıcıya göre değişir. Kartların etkileşimli kullanımı JavaScript gerektirir.

Tarayıcı otomasyonu masaüstü Chrome’da ve iki emüle telefon boyutunda çalıştırılmıştır. Fiziksel Android ve iOS donanımında kare hızı, dokunsal geri bildirim ve yön sensörü ayrıca doğrulanmalıdır.

## Teslim ölçümleri

20 Kasım 2026 tarihli yerel üretim derlemesinde 3 iletişim testi ve 8 Playwright senaryosu geçti. Akışlar iki telefon boyutunda ve masaüstünde denendi. Ayrıca çalışan WebGL bağlamı kaybedildiğinde kart seçimi ve Instagram bağlantısı doğrulandı. Üç boyutta toplam 24 görüntü incelendi.

Lighthouse 12.8.2’nin mobil profili, açılış perdesini geçen `/#gokyuzu` adresinde **performans 98/100**, **erişilebilirlik 100/100**, **LCP 2,0 sn**, **TBT 110 ms** ve **CLS 0,006** ölçtü. Ölçüm yerel Chrome ve simüle mobil ağ/CPU koşullarına aittir. [Ölçüm raporu](qa/lighthouse-mobile.html)
