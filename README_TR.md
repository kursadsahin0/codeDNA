# CodeDNA

CodeDNA, bir yazılım deposunun yapısını, dosyalar arasındaki bağımlılıkları ve değişikliklerin olası etkilerini incelemek için geliştirilmiş bir çalışma alanıdır. Herkese açık bir GitHub deposu bağlantısı vererek analiz başlatabilirsiniz. Hesap bağlama ve özel depo erişimi şu anda devre dışıdır.

## Özellikler

- Herkese açık GitHub depolarında JavaScript ve TypeScript kaynaklarını analiz etme
- Dosya, modül, fonksiyon, sınıf ve içe aktarma ilişkilerini mimari grafikte keşfetme
- Değiştirilecek bir dosyanın statik içe aktarma ilişkilerine göre olası etkilerini inceleme
- Döngüsel bağımlılıkları, çözümlenemeyen içe aktarmaları, paylaşılan dosyaları ve ayrıştırma uyarılarını görme
- Varsayılan daldaki son commit özetlerini inceleme
- Açık ve koyu tema, arama, grafik filtreleri ve klavye ile gezinme

Analiz sonuçları geçerli tarayıcı sekmesinin oturum depolamasında tutulur; sunucuya kaydedilmez ve başka cihazlarla eşitlenmez.

## Gereksinimler

- Node.js 20.9 veya üzeri
- pnpm 10 veya üzeri

## Yerel geliştirme

```bash
corepack pnpm install
cp .env.example .env.local
corepack pnpm dev
```

Uygulama varsayılan olarak `http://localhost:3000` adresinde açılır. Herkese açık depo analizi için GitHub hesabı veya Supabase ayarı gerekmez. Gerekli sunucu değişkenleri ve GitHub entegrasyonu hakkında ayrıntılar için [İngilizce README](README.md) dosyasına bakın.

## Kullanım

1. `/repositories` sayfasını açın.
2. `https://github.com/sahip/depo` biçiminde herkese açık bir GitHub depo bağlantısı girin.
3. Analizin tamamlanmasını bekleyin; sonuçlar çalışma alanına yüklenir.
4. `/workspace`, `/architecture`, `/impact`, `/insights` ve `/history` sayfalarından depo verilerini inceleyin.

`/demo` yolu depo seçme sayfasına yönlendirir. Uygulamanın canlılık kontrolü `/api/health` adresindedir.

## Analiz kapsamı ve sınırlar

Herkese açık bağlantı analizi, varsayılan dalın kaynak ağacından en fazla 24 JavaScript/TypeScript dosyasını işler. Dosya başına ve toplam veri boyutları da sunucu tarafında sınırlandırılır. Büyük depolarda sonuçlar örneklem içerebilir; atlanan dosyalar ve ayrıştırma uyarıları çalışma alanında gösterilir.

Analiz statiktir: depo kodu çalıştırılmaz, bağımlılıklar kurulmaz. Dinamik içe aktarmalar, yansıma, üretilmiş kod, çalışma zamanı yönlendirmesi ve dosyalar arası çağrı çözümlemesi tümüyle kapsanmaz. Değişiklik etkisi bir inceleme yardımcısıdır; hata olasılığı tahmini değildir. Geçmiş mimari grafikleri yalnızca daha önce kaydedilmiş analizler için mevcuttur.

## Kullanışlı komutlar

| Komut                            | Açıklama                                                     |
| -------------------------------- | ------------------------------------------------------------ |
| `corepack pnpm dev`              | Geliştirme sunucusunu başlatır                               |
| `corepack pnpm build`            | Üretim derlemesi oluşturur                                   |
| `corepack pnpm start`            | Üretim sunucusunu başlatır                                   |
| `corepack pnpm lint`             | ESLint denetimini çalıştırır                                 |
| `corepack pnpm typecheck`        | TypeScript tür denetimini çalıştırır                         |
| `corepack pnpm test:github`      | GitHub güvenlik testlerini çalıştırır                        |
| `corepack pnpm test:analysis`    | Analiz ve değişiklik etkisi testlerini çalıştırır            |
| `corepack pnpm test:integration` | Yapılandırılmışsa Supabase entegrasyon testlerini çalıştırır |
| `corepack pnpm test:e2e`         | Playwright uçtan uca testlerini çalıştırır                   |

## Proje yapısı

```text
src/app/                 Next.js sayfaları ve API uçları
src/components/          Arayüz ve çalışma alanı bileşenleri
src/lib/analysis/        JavaScript/TypeScript statik analiz motoru
src/lib/impact/          Bağımlılık ve değişiklik etkisi hesapları
src/lib/github/          GitHub istemcisi, güvenlik ve sunucu veri erişimi
supabase/migrations/     İsteğe bağlı GitHub entegrasyon şeması
scripts/                 Arka plan analiz işçisi
tests/                   Birim, entegrasyon ve uçtan uca testler
docs/                    Mimari kararlar ve ek belgeler
```

## Güvenlik ve entegrasyon notu

Herkese açık analiz yalnızca GitHub'ın sabit API ve ham dosya sunucularına istek gönderir. Kaynak kod çalıştırılmaz. GitHub App, Supabase ve özel depo işçisi uygulama kodunda bulunsa da kullanıcıya açık hesap bağlama akışı şu anda kapalıdır. Bu entegrasyonu etkinleştirme adımları, ortam değişkenleri ve veritabanı geçişleri için [İngilizce README'deki kurulum bölümünü](README.md#github-app-and-supabase-setup) izleyin.
