'use client';

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import MiniCart from "@/components/cart/MiniCart";
import { Search, ShoppingCart, Menu, User, Heart, ArrowRight } from 'lucide-react';

import { useRouter } from 'next/navigation';
import api from '@/lib/api';

import { useSettings } from "@/context/SettingsContext";
import SearchAutocomplete from "@/components/search/SearchAutocomplete";

export default function Header() {
    const { settings } = useSettings();
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const { items } = useCart();
    const { user } = useAuth();
    const router = useRouter();

    const cartItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

    useEffect(() => {
        // Scroll handler only
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
            router.push(`/products?search=${encodeURIComponent(query)}`);
        }
    };

    return (
        <>
            <header className={`sticky top-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/90 backdrop-blur-md shadow-md border-b border-gray-100' : 'bg-white border-b border-gray-200'}`}>
                <div className="container h-20 flex items-center justify-between">
                    <Link href="/" className="flex items-center">
                        <div className="relative h-16 w-52">
                            <img
                                src={settings.site_logo ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${settings.site_logo}` : "/logo.png"}
                                alt={settings.site_title || "Erçağ Kırtasiye"}
                                className="h-full w-full object-contain object-left"
                            />
                        </div>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex gap-8 items-center">
                        <Link href="/" className="font-medium hover:text-[var(--primary)] transition-colors">Ana Sayfa</Link>
                        <Link href="/products" className="font-medium hover:text-[var(--primary)] transition-colors">Ürünler</Link>

                        {/* Search Bar */}
                        <div className="hidden md:block w-96 max-w-lg">
                            <SearchAutocomplete />
                        </div>

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

                    {/* Mobile Menu Button - OPTIONAL: We can keep this for extra links or hide since we have bottom nav */}
                    {/* For now, just show Logo centered or keep simpler. Let's hide these since Bottom Nav has everything. */}
                    <div className="flex md:hidden w-8"></div> {/* Spacer to balance logo if needed */}
                </div>


            </header>

            <MiniCart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
        </>
    );
}
