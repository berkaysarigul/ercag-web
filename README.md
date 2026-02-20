# Erçağ Kırtasiye — Click & Collect E-Ticaret

Erçağ Kırtasiye için geliştirilmiş click & collect e-ticaret sistemi. Müşteriler online sipariş verir, mağazadan teslim alır.

## Teknoloji Stack

| Katman | Teknoloji |
|--------|-----------|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS |
| Backend | Express.js 5, JavaScript, Prisma ORM |
| Veritabanı | PostgreSQL |
| Auth | JWT (localStorage) + 2FA desteği |
| Realtime | Socket.io |
| PWA | next-pwa |

## Kurulum

### 1. Gereksinimler
- Node.js 18+
- PostgreSQL 14+
- npm veya yarn

### 2. Backend (Server)
```bash
cd server
npm install
cp .env.example .env   # .env dosyasını düzenle
npx prisma migrate deploy
npx prisma generate
node index.js
```

### 3. Frontend (Client)
```bash
cd client
npm install
cp .env.example .env.local   # .env.local dosyasını düzenle
npm run dev
```

## Environment Variables

Bkz. [`server/.env.example`](server/.env.example) ve [`client/.env.example`](client/.env.example)

## Veritabanı Komutları

```bash
# Yeni migration oluştur
npx prisma migrate dev --name açıklama

# Schema değişikliğini veritabanına uygula (dev)
npx prisma db push

# Prisma Client'ı yeniden oluştur
npx prisma generate

# Veritabanını görsel olarak inceleme
npx prisma studio
```

## Geliştirme Komutları

```bash
# Backend başlat
cd server && node index.js

# Frontend başlat
cd client && npm run dev

# Backend testleri çalıştır
cd server && npm test
```

## Proje Yapısı

```
ercag-web/
├── server/              # Express.js Backend
│   ├── prisma/          # Veritabanı şeması ve migrasyonlar
│   ├── src/
│   │   ├── controllers/ # Route handler'lar
│   │   ├── middleware/  # Auth, rate limit, upload vb.
│   │   ├── routes/      # Express router tanımları
│   │   ├── services/    # İş mantığı servisleri
│   │   └── utils/       # Yardımcı fonksiyonlar
│   └── uploads/         # Yüklenen görseller
├── client/              # Next.js Frontend
│   ├── public/          # Statik dosyalar
│   └── src/
│       ├── app/         # Next.js App Router
│       ├── components/  # React bileşenleri
│       ├── context/     # React Context'ler
│       └── lib/         # API istemcisi, yardımcılar
└── .github/workflows/   # CI/CD pipeline
```

## Özellikler

- 🛒 Click & Collect sipariş sistemi
- 🔐 JWT tabanlı kimlik doğrulama + 2FA
- 📦 Stok yönetimi ve uyarı sistemi
- 🎫 Kupon sistemi
- ⭐ Ürün değerlendirme sistemi
- 💓 Favoriler (Wishlist)
- 📊 Admin paneli
- 📱 Progressive Web App (PWA)
- 🔔 Realtime bildirimler (Socket.io)
- 📜 Denetim kaydı (Audit log)
