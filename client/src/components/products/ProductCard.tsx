'use client';

import Link from 'next/link';
import { ShoppingCart, Heart } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface Product {
    id: number;
    name: string;
    price: string | number;
    image: string | null;
    category?: { name: string };
    stock?: number;
}

export default function ProductCard({ product }: { product: Product }) {
    const { addToCart } = useCart();
    const [isHovered, setIsHovered] = useState(false);

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (product.stock === 0) {
            toast.error('Ürün stokta yok');
            return;
        }
        addToCart(product);
    };

    const handleWishlist = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            await api.post('/wishlist', { productId: product.id });
            toast.success('Favorilere eklendi');
        } catch (error) {
            toast.error('Giriş yapmalısınız');
        }
    };

    return (
        <Link
            href={`/products/${product.id}`}
            className="group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden relative"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Badges */}
            <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
                {product.stock === 0 ? (
                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm">
                        Tükendi
                    </span>
                ) : (product.stock && product.stock <= 5) ? (
                    <span className="bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm">
                        Sınırlı Stok
                    </span>
                ) : (
                    <span className="bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm">
                        Stokta
                    </span>
                )}
            </div>

            {/* Wishlist Button */}
            <button
                onClick={handleWishlist}
                className="absolute top-3 right-3 z-10 p-2 bg-white/80 backdrop-blur-sm rounded-full text-gray-400 hover:text-red-500 hover:bg-white transition-colors shadow-sm opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 duration-300"
            >
                <Heart size={18} />
            </button>

            {/* Image */}
            <div className="aspect-square bg-gray-50 relative overflow-hidden">
                {product.image ? (
                    <img
                        src={`http://localhost:3001/uploads/${product.image}`}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <span className="text-4xl">📷</span>
                    </div>
                )}

                {/* Quick Add Overlay (Mobile friendly: always visible on touch, or handle differently) */}
                <div className={`absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex justify-center`}>
                    {/* Optional: Quick view button could go here */}
                </div>
            </div>

            {/* Content */}
            <div className="p-4 flex flex-col flex-1">
                <div className="text-xs text-gray-500 mb-1 uppercase tracking-wider font-medium">
                    {product.category?.name || 'Genel'}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 min-h-[3rem] group-hover:text-primary transition-colors">
                    {product.name}
                </h3>

                <div className="mt-auto flex items-end justify-between gap-3">
                    <div className="flex flex-col">
                        {/* <span className="text-xs text-gray-400 line-through">120.00 ₺</span> */}
                        <span className="text-xl font-bold text-primary">
                            {Number(product.price).toFixed(2)} ₺
                        </span>
                    </div>

                    <button
                        onClick={handleAddToCart}
                        disabled={product.stock === 0}
                        className={`btn btn-primary p-2.5 rounded-lg shadow-md hover:shadow-lg transform active:scale-95 transition-all ${product.stock === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <ShoppingCart size={20} />
                    </button>
                </div>
            </div>
        </Link>
    );
}
