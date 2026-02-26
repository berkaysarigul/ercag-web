import React from 'react';
import Link from 'next/link';

export default function DistanceSalesPage() {
    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl pt-36 pb-12">
            <h1 className="text-3xl font-bold mb-6">Mesafeli Satış Sözleşmesi</h1>

            <div className="prose prose-green max-w-none bg-white p-8 rounded-2xl border border-gray-100">
                <p className="text-sm text-gray-500 mb-6">Son güncelleme: Şubat 2026</p>

                <h2 className="text-xl font-semibold mt-6 mb-3">1. Taraflar</h2>
                <p><strong>SATICI:</strong></p>
                <p>
                    Unvan: Erçağ Kırtasiye<br />
                    Adres: [Mağaza adresi]<br />
                    Telefon: [Mağaza telefonu]<br />
                    E-posta: [Mağaza e-postası]
                </p>
                <p><strong>ALICI:</strong> Sipariş formunda bilgileri girilen kişi.</p>

                <h2 className="text-xl font-semibold mt-6 mb-3">2. Sözleşmenin Konusu</h2>
                <p>
                    İşbu sözleşmenin konusu, ALICI'nın SATICI'ya ait web sitesinden elektronik ortamda siparişini verdiği
                    ürünlerin satışı ve teslimi ile ilgili olarak 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve
                    Mesafeli Sözleşmeler Yönetmeliği hükümleri gereğince tarafların hak ve yükümlülüklerinin belirlenmesidir.
                </p>

                <h2 className="text-xl font-semibold mt-6 mb-3">3. Sözleşme Konusu Ürün/Hizmet Bilgileri</h2>
                <p>
                    Ürünlerin temel nitelikleri (türü, miktarı, marka/modeli, rengi, adedi, satış fiyatı) SATICI'ya ait
                    web sitesinde yer almaktadır. Ürün fiyatları KDV dahildir. Kampanya süresince indirimli fiyatlar geçerlidir.
                </p>

                <h2 className="text-xl font-semibold mt-6 mb-3">4. Sipariş ve Ödeme</h2>
                <p>
                    Bu site <strong>"Tıkla & Gel Al" (Click & Collect)</strong> modeliyle çalışmaktadır.
                    ALICI, sipariş formunu doldurarak siparişini oluşturur. Ödeme, ürünlerin mağazadan teslim alınması sırasında
                    <strong> nakit veya kredi kartı</strong> ile yapılır. Online ödeme kabul edilmemektedir.
                </p>

                <h2 className="text-xl font-semibold mt-6 mb-3">5. Teslimat Şekli ve Adresi</h2>
                <p>
                    Ürünler, kargo ile gönderilmez. ALICI, siparişini SATICI'nın mağaza adresinden teslim alır.
                    Sipariş hazır olduğunda ALICI'ya SMS ve/veya e-posta ile bildirim gönderilir.
                    ALICI, bildirim tarihinden itibaren <strong>3 (üç) iş günü</strong> içinde ürünlerini teslim almakla yükümlüdür.
                    Bu süre içinde teslim alınmayan siparişler iptal edilebilir.
                </p>

                <h2 className="text-xl font-semibold mt-6 mb-3">6. Cayma Hakkı</h2>
                <p>
                    ALICI, sözleşme konusu ürünün kendisine teslim edildiği tarihten itibaren <strong>14 (on dört) gün</strong> içinde
                    herhangi bir gerekçe göstermeksizin ve cezai şart ödemeksizin cayma hakkını kullanabilir.
                </p>
                <p>Cayma hakkının kullanılması için:</p>
                <ul className="list-disc pl-6">
                    <li>Ürün kullanılmamış ve ambalajı açılmamış olmalıdır.</li>
                    <li>Fatura ile birlikte mağazaya iade edilmelidir.</li>
                    <li>Niteliği itibariyle iade edilemeyecek ürünlerde (açılmış ambalajlı kırtasiye, kesim ürünleri) cayma hakkı kullanılamaz.</li>
                </ul>

                <h2 className="text-xl font-semibold mt-6 mb-3">7. Genel Hükümler</h2>
                <p>
                    ALICI, web sitesinde gösterilen ürünlerin temel nitelikleri, satış fiyatı ve ödeme şekli ile
                    teslimata ilişkin tüm ön bilgileri okuyup bilgi sahibi olduğunu ve elektronik ortamda gerekli
                    teyidi verdiğini kabul ve beyan eder.
                </p>

                <h2 className="text-xl font-semibold mt-6 mb-3">8. Yetkili Mahkeme</h2>
                <p>
                    İşbu sözleşmeden doğan uyuşmazlıklarda Tüketici Hakem Heyetleri ve Tüketici Mahkemeleri yetkilidir.
                    Bakanlıkça her yıl belirlenen parasal sınırlar çerçevesinde ilgili il veya ilçe tüketici hakem heyetleri,
                    bu sınırları aşan uyuşmazlıklarda tüketici mahkemeleri görevlidir.
                </p>

                <h2 className="text-xl font-semibold mt-6 mb-3">9. Yürürlük</h2>
                <p>
                    ALICI, sipariş formunu doldurarak işbu sözleşmenin tüm koşullarını kabul etmiş sayılır.
                    Sözleşme, sipariş tarihinde yürürlüğe girer.
                </p>

                <div className="mt-8 pt-6 border-t border-gray-200">
                    <p className="text-sm text-gray-500">
                        Diğer yasal metinler:{' '}
                        <Link href="/privacy" className="text-brand-600 hover:underline">Gizlilik Politikası (KVKK)</Link> |{' '}
                        <Link href="/terms" className="text-brand-600 hover:underline">Kullanım Koşulları</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
