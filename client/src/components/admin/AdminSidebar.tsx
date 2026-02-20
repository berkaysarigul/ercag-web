'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useAdmin } from '@/context/AdminContext';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Package, ShoppingBag, Users, Star, FolderTree, Ticket, MessageSquare, Menu, X, LogOut, Settings, ScanBarcode, BarChart3, TrendingUp, Shield } from 'lucide-react';

export default function AdminSidebar() {
    const pathname = usePathname();
    const { user, logout } = useAuth();
    const { sidebarOpen } = useAdmin();

    const allMenuItems = [ // ... no changes to items

        { name: 'Dashboard', href: '/admin', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'ADMIN', 'STAFF'] },
        { name: 'Teslimat Doğrula', href: '/admin/verify-pickup', icon: ScanBarcode, roles: ['SUPER_ADMIN', 'ADMIN', 'STAFF'] },
        { name: 'Siparişler', href: '/admin/orders', icon: ShoppingBag, roles: ['SUPER_ADMIN', 'ADMIN', 'STAFF'] }, // FIX-24: removed hardcoded badge
        { name: 'Ürünler', href: '/admin/products', icon: Package, roles: ['SUPER_ADMIN', 'ADMIN'] },
        { name: 'Stok Yönetimi', href: '/admin/stock', icon: BarChart3, roles: ['SUPER_ADMIN', 'ADMIN'] },
        { name: 'Kategoriler', href: '/admin/categories', icon: Package, roles: ['SUPER_ADMIN', 'ADMIN'] },
        { name: 'Kuponlar', href: '/admin/coupons', icon: Ticket, roles: ['SUPER_ADMIN', 'ADMIN'] },
        { name: 'Değerlendirmeler', href: '/admin/reviews', icon: MessageSquare, roles: ['SUPER_ADMIN', 'ADMIN', 'STAFF'] },
        { name: 'Müşteriler', href: '/admin/customers', icon: Users, roles: ['SUPER_ADMIN', 'ADMIN'] },
        { name: 'Vitrin / Slider', href: '/admin/sliders', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'ADMIN'] },
        // FIX-07: Added 3 missing menu items
        { name: 'Kampanyalar', href: '/admin/campaigns', icon: TrendingUp, roles: ['SUPER_ADMIN', 'ADMIN'] },
        { name: 'Analitik & Rapor', href: '/admin/analytics', icon: BarChart3, roles: ['SUPER_ADMIN', 'ADMIN'] },
        { name: 'Denetim Günlüğü', href: '/admin/audit-log', icon: Shield, roles: ['SUPER_ADMIN'] },
        { name: 'Ayarlar', href: '/admin/settings', icon: Settings, roles: ['SUPER_ADMIN', 'ADMIN'] },
    ];

    const menuItems = allMenuItems.filter(item => user && item.roles.includes(user.role));

    return (
        <aside className={`
            fixed left-0 top-0 h-screen w-64 bg-primary text-white flex flex-col shadow-xl z-50
            transition-transform duration-300 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
            {/* Logo Area */}
            <div className="p-6 border-b border-primary-light/30 flex items-center gap-3">
                <div className="w-8 h-8 bg-secondary rounded-lg flex items-center justify-center text-primary font-bold text-xl">
                    E
                </div>
                <div>
                    <h1 className="font-bold text-lg leading-none">Erçağ</h1>
                    <span className="text-xs text-gray-300">Yönetim Paneli</span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 group ${isActive
                                ? 'bg-primary-light text-white shadow-md'
                                : 'text-gray-300 hover:bg-primary-light/50 hover:text-white'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <Icon size={20} className={isActive ? 'text-secondary' : 'text-gray-400 group-hover:text-white'} />
                                <span className="font-medium">{item.name}</span>
                            </div>
                        </Link>
                    );
                })}
            </nav>

            {/* User & Logout */}
            <div className="p-4 border-t border-primary-light/30">
                <button
                    onClick={logout}
                    className="flex items-center gap-3 w-full px-4 py-3 text-gray-300 hover:text-white hover:bg-primary-light/50 rounded-lg transition-colors"
                >
                    <LogOut size={20} />
                    <span className="font-medium">Çıkış Yap</span>
                </button>
            </div>
        </aside>
    );
}
