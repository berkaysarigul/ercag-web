// server/seedMockData.js
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const CATEGORIES = [
    { name: 'Kırtasiye', children: ['Kalemler', 'Defterler', 'Silgi & Kalemtıraş', 'Boya & Çizim'] },
    { name: 'Ofis', children: ['Kağıt Ürünleri', 'Dosyalama', 'Masaüstü Gereçleri'] },
    { name: 'Sanat & Hobi', children: ['Akrilik Boyalar', 'Tuval & Şövale', 'Fırçalar'] }
];

const BRANDS = [
    'Faber-Castell', 'Rotring', 'Pritt', 'Lamy', 'Mopak', 'Gıpta',
    'Bic', 'Pilot', 'Edding', 'Stabilo', 'Uni-ball', 'Sharpie'
];

// Seed verileri yardımcı fonksiyonu
const randomBrandId = (brands) => brands[Math.floor(Math.random() * brands.length)].id;
const randomCatId = (leafCats) => leafCats[Math.floor(Math.random() * leafCats.length)].id;

const PRODUCTS_MOCK = [
    // Kalemler & Yazı Gereçleri
    { name: "Faber-Castell Grip 2011 Versatil Kalem 0.7mm Gümüş", price: 145.00, desc: "Ergonomik üçgen gövde, yorulmadan yazım imkanı sağlayan yumuşak tutuş alanı.", category: "Kalemler", brand: "Faber-Castell" },
    { name: "Rotring Tikky Versatil Kalem 0.5mm Bordo", price: 85.50, desc: "Klasik Rotring tasarımı, metal klips ve mekanizma. Teknik çizim ve günlük yazı için ideal.", category: "Kalemler", brand: "Rotring" },
    { name: "Pilot V5 Hi-Tecpoint İğne Uçlu Kalem 0.5mm Siyah", price: 65.00, compareAtPrice: 80.00, desc: "Sıvı mürekkep teknolojisi ile kesintisiz yazım. Penceresinden mürekkep seviyesi görünür.", category: "Kalemler", brand: "Pilot" },
    { name: "Lamy Safari Dolma Kalem Mat Siyah", price: 850.00, compareAtPrice: 1050.00, desc: "Sağlam plastik gövde, esnek krom klips. M çelik uçlu ikonik tasarım.", category: "Kalemler", brand: "Lamy", isFeatured: true },
    { name: "Stabilo Boss Original Fosforlu Kalem 4'lü Set", price: 120.00, desc: "4 saat kurumaya karşı koruma. 2mm ve 5mm iki farklı çizgi kalınlığı. Sarı, yeşil, turuncu, pembe.", category: "Kalemler", brand: "Stabilo" },

    // Defterler
    { name: "Mopak Üniversite A4 Çizgili Defter 96 Yaprak PP Kapak", price: 45.00, compareAtPrice: 55.00, desc: "Neon renkli esnek PP kapak. %100 selüloz beyaz kağıt, 70gr.", category: "Defterler", brand: "Mopak", isFeatured: true },
    { name: "Gıpta Smart Termo Deri Kapak A5 Çizgisiz Defter Siyah", price: 180.00, desc: "Yumuşak termo deri kapak. Ivory kağıt, kurdele ayraç ve lastikli muhafaza.", category: "Defterler", brand: "Gıpta" },
    { name: "Mopak Kraft Kapak Çizgili Spiralli Harita Metod Defteri 100Y", price: 38.00, desc: "Dayanıklı kraft spiral tel kapak. Geri dönüştürülmüş malzemeden üretilmiştir.", category: "Defterler", brand: "Mopak" },

    // Silgi & Kalemtıraş
    { name: "Faber-Castell Sınav Silgisi Toz Bırakmaz (Büyük Boy)", price: 12.50, compareAtPrice: 15.00, desc: "İz bırakmadan siler. Toz toplanma özelliği ile temiz kullanım sağlar.", category: "Silgi & Kalemtıraş", brand: "Faber-Castell" },
    { name: "Rotring Çift Delikli Metal Hazneli Kalemtıraş", price: 75.00, desc: "Kırılmaz metal gövde. Standart ve jumbo boy kalemler için uygun iki delik.", category: "Silgi & Kalemtıraş", brand: "Rotring" },

    // Boya & Çizim (Kırtasiye ve Sanat)
    { name: "Faber-Castell 24'lü Kuru Boya Seti + Hediye Kalemtıraş", price: 165.00, desc: "Canlı ve parlak renkler. SV uç yapıştırma sistemi ile uç kırılmasına karşı direnç.", category: "Boya & Çizim", brand: "Faber-Castell", isFeatured: true },
    { name: "Pritt 43gr Jumbo Stick Yapıştırıcı", price: 42.00, compareAtPrice: 50.00, desc: "Kağıt, karton, kumaş ve fotoğraflar için güvenli ve temiz yapıştırma. Zehirsizdir.", category: "Silgi & Kalemtıraş", brand: "Pritt" },

    // Ofis - Kağıt & Dosyalama
    { name: "Mopak Premium A4 Fotokopi Kağıdı 80g 500 Yaprak", price: 135.00, desc: "Çift taraflı baskıya uygun yüksek beyazlıkta ekstra kalite fotokopi kağıdı.", category: "Kağıt Ürünleri", brand: "Mopak", isFeatured: true },
    { name: "Gıpta Şeffaf Çıtçıtlı Evrak Dosyası A4 12'li Paket", price: 95.00, desc: "Kalın PVC malzeme. Belgelerinizi nem, toz ve kıvrılmalardan korur.", category: "Dosyalama", brand: "Gıpta" },
    { name: "Edding 3000 Kalıcı Markör Kalem Siyah M Uç", price: 48.00, desc: "Karton, metal, plastik ve cam dahil hemen her yüzeyde kalıcı yazı yazar.", category: "Masaüstü Gereçleri", brand: "Edding" },
    { name: "Post-it Z-Not Küpü Sarı 100 Yaprak", price: 28.50, desc: "Kendinden yapışkanlı kolay kopan yapraklar. Not almak ve hatırlatmak için birebir.", category: "Masaüstü Gereçleri", brand: "Mopak" }, // Mopak assigned as surrogate brand

    // Sanat & Hobi
    { name: "Pebeo Studio Akrilik Boya Seti 12x20ml", price: 245.00, desc: "Mat ve ipeksi bitişli akrilik boyalar. Tuval, karton, metal ve ahşap için uygun.", category: "Akrilik Boyalar", brand: "Faber-Castell" }, // Placeholder brand
    { name: "35x50 cm Pamuklu Sanatsal Boş Tuval", price: 110.00, desc: "%100 pamuk kalın gerdirme tuval bezi. 3.5cm şase. Yağlıboya ve akrilik boyaya uygundur.", category: "Tuval & Şövale", brand: "Gıpta" }
];

