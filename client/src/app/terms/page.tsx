import React from 'react';

export default function TermsPage() {
    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <h1 className="text-3xl font-bold mb-6">Kullanım Koşulları</h1>

            <div className="prose prose-blue max-w-none">
                <p className="mb-4">
                    Bu web sitesini kullanarak aşağıdaki kullanım koşullarını kabul etmiş sayılırsınız.
                </p>

                <h2 className="text-xl font-semibold mt-6 mb-3">1. Genel Hükümler</h2>
                <p>
                    Erçağ Kırtasiye, bu sitede yer alan bilgileri dilediği zaman değiştirme hakkını saklı tutar.
                </p>

                <h2 className="text-xl font-semibold mt-6 mb-3">2. Hesap Güvenliği</h2>
                <p>
                    Kullanıcı, oluşturduğu hesabın güvenliğinden ve şifresinin gizliliğinden sorumludur. Hesabınız üzerinden yapılan işlemlerden siz sorumlu tutulursunuz.
                </p>

                <h2 className="text-xl font-semibold mt-6 mb-3">3. Sipariş ve İadeler</h2>
                <p>
                    Siparişler, stok durumuna göre işleme alınır. Cayma hakkı ve iade koşulları, Mesafeli Satış Sözleşmesi'nde belirtilen kurallara tabidir.
                </p>

                <h2 className="text-xl font-semibold mt-6 mb-3">4. Fikri Mülkiyet</h2>
                <p>
                    Site içerisindeki tüm görseller, tasarımlar ve içerikler Erçağ Kırtasiye'ye aittir. İzinsiz kullanılamaz.
                </p>
            </div>
        </div>
    );
}
