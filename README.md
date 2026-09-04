# alisvo.dev — Senior Database Administrator (DBA) Portföy ve Blog

Ali Sağırvelioğulları için hazırlanmış; modern, ultra hızlı, minimal ve teknik odaklı kişisel web sitesi ve blog platformu.

## 🚀 Kullanılan Teknolojiler

- **Framework**: [Astro 5](https://astro.build/) (Static Site Generation - `output: 'static'`)
- **Stil & Tasarım**: [Tailwind CSS](https://tailwindcss.com/) & [@tailwindcss/typography](https://tailwindcss.com/docs/typography-plugin)
- **İçerik Yönetimi**: Astro Content Collections & Markdown / MDX
- **Kod Renklendirme**: Dahili Shiki (SQL, Bash, Python, YAML destekli `github-dark-dimmed` teması)
- **Tema Desteği**: Sıfır FOUC (Flash of Unstyled Content) ile kusursuz **Dark / Light** mod
- **SEO & Dağıtım**: Otomatik Sitemap, OpenGraph etiketleri, `/rss.xml` beslemesi ve GitHub Actions CI/CD

---

## 📂 Proje Dizin Yapısı

```text
alisvo_dev_astro/
├── .github/
│   └── workflows/
│       └── deploy.yml          # Otomatik GitHub Pages deploy pipeline
├── public/
│   ├── favicon.svg             # Özel veritabanı SVG favicon
│   └── robots.txt              # Arama motoru direktifleri ve sitemap linki
├── src/
│   ├── components/
│   │   ├── ArticleCard.astro   # Blog makale önizleme kartı
│   │   ├── BaseHead.astro      # SEO, OpenGraph ve tema kontrol scripti
│   │   ├── Footer.astro        # Alt bilgi ve canlı sistem durum göstergesi
│   │   ├── Header.astro        # Responsive navigasyon ve tema butonu
│   │   ├── TechBadge.astro     # Veritabanı ve yetkinlik rozetleri
│   │   └── ThemeToggle.astro   # Açık/Koyu tema değiştirici
│   ├── content/
│   │   └── blog/               # Markdown formatında DBA makaleleri
│   │       ├── postgresql-explain-analyze-optimizasyon.md
│   │       └── veritabani-felaket-kurtarma-rpo-rto.md
│   ├── layouts/
│   │   ├── BaseLayout.astro    # Temel HTML iskeleti ve ambient ışıklandırma
│   │   └── BlogPostLayout.astro# Makale okuma düzeni ve kod kopyalama butonu
│   ├── pages/
│   │   ├── about.astro         # Kariyer yolculuğu, felsefe ve sertifikalar
│   │   ├── blog/
│   │   │   ├── index.astro     # Makale listesi ve etiket filtreleme
│   │   │   └── [...slug].astro # Dinamik makale detay sayfası
│   │   ├── contact.astro       # İletişim kartı ve danışmanlık notları
│   │   ├── index.astro         # Karşılama, metrikler ve uzmanlık alanları
│   │   └── rss.xml.ts          # Dinamik RSS akışı (/rss.xml)
│   ├── styles/
│   │   └── global.css          # Tailwind direktifleri, ızgara arkaplanı ve stiller
│   └── content.config.ts       # Astro 5 koleksiyon şemaları (Zod doğrulamalı)
├── astro.config.mjs            # Astro konfigürasyonu
├── tailwind.config.mjs         # Tailwind tema ve tipografi ayarları
├── tsconfig.json               # TypeScript yapılandırması
└── package.json
```

---

## 🛠️ Yerel Geliştirme (Local Development)

### 1. Gereksinimler
- Node.js (v18.17.1 veya v20+ / v22+)
- npm veya pnpm / yarn

### 2. Bağımlılıkları Yükleme
```bash
npm install
```

### 3. Geliştirme Sunucusunu Başlatma
```bash
npm run dev
```
Sunucu başladığında tarayıcınızdan `http://localhost:4321` adresine gidin.

### 4. Statik Çıktı Oluşturma (Build)
```bash
npm run build
```
Oluşturulan optimize edilmiş tüm statik HTML, CSS ve JS dosyaları `dist/` klasörüne aktarılır.

### 5. Statik Önizleme
```bash
npm run preview
```

---

## ✍️ Yeni Makale Ekleme

Yeni bir makale yayınlamak için `src/content/blog/` dizini altına yeni bir `.md` veya `.mdx` dosyası oluşturmanız yeterlidir:

```markdown
---
title: "PostgreSQL 17 ile Gelen Yenilikler ve DBA Gözüyle İnceleme"
description: "PostgreSQL 17 sürümündeki bellek yönetimi iyileştirmeleri, JSON_TABLE desteği ve logical replication geliştirmeleri."
pubDate: 2026-09-10
tags: ["PostgreSQL", "Database", "Release"]
featured: true
readingTime: "7 dk okuma"
---

Makalenizin içeriğini buraya Markdown formatında yazabilirsiniz...
```

---

## 🚢 Dağıtım (Deployment)

### GitHub Pages ile Otomatik Dağıtım
Projeniz GitHub'a yüklendiğinde `.github/workflows/deploy.yml` dosyası otomatik olarak devreye girer.
GitHub deponuzun ayarlarından:
1. **Settings** -> **Pages** sekmesine gidin.
2. **Build and deployment** -> **Source** seçeneğini **GitHub Actions** olarak ayarlayın.
3. `main` branch'ine yapacağınız her `git push` işlemi sonrasında siteniz dakikalar içinde canlıya alınacaktır.

### Cloudflare Pages ile Dağıtım
1. Cloudflare Dashboard -> **Workers & Pages** -> **Create application** -> **Pages** sekmesine gidin.
2. GitHub reponuzu bağlayın.
3. Build ayarları:
   - **Framework preset**: `Astro`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
4. Kaydedip deploy edin.

---

## 📄 Lisans
Bu proje kişisel portföy ve açık kaynak paylaşım amacıyla oluşturulmuştur.
Tüm hakları Ali Sağırvelioğulları'na aittir.
