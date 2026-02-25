'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const routeNameMap: Record<string, string> = {
    'products': 'Ürünler',
    'cart': 'Sepetim',
    'profile': 'Hesabım',
    'wishlist': 'Favorilerim',
    'auth': 'Giriş / Kayıt',
    'privacy': 'Gizlilik Politikası',
    'terms': 'Kullanım Koşulları',
    'order-success': 'Sipariş Başarılı',
    'admin': 'Yönetim Paneli',
    'orders': 'Siparişler',
    'categories': 'Kategoriler',
    'new': 'Yeni Ekle',
    // 'about' ve 'contact' kaldırıldı — bu sayfalar mevcut değil (UI-28)
};

export default function Breadcrumb({ productName }: { productName?: string }) {
    const pathname = usePathname();
    const segments = pathname.split('/').filter(Boolean);

    return (
        <nav className="flex text-sm text-gray-500 mb-6" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-3">
                <li className="inline-flex items-center">
                    <Link href="/" className="hover:text-blue-600 transition-colors">
                        Ana Sayfa
                    </Link>
                </li>
                {segments.map((segment, index) => {
                    const href = `/${segments.slice(0, index + 1).join('/')}`;
                    const isLast = index === segments.length - 1;
                    const name = routeNameMap[segment] || segment;

                    // If it's the last segment and we have a specific product name, use that
                    const displayName = (isLast && productName) ? productName : name;

                    return (
                        <li key={href}>
                            <div className="flex items-center">
                                <span className="mx-2 text-gray-400">/</span>
                                {isLast ? (
                                    <span className="text-gray-900 font-medium capitalize">
                                        {displayName}
                                    </span>
                                ) : (
                                    <Link href={href} className="hover:text-blue-600 transition-colors capitalize">
                                        {displayName}
                                    </Link>
                                )}
                            </div>
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}
