'use client';

import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            <h1 className="text-9xl font-bold text-[var(--primary)] opacity-20">404</h1>
            <h2 className="text-3xl font-bold text-gray-900 -mt-12 mb-4">Sayfa Bulunamadı</h2>
            <p className="text-gray-600 mb-8 max-w-md">
                Aradığınız sayfa mevcut değil veya taşınmış olabilir. Ana sayfaya dönerek alışverişe devam edebilirsiniz.
            </p>
            <Link href="/" className="btn btn-primary">
                Ana Sayfaya Dön
            </Link>
        </div>
    );
}
