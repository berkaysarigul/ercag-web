'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import MegaMenu from '@/components/layout/MegaMenu';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import MiniCart from '@/components/cart/MiniCart';
import { ShoppingCart, User, Heart, Search, ChevronDown, LogOut, Package, Phone, MapPin, Clock, Zap, Gift } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useSettings } from '@/context/SettingsContext';
import SearchAutocomplete from '@/components/search/SearchAutocomplete';

export default function Header() {
    const { settings } = useSettings();
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [megaMenuOpen, setMegaMenuOpen] = useState(false);
    const megaMenuTimer = useRef<NodeJS.Timeout | null>(null);
    const { items } = useCart();
    const { user, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const isHome = pathname === '/';

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

    const handleProductsMouseEnter = () => {
        if (megaMenuTimer.current) clearTimeout(megaMenuTimer.current);
        setMegaMenuOpen(true);
    };

    const handleProductsMouseLeave = () => {
        megaMenuTimer.current = setTimeout(() => {
            setMegaMenuOpen(false);
        }, 150);
    };

    return (
        <>
            <header className={`fixed top-4 left-0 right-0 z-50 transition-all duration-300 px-4 md:px-8`}>
                <div className={`max-w-7xl mx-auto h-16 flex items-center justify-between px-6 rounded-full transition-all duration-300 ${(isScrolled || !isHome)
                    ? 'bg-white/90 backdrop-blur-md shadow-sm border border-gray-200'
                    : 'bg-transparent text-white'
                    }`}>

                    {/* Logo Section */}
                    <Link href="/" className="flex items-center gap-2 group shrink-0">
                        {settings.site_logo ? (
                            <div className="relative h-16 w-48 md:h-20 md:w-64 -ml-2 flex items-center">
                                <img
                                    src={settings.site_logo.startsWith('http') ? settings.site_logo : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${settings.site_logo}`}
                                    alt={settings.site_title || "Logo"}
                                    className={`max-h-[140%] max-w-full object-contain transition-all duration-300 scale-125 origin-left ${(!isScrolled && isHome) ? 'brightness-0 invert opacity-90' : 'brightness-100 opacity-100'}`}
                                />
                            </div>
                        ) : (
                            <span className={`font-serif text-2xl tracking-tight transition-colors ${(isScrolled || !isHome) ? 'text-gray-900' : 'text-white'}`}>
                                {settings.site_title ? (
                                    <>
                                        {settings.site_title.split(' ')[0]}
                                        <span className="italic opacity-80 font-serif"> {settings.site_title.split(' ').slice(1).join(' ')}</span>
                                    </>
                                ) : (
                                    <>Erçağ<span className="italic opacity-80 font-serif">Kırtasiye</span></>
                                )}
                            </span>
                        )}
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden lg:flex items-center gap-8">
                        <div
                            className="relative"
                            onMouseEnter={handleProductsMouseEnter}
                            onMouseLeave={handleProductsMouseLeave}
                        >
                            <Link
                                href="/products"
                                className={`text-sm font-medium hover:opacity-70 transition-opacity flex items-center gap-1 ${(isScrolled || !isHome) ? 'text-gray-800' : 'text-white'}`}
                            >
                                Ürünler
                                <ChevronDown size={14} className={`transition-transform duration-200 ${megaMenuOpen ? 'rotate-180' : ''}`} />
                            </Link>
                        </div>
                        <Link href="/products?sort=popular" className={`text-sm font-medium hover:opacity-70 transition-opacity ${(isScrolled || !isHome) ? 'text-gray-800' : 'text-white'}`}>Çok Satanlar</Link>
                        <Link href="/categories" className={`text-sm font-medium hover:opacity-70 transition-opacity ${(isScrolled || !isHome) ? 'text-gray-800' : 'text-white'}`}>Kategoriler</Link>
                        <Link href="/products?hasDiscount=true" className={`text-sm font-medium hover:opacity-70 transition-opacity flex items-center gap-1 ${(isScrolled || !isHome) ? 'text-red-500' : 'text-red-300'}`}>
                            <Zap size={14} /> Fırsatlar
                        </Link>
                    </nav>

                    {/* Search - Max Width Centered */}
                    <div className="hidden md:block flex-1 max-w-sm mx-auto ml-4 mr-4">
                        <div className={`relative rounded-full overflow-hidden transition-colors ${(isScrolled || !isHome) ? 'bg-gray-100/80' : 'bg-white/20 backdrop-blur-md'}`}>
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search size={16} className={(isScrolled || !isHome) ? 'text-gray-500' : 'text-white/70'} />
                            </div>
                            <input
                                type="text"
                                placeholder="Ürün Ara..."
                                className={`w-full py-2 pl-9 pr-4 text-sm bg-transparent border-none focus:ring-0 outline-none ${(isScrolled || !isHome) ? 'text-gray-900 placeholder-gray-500' : 'text-white placeholder-white/70'}`}
                                onClick={() => { setMobileSearchOpen(v => !v); setMegaMenuOpen(false); }}
                                readOnly
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                        {/* Mobile search toggle */}
                        <button
                            onClick={() => setMobileSearchOpen(v => !v)}
                            className={`md:hidden p-2 rounded-full transition-colors ${(isScrolled || !isHome) ? 'text-gray-700 hover:bg-gray-100' : 'text-white hover:bg-white/20'}`}>
                            <Search size={18} />
                        </button>

                        {/* Wishlist */}
                        <Link href="/wishlist"
                            className={`hidden sm:flex relative p-2 rounded-full transition-colors ${(isScrolled || !isHome) ? 'text-gray-700 hover:bg-gray-100' : 'text-white hover:bg-white/20'}`}
                            title="Favorilerim">
                            <Heart size={18} />
                        </Link>

                        {/* User Menu */}
                        {user ? (
                            <div className="relative">
                                <button
                                    onClick={e => { e.stopPropagation(); setUserMenuOpen(v => !v); }}
                                    className={`hidden sm:flex items-center justify-center w-9 h-9 rounded-full transition-colors border border-transparent ${(isScrolled || !isHome) ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm'}`}>
                                    <User size={16} />
                                </button>

                                {/* Dropdown */}
                                {userMenuOpen && (
                                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
                                        <div className="px-4 py-3 border-b border-gray-50 mb-2">
                                            <p className="text-xs text-gray-400 mb-0.5">Hesabım</p>
                                            <p className="text-sm font-semibold text-gray-800 truncate">{user.name}</p>
                                            <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
                                        </div>
                                        <Link href="/profile" onClick={() => setUserMenuOpen(false)}
                                            className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors">
                                            <User size={16} className="text-gray-400 group-hover:text-primary" />
                                            Profilim
                                        </Link>
                                        <Link href="/profile?tab=orders" onClick={() => setUserMenuOpen(false)}
                                            className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors">
                                            <Package size={16} className="text-gray-400 group-hover:text-primary" />
                                            Siparişlerim
                                        </Link>
                                        <Link href="/spin" onClick={() => setUserMenuOpen(false)}
                                            className="flex items-center gap-3 px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 transition-colors font-medium">
                                            <Gift size={16} />
                                            🎰 Hediye Çarkı
                                        </Link>
                                        <div className="border-t border-gray-50 mt-2 pt-2">
                                            <button onClick={() => { logout(); setUserMenuOpen(false); }}
                                                className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left font-medium">
                                                <LogOut size={16} />
                                                Çıkış Yap
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Link href="/auth" className={`hidden sm:flex items-center justify-center w-9 h-9 rounded-full transition-colors ${(isScrolled || !isHome) ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm'}`}>
                                <User size={16} />
                            </Link>
                        )}

                        {/* Cart */}
                        <button
                            onClick={() => setIsCartOpen(true)}
                            className={`relative flex items-center justify-center w-9 h-9 rounded-full transition-colors ml-1 border border-transparent ${(isScrolled || !isHome) ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm'}`}>
                            <ShoppingCart size={16} />
                            {cartItemCount > 0 && (
                                <span className={`absolute -top-1 -right-1 w-4 h-4 text-[9px] font-bold flex items-center justify-center rounded-full shadow-sm ${(isScrolled || !isHome) ? 'bg-primary text-white' : 'bg-white text-primary'}`}>
                                    {cartItemCount > 9 ? '9+' : cartItemCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Mega Menu */}
                <div
                    className="relative max-w-7xl mx-auto"
                    onMouseEnter={() => { if (megaMenuTimer.current) clearTimeout(megaMenuTimer.current); }}
                    onMouseLeave={handleProductsMouseLeave}
                >
                    <MegaMenu
                        isOpen={megaMenuOpen}
                        onClose={() => setMegaMenuOpen(false)}
                        isDark={!isScrolled && isHome}
                    />
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
