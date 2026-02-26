'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { CheckCircle, Store } from 'lucide-react';

function SuccessContent() {
    const searchParams = useSearchParams();
    const code = searchParams.get('code');
    const id = searchParams.get('id');
    const amount = searchParams.get('amount');

    return (
        <div className="container text-center pt-36 pb-16">
            <div className="bg-white border rounded-2xl shadow-sm max-w-2xl mx-auto p-12">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle size={48} className="text-green-500" />
                </div>
                <h1 className="text-3xl mb-4 text-primary font-bold">Siparişiniz Alındı!</h1>
                <p className="text-lg text-gray-500 mb-8">
                    Siparişiniz başarıyla oluşturuldu. Ekibimiz en kısa sürede hazırlamaya başlayacak.
                    <br />
                    Sipariş durumunu "Siparişlerim" sayfasından takip edebilirsiniz.
                </p>

                {code && (
                    <div className="bg-gray-50 p-8 rounded-xl mb-8 border border-gray-100">
                        <div className="grid grid-cols-2 gap-4 text-left mb-6 border-b border-gray-200 pb-6">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Sipariş No</p>
                                <p className="font-bold text-gray-900 text-lg">#{id}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-gray-500 mb-1">Tutar</p>
                                <p className="font-bold text-primary text-2xl">{Number(amount).toFixed(2)} ₺</p>
                            </div>
                        </div>

                        <p className="text-sm text-gray-500 mb-2">Teslimat Kodunuz:</p>
                        <p className="text-5xl font-bold tracking-widest text-primary m-0">{code}</p>
                        <p className="text-sm text-gray-500 mt-4">
                            Ürünlerinizi teslim alırken bu kodu mağaza görevlisine iletiniz.
                        </p>
                        <div className="mt-6 p-4 bg-primary/5 text-primary text-sm rounded-lg flex items-start gap-3 text-left">
                            <Store size={20} className="text-primary mt-0.5 shrink-0" />
                            <span className="leading-relaxed">Ödemenizi ürünlerinizi mağazadan teslim alırken <strong>Nakit</strong> veya <strong>Kredi Kartı</strong> ile yapabilirsiniz.</span>
                        </div>
                    </div>
                )}

                <div className="flex gap-4 justify-center mt-8">
                    <Link href="/" className="px-8 py-3 bg-primary hover:bg-[#1a332a] text-white font-bold rounded-xl transition-colors shadow-md hover:shadow-lg inline-flex items-center justify-center">
                        Ana Sayfaya Dön
                    </Link>
                    <Link href="/products" className="px-8 py-3 bg-white hover:bg-gray-50 text-gray-800 font-bold rounded-xl transition-colors shadow-sm border border-gray-200 inline-flex items-center justify-center">
                        Alışverişe Devam Et
                    </Link>
                    {code && (
                        <Link href={`/order-track`} className="px-8 py-3 bg-white hover:bg-gray-50 text-gray-800 font-bold rounded-xl transition-colors shadow-sm border border-gray-200 inline-flex items-center justify-center">
                            Siparişimi Takip Et
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function OrderSuccessPage() {
    return (
        <Suspense fallback={<div>Yükleniyor...</div>}>
            <SuccessContent />
        </Suspense>
    );
}
