'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CookieConsent() {
    const [show, setShow] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem('cookie-consent');
        if (!consent) {
            setShow(true);
        }
    }, []);

    const accept = () => {
        localStorage.setItem('cookie-consent', 'accepted');
        setShow(false);
    };

    const decline = () => {
        localStorage.setItem('cookie-consent', 'declined');
        setShow(false);
    };

    if (!show) return null;

    return (
        <div className="fixed bottom-16 md:bottom-0 left-0 w-full bg-white border-t p-4 shadow-lg z-[60] animate-in slide-in-from-bottom flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-600 max-w-3xl">
                <span className="font-semibold text-gray-900 block mb-1">Çerez Tercihleri</span>
                Sizlere daha iyi hizmet sunabilmek için sitemizde çerezler kullanılmaktadır.
                Detaylı bilgi için <Link href="/privacy" className="text-primary hover:underline">Gizlilik Politikamızı</Link> inceleyebilirsiniz.
            </div>
            <div className="flex gap-3 whitespace-nowrap">
                <button onClick={decline} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md">
                    Reddet
                </button>
                <button onClick={accept} className="btn btn-primary px-6 py-2 text-sm">
                    Kabul Et
                </button>
            </div>
        </div>
    );
}
