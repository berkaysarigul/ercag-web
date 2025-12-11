'use client';

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import MiniCart from "@/components/cart/MiniCart";
import { Search, ShoppingCart, Menu, User, Heart } from 'lucide-react';

export default function Header() {
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const { items } = useCart();
    const { user } = useAuth();

    const cartItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <>
            <header
                className={`sticky top-0 z-50 transition-all duration-300 ${isScrolled
                    ? 'bg-white/90 backdrop-blur-md shadow-md border-b border-gray-100'
                    : 'bg-white border-b border-gray-200'
                    }`}
            >
                <div className="container h-20 flex items-center justify-between">
                    <Link href="/" className="flex items-center">
                        <Image src="/logo.png" alt="Erçağ Kırtasiye" width={150} height={50} className="object-contain" />
                    </Link>
                    <nav className="flex gap-8 items-center">
                        <Link href="/" className="font-medium hover:text-[var(--primary)] transition-colors">Ana Sayfa</Link>
                        <Link href="/products" className="font-medium hover:text-[var(--primary)] transition-colors">Ürünler</Link>

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

                            {/* Cart Button */}
                            <button
                                onClick={() => setIsCartOpen(true)}
                                className="relative p-2 hover:bg-gray-100 rounded-full transition-colors flex items-center gap-2"
                            >
                                <div className="relative">
                                    <ShoppingCart size={24} className="text-gray-700" />
                                    {cartItemCount > 0 && (
                                        <span className="absolute -top-2 -right-2 bg-[var(--primary)] text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                                            {cartItemCount}
                                        </span>
                                    )}
                                </div>
                                <span className="font-medium hidden md:block">Sepetim</span>
                            </button>
                        </div>
                    </nav>
                </div>
            </header>

            <MiniCart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
        </>
    );
}
