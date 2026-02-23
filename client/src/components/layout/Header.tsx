'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import MiniCart from '@/components/cart/MiniCart';
import { ShoppingCart, User, Heart, Search, ChevronDown, LogOut, Package } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSettings } from '@/context/SettingsContext';
import SearchAutocomplete from '@/components/search/SearchAutocomplete';

export default function Header() {
    const { settings } = useSettings();
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const { items } = useCart();
    const { user, logout } = useAuth();
    const router = useRouter();

    const cartItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 10);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close user menu on outside click
    useEffect(() => {
        if (!userMenuOpen) return;
        const close = () => setUserMenuOpen(false);
        window.addEventListener('click', close, true);
        return () => window.removeEventListener('click', close, true);
    }, [userMenuOpen]);

    return (
        <>
            <header className={`sticky top-0 z-50 transition-all duration-300 ${isScrolled
                ? 'bg-white/80 backdrop-blur-xl shadow-sm border-b border-gray-100'
                : 'bg-white border-b border-gray-100'
                }`}>
                <div className="container h-16 flex items-center gap-4" style={{ paddingTop: 0, paddingBottom: 0 }}>

                    {/* Logo */}
                    <Link href="/" className="flex items-center shrink-0">
                        <div className="relative h-12 w-44">
                            <Image
                                src={settings.site_logo
                                    ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${settings.site_logo}`
                                    : '/logo.png'}
                                alt={settings.site_title || 'Erçağ Kırtasiye'}
                                fill
                                className="object-contain object-left"
                                priority
                            />
                        </div>
                    </Link>

                    {/* Nav links */}
                    <nav className="hidden md:flex items-center gap-1 shrink-0">
                        <Link href="/"
                            className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all">
                            Ana Sayfa
                        </Link>
                        <Link href="/products"
                            className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all">
                            Ürünler
                        </Link>
                    </nav>

                    {/* Search — grows to fill space */}
                    <div className="hidden md:block flex-1 max-w-xl">
                        <SearchAutocomplete />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 ml-auto">

                        {/* Mobile search toggle */}
                        <button
                            onClick={() => setMobileSearchOpen(v => !v)}
                            className="md:hidden p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all">
                            <Search size={20} />
                        </button>

                        {/* Wishlist */}
                        <Link href="/wishlist"
                            className="hidden sm:flex p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
                            title="Favorilerim">
                            <Heart size={20} />
                        </Link>

                        {/* User menu */}
                        {user ? (
                            <div className="relative">
                                <button
                                    onClick={e => { e.stopPropagation(); setUserMenuOpen(v => !v); }}
                                    className="hidden sm:flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-all">
                                    <div className="w-7 h-7 rounded-full bg-[var(--primary)] text-white flex items-center justify-center text-xs font-bold shrink-0">
                                        {user.name?.[0]?.toUpperCase() || 'U'}
                                    </div>
                                    <span className="hidden lg:block max-w-[80px] truncate">{user.name?.split(' ')[0]}</span>
                                    <ChevronDown size={14} className={`transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {/* Dropdown */}
                                {userMenuOpen && (
                                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-50">
                                        <div className="px-3 py-2 border-b border-gray-50 mb-1">
                                            <p className="text-xs text-gray-400">Giriş yapıldı</p>
                                            <p className="text-sm font-semibold text-gray-800 truncate">{user.name}</p>
                                        </div>
                                        <Link href="/profile" onClick={() => setUserMenuOpen(false)}
                                            className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                                            <User size={15} className="text-gray-400" />
                                            Profilim
                                        </Link>
                                        <Link href="/profile?tab=orders" onClick={() => setUserMenuOpen(false)}
                                            className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                                            <Package size={15} className="text-gray-400" />
                                            Siparişlerim
                                        </Link>
                                        <div className="border-t border-gray-50 mt-1 pt-1">
                                            <button onClick={() => { logout(); setUserMenuOpen(false); }}
                                                className="flex items-center gap-2.5 px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors w-full text-left">
                                                <LogOut size={15} />
                                                Çıkış Yap
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Link href="/auth"
                                className="hidden sm:flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
                                <User size={18} />
                                <span className="hidden lg:inline">Giriş Yap</span>
                            </Link>
                        )}

                        {/* Cart */}
                        <button
                            onClick={() => setIsCartOpen(true)}
                            className="relative flex items-center gap-2 pl-3 pr-4 py-2 bg-[var(--primary)] text-white rounded-xl hover:opacity-90 active:scale-95 transition-all text-sm font-medium shadow-sm">
                            <ShoppingCart size={18} />
                            <span className="hidden sm:inline">Sepet</span>
                            {cartItemCount > 0 && (
                                <span className="absolute -top-2 -right-2 bg-amber-400 text-gray-900 text-[10px] font-bold min-w-[20px] h-5 px-1 flex items-center justify-center rounded-full border-2 border-white">
                                    {cartItemCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </header>

            {/* Mobile Search */}
            {mobileSearchOpen && (
                <div className="md:hidden px-4 py-3 bg-white border-b border-gray-100 shadow-sm">
                    <SearchAutocomplete />
                </div>
            )}

            <MiniCart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
        </>
    );
}
