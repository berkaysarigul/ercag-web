'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function SuccessContent() {
    const searchParams = useSearchParams();
    const code = searchParams.get('code');
    const id = searchParams.get('id');
    const amount = searchParams.get('amount');

    return (
        <div className="container text-center py-16">
            <div className="bg-white border rounded-2xl shadow-sm max-w-2xl mx-auto p-12">
                <div className="text-6xl mb-6">🎉</div>
                <h1 className="text-3xl mb-4 text-[var(--primary)] font-bold">Siparişiniz Alındı!</h1>
                <p className="text-lg text-[var(--text-secondary)] mb-8">
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
                                <p className="font-bold text-brand-600 text-2xl">{Number(amount).toFixed(2)} ₺</p>
                            </div>
                        </div>

                        <p className="text-sm text-gray-500 mb-2">Teslimat Kodunuz:</p>
                        <p className="text-5xl font-bold tracking-widest text-[var(--primary)] m-0">{code}</p>
                        <p className="text-sm text-gray-500 mt-4">
                            Ürünlerinizi teslim alırken bu kodu mağaza görevlisine iletiniz.
                        </p>
                        <div className="mt-6 p-4 bg-blue-50 text-blue-800 text-sm rounded-lg flex items-start gap-3 text-left">
                            <span className="text-xl">🏪</span>
                            <span className="leading-relaxed">Ödemenizi ürünlerinizi mağazadan teslim alırken <strong>Nakit</strong> veya <strong>Kredi Kartı</strong> ile yapabilirsiniz.</span>
                        </div>
                    </div>
                )}

                <div className="flex gap-4 justify-center mt-8">
                    <Link href="/" className="btn btn-primary px-8">
                        Ana Sayfaya Dön
                    </Link>
                    <Link href="/products" className="btn btn-outline px-8">
                        Alışverişe Devam Et
                    </Link>
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
