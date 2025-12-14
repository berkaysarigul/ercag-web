'use client';

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import MiniCart from "@/components/cart/MiniCart";
import { Search, ShoppingCart, Menu, User, Heart, ArrowRight } from 'lucide-react';

import { useRouter } from 'next/navigation';

export default function Header() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const { items } = useCart();
    const { user } = useAuth();
    const router = useRouter();

    const cartItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const query = (e.currentTarget.elements.namedItem('search') as HTMLInputElement).value;
        if (query.trim()) {
            setIsMobileMenuOpen(false);
            router.push(`/products?search=${encodeURIComponent(query)}`);
        }
    };

    return (
        <>
            <header className={`sticky top-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/90 backdrop-blur-md shadow-md border-b border-gray-100' : 'bg-white border-b border-gray-200'}`}>
                <div className="container h-20 flex items-center justify-between">
                    <Link href="/" className="flex items-center">
                        <Image src="/logo.png" alt="Erçağ Kırtasiye" width={150} height={50} className="object-contain" />
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex gap-8 items-center">
                        <Link href="/" className="font-medium hover:text-[var(--primary)] transition-colors">Ana Sayfa</Link>
                        <Link href="/products" className="font-medium hover:text-[var(--primary)] transition-colors">Ürünler</Link>

                        {/* Search Bar */}
                        <form
                            onSubmit={handleSearch}
                            className="hidden md:flex items-center relative w-96 max-w-lg"
                        >
                            <div className="relative w-full">
                                <input
                                    name="search"
                                    type="text"
                                    placeholder="Ürün, kategori ara..."
                                    className="
                                        w-full pl-12 pr-12 py-2.5
                                        bg-white
                                        border border-gray-200
                                        focus:border-brand-500
                                        focus:ring-2 focus:ring-brand-100
                                        rounded-full
                                        text-gray-900 text-sm
                                        placeholder:text-gray-400
                                        shadow-sm
                                        focus:outline-none
                                        transition-all duration-200
                                    "
                                />
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-brand-100 text-brand-600 rounded-full hover:bg-brand-200 transition-colors">
                                    <ArrowRight size={14} />
                                </button>
                            </div>
                        </form>

                        <div className="flex items-center gap-2">
                            <Link href="/wishlist" className="p-2 hover:bg-gray-100 rounded-full relative" title="Favorilerim">
                                <Heart size={24} />
                            </Link>
                            {user ? (
                                <Link href="/profile" className="p-2 hover:bg-gray-100 rounded-full relative" title="Hesabım">
                                    <User size={24} />
                                </Link>
                            ) : (
                                <Link href="/auth" className="p-2 hover:bg-gray-100 rounded-full relative" title="Giriş Yap">
                                    <User size={24} />
                                </Link>
                            )}
                            <button onClick={() => setIsCartOpen(true)} className="relative p-2 hover:bg-gray-100 rounded-full transition-colors flex items-center gap-2">
                                <div className="relative">
                                    <ShoppingCart size={24} className="text-gray-700" />
                                    {cartItemCount > 0 && <span className="absolute -top-2 -right-2 bg-[var(--primary)] text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">{cartItemCount}</span>}
                                </div>
                                <span className="font-medium">Sepetim</span>
                            </button>
                        </div>
                    </nav>

                    {/* Mobile Menu Button */}
                    <div className="flex md:hidden items-center gap-4">
                        <button onClick={() => setIsCartOpen(true)} className="relative p-2">
                            <ShoppingCart size={24} />
                            {cartItemCount > 0 && <span className="absolute -top-2 -right-2 bg-[var(--primary)] text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">{cartItemCount}</span>}
                        </button>
                        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2">
                            <Menu size={24} />
                        </button>
                    </div>
                </div>

                {/* Mobile Menu Overlay */}
                {isMobileMenuOpen && (
                    <div className="md:hidden absolute top-20 left-0 w-full bg-white border-b border-gray-200 shadow-lg p-4 flex flex-col gap-4 animate-in slide-in-from-top-2">
                        <form onSubmit={handleSearch} className="flex items-center border border-gray-300 rounded-lg px-4 py-3 bg-gray-50">
                            <input name="search" type="text" placeholder="Ürün ara..." className="bg-transparent border-none outline-none w-full text-base placeholder:text-gray-500" />
                            <button type="submit" className="text-gray-500">
                                <Search size={20} />
                            </button>
                        </form>
                        <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 hover:bg-gray-50 rounded-lg text-lg font-medium">Ana Sayfa</Link>
                        <Link href="/products" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 hover:bg-gray-50 rounded-lg text-lg font-medium">Ürünler</Link>
                        <Link href="/wishlist" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 hover:bg-gray-50 rounded-lg text-lg font-medium flex items-center gap-2"><Heart size={20} /> Favorilerim</Link>
                        {user ? (
                            <Link href="/profile" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 hover:bg-gray-50 rounded-lg text-lg font-medium flex items-center gap-2"><User size={20} /> Hesabım</Link>
                        ) : (
                            <Link href="/auth" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 hover:bg-gray-50 rounded-lg text-lg font-medium flex items-center gap-2"><User size={20} /> Giriş Yap</Link>
                        )}
                    </div>
                )}
            </header>

            <MiniCart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
        </>
    );
}
