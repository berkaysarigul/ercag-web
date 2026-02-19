'use client';

import { Bell, Search, User, Menu } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useAdmin } from '@/context/AdminContext';

export default function AdminHeader() {
    const pathname = usePathname();
    const { toggleSidebar } = useAdmin();

    const getPageTitle = () => {
        if (pathname === '/admin') return 'Dashboard';
        if (pathname.includes('/orders')) return 'Sipariş Yönetimi';
        if (pathname.includes('/products')) return 'Ürün Yönetimi';
        if (pathname.includes('/coupons')) return 'Kupon Yönetimi';
        if (pathname.includes('/customers')) return 'Müşteri Yönetimi';
        if (pathname.includes('/settings')) return 'Ayarlar';
        return 'Yönetim Paneli';
    };

    return (
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-8 sticky top-0 z-40 shadow-sm">
            {/* Left: Title & Toggle */}
            <div className="flex items-center gap-4">
                <button
                    className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg md:hidden"
                    onClick={toggleSidebar}
                >
                    <Menu size={20} />
                </button>
                <h2 className="text-lg md:text-xl font-bold text-gray-800 truncate">{getPageTitle()}</h2>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-6">
                {/* Search */}
                <div className="relative hidden md:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Ara..."
                        className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-64 transition-all"
                    />
                </div>

                {/* Notifications */}
                <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
                    <Bell size={20} />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full border-2 border-white"></span>
                </button>

                {/* Profile */}
                <div className="flex items-center gap-3 pl-6 border-l border-gray-200">
                    <div className="text-right hidden md:block">
                        <p className="text-sm font-semibold text-gray-700">Admin User</p>
                        <p className="text-xs text-gray-500">Süper Yönetici</p>
                    </div>
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary border border-primary/20">
                        <User size={20} />
                    </div>
                </div>
            </div>
        </header>
    );
}
