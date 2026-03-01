'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, ShoppingCart, User, Heart, Zap } from 'lucide-react';
import { useCart } from '@/context/CartContext';

export default function MobileBottomNav() {
    const pathname = usePathname();
    const { items } = useCart();
    const cartItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

    const navItems = [
        { href: '/', icon: Home, label: 'Ana Sayfa' },
        { href: '/products?hasDiscount=true', icon: Zap, label: 'Fırsatlar' },
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
                        className={`flex flex-col items-center justify-center w-14 gap-1 p-1 transition-all duration-300 relative ${isActive ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <div className="relative flex flex-col items-center">
                            {isActive && (
                                <span className="absolute -top-3 w-1 h-1 bg-blue-600 rounded-full"></span>
                            )}
                            <div className="relative">
                                <item.icon size={22} strokeWidth={isActive ? 2.5 : 1.5} className="mt-1" />
                                {item.badge !== undefined && item.badge > 0 && (
                                    <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[10px] font-bold w-[18px] h-[18px] flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                                        {item.badge > 9 ? '9+' : item.badge}
                                    </span>
                                )}
                            </div>
                            <span className="text-[10px] font-medium mt-1">{item.label}</span>
                        </div>
                    </Link>
                );
            })}
        </div>
    );
}

/* Add safe area support in globals.css: 
   .pb-safe { padding-bottom: env(safe-area-inset-bottom, 20px); } 
*/
