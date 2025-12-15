'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, ShoppingCart, User, Heart } from 'lucide-react';
import { useCart } from '@/context/CartContext';

export default function MobileBottomNav() {
    const pathname = usePathname();
    const { items } = useCart();
    const cartItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

    const navItems = [
        { href: '/', icon: Home, label: 'Ana Sayfa' },
        { href: '/products', icon: Search, label: 'Ara' },
        { href: '/wishlist', icon: Heart, label: 'Favoriler' },
        { href: '/cart', icon: ShoppingCart, label: 'Sepet', badge: cartItemCount },
        { href: '/profile', icon: User, label: 'Hesabım' }
    ];

    // Hide on specific pages if needed (e.g., inside cart checkout? Maybe not)

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-2 md:hidden z-50 flex justify-between items-center pb-safe">
            {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`flex flex-col items-center gap-1 p-2 transition-colors relative ${isActive ? 'text-primary' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <div className="relative">
                            <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                            {item.badge !== undefined && item.badge > 0 && (
                                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-white">
                                    {item.badge}
                                </span>
                            )}
                        </div>
                        <span className="text-[10px] font-medium">{item.label}</span>
                    </Link>
                );
            })}
        </div>
    );
}

/* Add safe area support in globals.css: 
   .pb-safe { padding-bottom: env(safe-area-inset-bottom, 20px); } 
*/
