'use client';

import Link from 'next/link';
import Image from 'next/image';
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
    compareAtPrice?: string | number | null;
    discountPercent?: number | null;
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

    // compareAtPrice indirim yüzdesi (kampanya yoksa)
    const compareAt = product.compareAtPrice ? Number(product.compareAtPrice) : null;
    const compareDiscount = !discount && compareAt && compareAt > price
        ? Math.round(((compareAt - price) / compareAt) * 100)
        : null;

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (product.stock === 0) {
            toast.error('Ürün stokta yok');
            return;
        }
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
            className="group block"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Image Container with Eco Beige */}
            <div className="relative aspect-[4/5] bg-[#E8E8E0] rounded-lg overflow-hidden mb-4">
                {/* Top-left badges: stock + campaign */}
                <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
                    {product.stock === 0 ? (
                        <div className="flex items-center gap-1 px-3 py-1 bg-white/50 backdrop-blur-sm border border-white text-gray-700 text-[10px] uppercase font-bold tracking-wider rounded-full shadow-sm">
                            Tükendi
                        </div>
                    ) : (product.stock && product.stock <= 5) ? (
                        <div className="flex items-center gap-1 px-3 py-1 bg-white/50 backdrop-blur-sm border border-white text-gray-700 text-[10px] uppercase font-bold tracking-wider rounded-full shadow-sm">
                            Son {product.stock} Ürün
                        </div>
                    ) : (
                        <div className="flex items-center gap-1 px-3 py-1 bg-white/50 backdrop-blur-sm border border-white text-gray-700 text-[10px] uppercase font-bold tracking-[0.1em] rounded-full shadow-sm">
                            Yeni
                        </div>
                    )}

                    {/* Campaign badge */}
                    {discount && (
                        <div className={`flex items-center gap-1 px-3 py-1 text-white text-[10px] uppercase font-bold tracking-wider rounded-full shadow-sm bg-primary`}>
                            {discount.campaignType === 'FLASH_SALE'
                                ? <Zap size={10} />
                                : <Tag size={10} />
                            }
                            -%{discount.discountPercent} İndirim
                        </div>
                    )}

                    {/* compareAtPrice indirimi (kampanya yoksa) */}
                    {compareDiscount && (
                        <div className="flex items-center gap-1 px-3 py-1 bg-red-500 text-white text-[10px] uppercase font-bold tracking-wider rounded-full shadow-sm">
                            -%{compareDiscount}
                        </div>
                    )}
                </div>

                {/* Arrow Button (Hover view) like in design */}
                <div className="absolute top-1/2 left-3 -translate-y-1/2 z-20 w-8 h-8 bg-white/70 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-300 text-gray-600 cursor-pointer hover:bg-white hover:scale-105">
                    <span className="text-sm">←</span>
                </div>

                {/* Image */}
                {displayImage ? (
                    <div className="absolute inset-0 p-4">
                        <div className="relative w-full h-full">
                            <Image
                                src={displayImage.startsWith('http') ? displayImage : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/uploads/${displayImage}`}
                                alt={product.name}
                                fill
                                unoptimized
                                sizes="(max-width: 768px) 100vw, 50vw"
                                className="object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
                            />
                        </div>
                    </div>
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-primary/20 bg-transparent">
                        <span className="text-4xl opacity-50">📷</span>
                    </div>
                )}
            </div>

            {/* Content (No border, transparent background like design) */}
            <div className="flex flex-col flex-1 px-1">
                {/* Product Name */}
                <h3 className="font-semibold text-gray-900 text-sm mb-4 line-clamp-2 group-hover:text-primary transition-colors flex-1 leading-relaxed">
                    {product.name}
                </h3>

                {/* Campaign label */}
                {discount && (
                    <div className="flex items-center gap-1 text-[11px] text-rose-600 font-medium mb-2 truncate bg-rose-50 px-2 py-0.5 rounded w-fit">
                        <Zap size={10} /> {discount.campaignName}
                    </div>
                )}

                {/* Price & Action */}
                <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-2">
                        {discount ? (
                            <>
                                <span className="text-sm font-bold text-gray-900 leading-none">
                                    {displayPrice.toFixed(2)} ₺
                                </span>
                                <span className="text-xs text-gray-400 line-through leading-none">
                                    {price.toFixed(2)} ₺
                                </span>
                            </>
                        ) : compareAt && compareAt > price ? (
                            <>
                                <span className="text-sm font-bold text-gray-900 leading-none">
                                    {price.toFixed(2)} ₺
                                </span>
                                <span className="text-xs text-gray-400 line-through leading-none">
                                    {compareAt.toFixed(2)} ₺
                                </span>
                            </>
                        ) : (
                            <span className="text-sm font-bold text-gray-900 leading-none">
                                {price.toFixed(2)} ₺
                            </span>
                        )}
                    </div>

                    <button
                        onClick={handleAddToCart}
                        disabled={product.stock === 0}
                        className={`
                            flex items-center justify-center gap-1.5 px-3 py-1.5
                            text-white text-xs font-semibold
                            rounded-full transition-all duration-200
                            ${product.stock === 0
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-primary hover:bg-[#1a332a]'}
                        `}
                    >
                        {product.stock === 0 ? (
                            'Tükendi'
                        ) : (
                            <><Plus size={12} strokeWidth={3} /> Sepete Ekle</>
                        )}
                    </button>
                </div>
            </div>
        </Link>
    );
}
