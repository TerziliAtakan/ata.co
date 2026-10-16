# ata.co — Kurulum ve kullanım rehberi

Bu proje, ata.co sitesinin kendisidir: tasarım, üç dil (TR/EN/RU), ilanlar, blog, formlar ve otomatik yayın.

## Nasıl çalışıyor (tek bakışta)

```
Telefon / bilgisayar
   │  İlan veya blog eklersiniz (Pages CMS paneli, Türkçe)
   ▼
GitHub (sitenin dosyaları burada durur)
   │  Her kayıtta otomatik olarak:
   │   1. Yeni Türkçe metinler DeepL ile İngilizce ve Rusçaya çevrilir
   │   2. Fotoğraflar küçültülür, site oluşturulur
   ▼
GitHub Pages → siteniz yayında (2–3 dakika içinde)

Ziyaretçi formu doldurur → Google E-Tablo'ya satır düşer + size e-posta gelir
```

**Maliyet:** GitHub Pages, Pages CMS, Google E-Tablo ve DeepL API Free ücretsiz planlarla çalışır.
DeepL'in ücretsiz planında aylık karakter kotası var; güncel limiti DeepL hesap sayfanızda kontrol edin.
Tek zorunlu masraf alan adıdır (yıllık).

---

## Bir kerelik kurulum (yaklaşık 45 dakika)

### 1. GitHub hesabı ve depo
1. github.com'da ücretsiz hesap açın.
2. Sağ üstte **+ → New repository**. Ad: `ataco-site`. **Public** seçin (ücretsiz yayın için gerekli). Başka bir şey işaretlemeden **Create repository**.
3. Proje dosyalarını yükleyin. İki yol var:
   - **Kolay yol:** Depo adresini Claude'a verin; dosyaları sizin için yükler.
   - **Kendiniz:** Depoda **uploading an existing file** bağlantısına tıklayın ve bu klasörün içindekileri sürükleyin.
     Mac'te gizli dosyaları görmek için Finder'da `Cmd + Shift + .` tuşlarına basın.
     `.github` ve `.pages.yml` de yüklenmeli.

### 2. Yayını açın
Depoda **Settings → Pages → Build and deployment → Source: GitHub Actions**.

### 3. Otomatik çeviri (DeepL)
1. deepl.com/pro-api adresinden **DeepL API Free** hesabı açın. Kart bilgisi isteyebilir; ücretsiz planda ücret alınmaz.
2. Hesap sayfasından **API anahtarını** kopyalayın.
3. GitHub deposunda **Settings → Secrets and variables → Actions → New repository secret**.
   Ad: `DEEPL_API_KEY`, değer: anahtarınız.

Anahtar yoksa site yine yayınlanır; İngilizce ve Rusça sayfalarda ilan ve blog metinleri Türkçe görünür.

### 4. Formlar → Google E-Tablo
1. Google Drive'da yeni bir E-Tablo açın, adını `ata.co Talepler` koyun.
2. **Uzantılar → Apps Script**. Açılan sayfadaki kodu silip `apps-script/Code.gs` dosyasının içeriğini yapıştırın. Kaydedin.
3. **Dağıt → Yeni dağıtım → Tür: Web uygulaması**.
   - Şu kullanıcı olarak yürüt: **Ben**
   - Erişimi olanlar: **Herkes**
4. Google izin isteyecek; hesabınızı seçip izin verin.
5. Verilen **Web uygulaması URL'sini** kopyalayın. Bir sonraki adımda panele yapıştıracaksınız.

Her yeni talep E-Tablo'da satır olarak görünür. "Durum" sütununu kendi takibiniz için kullanabilirsiniz (Yeni / Arandı / Görüşme / Kapandı).

### 5. Yönetim paneli (Pages CMS)
1. **app.pagescms.org** adresine gidin → **GitHub ile giriş yapın** → `ataco-site` deposunu seçin.
2. **Site ayarları**:
   - **Form adresi** alanına 4. adımdaki URL'yi yapıştırın.
   - Giriş fotoğrafı, portre ve Kuzey Kıbrıs posterini yükleyin.
   - Tanıtım videosu linkini ekleyin.
3. **İlanlar** bölümünde üç **örnek ilanı silin** ve gerçek ilanlarınızı ekleyin.
4. **Blog** bölümünde **örnek yazıyı silin**.

Örnekler zaten canlı sitede görünmez, yalnızca önizlemede görünür. Yine de panel temiz kalsın diye silin.

### 6. İlk yayını kontrol edin
Depoda **Actions** sekmesi → en üstteki çalışma yeşil tik alınca site yayındadır:
`https://KULLANICI-ADINIZ.github.io/ataco-site/`

### 7. Alan adını bağlayın (alan adını aldıktan sonra)
1. Alan adını aldığınız firmanın DNS ayarlarında:
   - `A` kayıtları (@): `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - `CNAME` kaydı (www): `KULLANICI-ADINIZ.github.io`
2. Panelde **Site ayarları → Alan adı** alanına alan adınızı yazın (örn. `ornek.com`).
3. GitHub'da **Settings → Pages → Custom domain** alanına aynı adı yazın. Doğrulama bitince **Enforce HTTPS** kutusunu işaretleyin.

DNS değişikliğinin yayılması birkaç saat sürebilir.

---

## Günlük kullanım

### Yeni ilan (telefondan 5 dakika)
1. Panel → **İlanlar → Add an entry**.
2. Alanları doldurun:
   - Ad, kategori, konum, oda, m², fiyat
   - Tek cümlelik öne çıkan özellik
   - Açıklama (Türkçe)
   - Fotoğraflar (ilk fotoğraf kapak olur)
   - Video linki
3. Ana sayfada görünsün istiyorsanız **Ana sayfada öne çıkar** kutusunu işaretleyin. En fazla 3 ilan; **Sıra** alanı hangisinin önce görüneceğini belirler.
4. **Save**. Yaklaşık 2–3 dakika içinde üç dilde yayında olur.

**Açıklama için iş akışı:** Notlarınızı ve fotoğraflarınızı Claude'a verin, açıklamayı taslak olarak alın, kendi sesinize göre düzenleyip panele yapıştırın.

**Satılan veya kiralanan ilan:** Silmeyin. **Durum → Satıldı / Kiralandı** yapın. İlan etiketle listenin sonunda kalır ve geçmiş işlerinizi gösterir.

### Yeni blog yazısı
Panel → **Blog → Add an entry** → Türkçe yazın → **Save**. İngilizce ve Rusça versiyonlar otomatik oluşur ve okuyucuya "otomatik çevrilmiştir" notu gösterilir.
Henüz yayınlamak istemediğiniz yazılarda **Taslak** kutusunu işaretleyin.

### Bir çeviriyi elle düzeltmek
Çeviriler `content/translations/` klasöründe durur. GitHub'da ilgili dosyayı açıp metni düzeltebilirsiniz.
Türkçe metni yeniden değiştirene kadar düzeltmeniz korunur.

---

## Bilinen sınırlar (sonraki sürüm için)
- **SEO:** İlan ve blog yazıları henüz kendi ayrı adreslerine sahip değil. Google ana sayfayı üç dilde indeksler, ama her ilanı tek tek indekslemez. Blog trafiği önemli hale geldiğinde ilk yapılacak iş bu.
- **Rusça kontrol:** Rusça çeviriler otomatik. Ana sayfa metinlerini yayından önce anadili Rusça olan birine okutun.
- **Gizlilik metni:** Gizlilik sayfasındaki metin bir taslaktır. Formlar canlıya geçmeden önce avukatınıza onaylatın.
