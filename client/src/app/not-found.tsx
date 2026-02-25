'use client';

import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            <h1 className="text-9xl font-bold text-blue-600 opacity-20">404</h1>
            <h2 className="text-3xl font-bold text-gray-900 -mt-12 mb-4">Sayfa Bulunamadı</h2>
            <p className="text-gray-600 mb-8 max-w-md">
                Aradığınız sayfa mevcut değil veya taşınmış olabilir. Ana sayfaya dönerek alışverişe devam edebilirsiniz.
            </p>
            <Link href="/" className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-md hover:shadow-lg inline-flex items-center justify-center">
                Ana Sayfaya Dön
            </Link>
        </div>
    );
}
