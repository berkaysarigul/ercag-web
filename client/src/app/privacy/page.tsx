'use client';
import React from 'react';
import { useSettings } from '@/context/SettingsContext';

export default function PrivacyPage() {
    const { settings } = useSettings();
    const companyName = settings.site_title || 'Erçağ Kırtasiye';

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <h1 className="text-3xl font-bold mb-6">Gizlilik Politikası (KVKK)</h1>

            <div className="prose prose-blue max-w-none">
                <p className="mb-4">
                    Bu Gizlilik Politikası, {companyName} ("Şirket") tarafından işletilen web sitesi ("Site") üzerinden toplanan kişisel verilerinizin nasıl kullanıldığını, saklandığını ve korunduğunu açıklamaktadır.
                    6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca, veri sorumlusu sıfatıyla kişisel verilerinizi aşağıda belirtilen çerçevede işlemekteyiz.
                </p>

                <h2 className="text-xl font-semibold mt-6 mb-3">1. Toplanan Kişisel Veriler</h2>
                <p>
                    Hizmetlerimizden yararlanmanız sırasında aşağıdaki verileriniz toplanabilir:
                </p>
                <ul className="list-disc pl-6 mb-4">
                    <li>Kimlik Bilgileri (Ad, Soyad)</li>
                    <li>İletişim Bilgileri (Telefon, E-posta, Adres)</li>
                    <li>İşlem Güvenliği Bilgileri (IP adresi, log kayıtları)</li>
                    <li>Müşteri İşlem Bilgileri (Sipariş geçmişi, talep ve şikayetler)</li>
                </ul>

                <h2 className="text-xl font-semibold mt-6 mb-3">2. Verilerin İşlenme Amacı</h2>
                <p>
                    Kişisel verileriniz aşağıdaki amaçlarla işlenmektedir:
                </p>
                <ul className="list-disc pl-6 mb-4">
                    <li>Siparişlerin alınması ve teslim edilmesi</li>
                    <li>Üyelik işlemlerinin gerçekleştirilmesi</li>
                    <li>İletişim faaliyetlerinin yürütülmesi</li>
                    <li>Yasal yükümlülüklerin yerine getirilmesi</li>
                    <li>Hizmet kalitesinin artırılması</li>
                </ul>

                <h2 className="text-xl font-semibold mt-6 mb-3">3. Verilerin Aktarılması</h2>
                <p>
                    Kişisel verileriniz, yasal zorunluluklar haricinde üçüncü kişilerle paylaşılmamaktadır. Ancak, sipariş teslimatı için gerekirse kargo firmaları ile veya ödeme işlemleri için ödeme kuruluşları ile paylaşılabilir.
                </p>

                <h2 className="text-xl font-semibold mt-6 mb-3">4. Haklarınız</h2>
                <p>
                    KVKK'nın 11. maddesi uyarınca şunları talep etme hakkına sahipsiniz:
                </p>
                <ul className="list-disc pl-6 mb-4">
                    <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
                    <li>İşlenmişse buna ilişkin bilgi talep etme</li>
                    <li>Verilerin silinmesini veya yok edilmesini isteme</li>
                    <li>Zararın giderilmesini talep etme</li>
                </ul>
                <p>
                    Talepleriniz için bizimle iletişime geçebilirsiniz.
                </p>
            </div>
        </div>
    );
}
