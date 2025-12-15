-- 1. HeroSlide Tablosunu Oluştur (Eğer yoksa)
CREATE TABLE IF NOT EXISTS "HeroSlide" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "description" TEXT,
    "imageUrl" TEXT NOT NULL,
    "link" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HeroSlide_pkey" PRIMARY KEY ("id")
);

-- 2. SystemSetting Tablosunu Oluştur (Eğer yoksa)
CREATE TABLE IF NOT EXISTS "SystemSetting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'text',
    "group" TEXT NOT NULL DEFAULT 'general',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("key")
);

-- 2.1 SystemSetting Tablosunda eksik kolon varsa ekle (Mevcut tablo varsa)
ALTER TABLE "SystemSetting" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "SystemSetting" ADD COLUMN IF NOT EXISTS "type" TEXT NOT NULL DEFAULT 'text';
ALTER TABLE "SystemSetting" ADD COLUMN IF NOT EXISTS "group" TEXT NOT NULL DEFAULT 'general';

-- 3. Product Tablosuna isFeatured Kolonunu Ekle (Eğer yoksa)
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "isFeatured" BOOLEAN NOT NULL DEFAULT false;

-- 4. Varsayılan Bir Slayt Ekle (İsteğe bağlı, test için)
INSERT INTO "HeroSlide" ("title", "subtitle", "description", "imageUrl", "link", "order", "isActive", "updatedAt")
VALUES 
('Hoş Geldiniz', 'Erçağ Kırtasiye', 'Okul ve ofis ihtiyaçlarınız için doğru adres.', 'default-slide.jpg', '/products', 1, true, NOW());

-- 5. Varsayılan Ayarları Ekle
INSERT INTO "SystemSetting" ("key", "value", "description", "type", "group", "updatedAt")
VALUES 
('site_title', 'Erçağ Kırtasiye', 'Site Başlığı', 'text', 'general', NOW()),
('site_phone', '+90 (212) 123 45 67', 'Telefon Numarası', 'text', 'contact', NOW()),
('site_address', 'İstanbul, Türkiye', 'Adres', 'text', 'contact', NOW())
ON CONFLICT ("key") DO NOTHING;
