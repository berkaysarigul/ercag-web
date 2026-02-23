'use client';

import Link from 'next/link';
import { ShoppingCart, Heart, Check, Eye, Star, Plus, Zap, Tag } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useCampaigns } from '@/context/CampaignContext';
import { useState } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';

interface Product {
    id: number;
    name: string;
    price: string | number;
    image: string | null;
    images?: { url: string; isMain: boolean; }[];
    category?: { id?: number; name: string };
    categoryId?: number;
    stock?: number;
    rating?: number;
    reviewCount?: number;
}

export default function ProductCard({ product }: { product: Product }) {
    const { addToCart } = useCart();
    const { getProductDiscount } = useCampaigns();
    const [isHovered, setIsHovered] = useState(false);

    const displayImage = product.image || product.images?.[0]?.url;
    const price = Number(product.price);
    const categoryId = product.categoryId ?? product.category?.id;

    // Get campaign discount for this product
    const discount = getProductDiscount(product.id, categoryId, price);
    const displayPrice = discount ? discount.discountedPrice : price;

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (product.stock === 0) {
            toast.error('Ürün stokta yok');
            return;
        }
        // Add with potentially discounted price
        addToCart({ ...product, price: displayPrice });
    };

    const handleWishlist = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            await api.post('/wishlist', { productId: product.id });
            toast.success('Favorilere eklendi');
        } catch {
            toast.error('Giriş yapmalısınız');
        }
    };

    return (
        <Link
            href={`/products/${product.id}`}
            className="group bg-white rounded-2xl border border-gray-100 shadow-soft hover:shadow-hover overflow-hidden transition-all duration-300 hover:-translate-y-2 animate-scale-in flex flex-col h-full"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Image Container */}
            <div className="relative aspect-square bg-gray-50 overflow-hidden">
                {/* Top-left badges: stock + campaign */}
                <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
                    {product.stock === 0 ? (
                        <div className="flex items-center gap-1 px-2.5 py-1 bg-red-500 text-white text-xs font-bold rounded-full shadow-lg">
                            Tükendi
                        </div>
                    ) : (
                        <div className="flex items-center gap-1 px-2.5 py-1 bg-green-500 text-white text-xs font-bold rounded-full shadow-lg">
                            <Check size={10} strokeWidth={3} />
                            Stokta
                        </div>
                    )}

                    {/* Campaign badge */}
                    {discount && (
                        <div className={`flex items-center gap-1 px-2.5 py-1 text-white text-xs font-bold rounded-full shadow-lg ${discount.campaignType === 'FLASH_SALE'
                                ? 'bg-orange-500'
                                : 'bg-blue-500'
                            }`}>
                            {discount.campaignType === 'FLASH_SALE'
                                ? <Zap size={10} />
                                : <Tag size={10} />
                            }
                            -%{discount.discountPercent}
                        </div>
                    )}
                </div>

                {/* Wishlist Button */}
                <button
                    onClick={handleWishlist}
                    className="absolute top-3 right-3 z-10 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white hover:scale-110 text-gray-400 hover:text-red-500"
                >
                    <Heart size={16} />
                </button>

                {/* Image */}
                {displayImage ? (
                    <div className="relative w-full h-full">
                        <img
                            src={displayImage?.startsWith('http') ? displayImage : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/uploads/${displayImage}`}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                    </div>
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-100">
                        <span className="text-4xl">📷</span>
                    </div>
                )}

                {/* Quick View Overlay */}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button className="px-4 py-2 bg-white text-gray-900 font-semibold text-sm rounded-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 flex items-center gap-2 shadow-lg hover:bg-gray-50">
                        <Eye size={16} />
                        İncele
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="p-5 flex flex-col flex-1">
                {/* Category & Rating */}
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-brand-600 uppercase tracking-wider">
                        {product.category?.name || 'Genel'}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Star size={12} className={`fill-yellow-400 ${product.rating ? 'text-yellow-400' : 'text-gray-300'}`} />
                        <span className="font-semibold">{product.rating ? product.rating : '0.0'}</span>
                        {product.reviewCount !== undefined && <span className="text-gray-400">({product.reviewCount})</span>}
                    </div>
                </div>

                {/* Product Name */}
                <h3 className="font-bold text-gray-900 text-base mb-2 line-clamp-2 group-hover:text-brand-600 transition-colors flex-1">
                    {product.name}
                </h3>

                {/* Campaign label */}
                {discount && (
                    <p className="text-xs text-orange-600 font-medium mb-1 truncate">
                        🎯 {discount.campaignName}
                    </p>
                )}

                {/* Price & Action */}
                <div className="flex items-end justify-between mt-4 pt-4 border-t border-gray-50">
                    <div>
                        {discount ? (
                            <>
                                <div className="text-sm text-gray-400 line-through leading-none mb-0.5">
                                    {price.toFixed(2)} ₺
                                </div>
                                <div className="text-2xl font-bold text-red-600">
                                    {displayPrice.toFixed(2)} ₺
                                </div>
                            </>
                        ) : (
                            <div className="text-2xl font-bold text-gray-900">
                                {price.toFixed(2)} ₺
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleAddToCart}
                        disabled={product.stock === 0}
                        className={`
                            flex items-center justify-center
                            w-12 h-12
                            bg-brand-600 hover:bg-brand-700
                            text-white
                            rounded-xl
                            shadow-md hover:shadow-lg
                            transform hover:scale-110 active:scale-95
                            transition-all duration-200
                            ${product.stock === 0 ? 'opacity-50 cursor-not-allowed bg-gray-400 hover:bg-gray-400 hover:scale-100' : ''}
                        `}
                    >
                        <Plus size={20} />
                    </button>
                </div>
            </div>
        </Link>
    );
}