async function main() {
    console.log('🧹 Eski veriler temizleniyor...');
    // Core records
    await prisma.orderItemVariant.deleteMany();
    await prisma.cartItemVariant.deleteMany();
    await prisma.variantAttribute.deleteMany();
    await prisma.productVariant.deleteMany();
    // Related to product
    await prisma.productImage.deleteMany();
    await prisma.stockMovement.deleteMany();
    await prisma.stockAlert.deleteMany();
    await prisma.review.deleteMany();
    await prisma.loyaltyHistory.deleteMany();

    // Features
    await prisma.spinCode.deleteMany();
    await prisma.spinPrize.deleteMany();
    await prisma.spinWheel.deleteMany();

    // Core records - phase 2
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.cartItem.deleteMany();
    await prisma.cart.deleteMany();
    await prisma.product.deleteMany();

    // Master data
    await prisma.attributeValue.deleteMany();
    await prisma.attributeType.deleteMany();
    await prisma.category.deleteMany();
    await prisma.brand.deleteMany();
    await prisma.branch.deleteMany();

    console.log('✨ Yeni kategoriler oluşturuluyor...');
    const insertedLeafCats = [];
    for (const cat of CATEGORIES) {
        const parent = await prisma.category.create({
            data: { name: cat.name }
        });

        for (const childName of cat.children) {
            const child = await prisma.category.create({
                data: {
                    name: childName,
                    parentId: parent.id
                }
            });
            insertedLeafCats.push({ id: child.id, name: childName, parentName: parent.name });
        }
    }

    console.log('✨ Markalar oluşturuluyor...');
    const insertedBrands = [];
    for (const name of BRANDS) {
        const brand = await prisma.brand.create({
            data: { name, isActive: true }
        });
        insertedBrands.push(brand);
    }

    console.log('🛍️ Ürünler ekleniyor...');
    let productCount = 0;

    // Default image
    const DEFAULT_IMG = "https://images.unsplash.com/photo-1542887800-faca0261c9e1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";

    for (const p of PRODUCTS_MOCK) {
        const brandObj = insertedBrands.find(b => b.name === p.brand);
        const catObj = insertedLeafCats.find(c => c.name === p.category);

        await prisma.product.create({
            data: {
                name: p.name,
                description: p.desc,
                price: p.price,
                compareAtPrice: p.compareAtPrice || null,
                stock: 200,
                categoryId: catObj ? catObj.id : insertedLeafCats[0].id,
                brandId: brandObj ? brandObj.id : insertedBrands[0].id,
                sku: `SKU-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
                image: DEFAULT_IMG,
                isFeatured: p.isFeatured || false
            }
        });
        productCount++;
    }

    // Add some random generic products to fill the store
    for (let i = 1; i <= 15; i++) {
        const isDisc = Math.random() > 0.6;
        const price = Math.floor(Math.random() * 500) + 50;

        await prisma.product.create({
            data: {
                name: `Erçağ Özel Seçki ${i} Kataloğu`,
                description: `Güzel ve uzun ömürlü bir ofis/kırtasiye ürünü. Serinin ${i}. özel üretim modeli.`,
                price: isDisc ? price * 0.8 : price,
                compareAtPrice: isDisc ? price : null,
                stock: Math.floor(Math.random() * 100) + 10,
                categoryId: randomCatId(insertedLeafCats),
                brandId: randomBrandId(insertedBrands),
                sku: `GEN-${i}00X`,
                image: "https://images.unsplash.com/photo-1585336261022-680e295ce3fe?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
                isFeatured: Math.random() > 0.8
            }
        });
        productCount++;
    }

    console.log(`✅ Başarılı! TOPLAM: ${CATEGORIES.length} ana kategori, ${BRANDS.length} marka, ${productCount} ürün oluşturuldu.`);
}

main()
    .catch(e => {
        require('fs').writeFileSync('error.txt', e.stack || e.toString());
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
