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
        <div className="container" style={{ textAlign: 'center', padding: '4rem 0' }}>
            <div className="card" style={{ maxWidth: '600px', margin: '0 auto', padding: '3rem' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
                <h1 style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--primary)' }}>Siparişiniz Alındı!</h1>
                <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                    Siparişiniz başarıyla oluşturuldu. Ekibimiz en kısa sürede hazırlamaya başlayacak.
                    <br />
                    Sipariş durumunu "Siparişlerim" sayfasından takip edebilirsiniz.
                </p>

                {code && (
                    <div style={{ backgroundColor: '#f3f4f6', padding: '1.5rem', borderRadius: '0.5rem', marginBottom: '2rem' }}>
                        <div className="grid grid-cols-2 gap-4 text-left mb-4 border-b border-gray-200 pb-4">
                            <div>
                                <p className="text-sm text-gray-500">Sipariş No</p>
                                <p className="font-bold text-gray-900">#{id}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-gray-500">Tutar</p>
                                <p className="font-bold text-primary text-xl">{amount} ₺</p>
                            </div>
                        </div>

                        <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Teslimat Kodunuz:</p>
                        <p style={{ fontSize: '2.5rem', fontWeight: 'bold', letterSpacing: '0.1em', color: 'var(--primary)', margin: 0 }}>{code}</p>
                        <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.5rem' }}>
                            Ürünlerinizi teslim alırken bu kodu mağaza görevlisine iletiniz.
                        </p>
                    </div>
                )}

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    <Link href="/" className="btn btn-primary">
                        Ana Sayfaya Dön
                    </Link>
                    <Link href="/products" className="btn" style={{ border: '1px solid var(--border)' }}>
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
