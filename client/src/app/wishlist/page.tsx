'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useCampaigns } from '@/context/CampaignContext';
import { Trash2, HeartOff } from 'lucide-react';
import Breadcrumb from '@/components/ui/Breadcrumb';

interface WishlistItem {
    id: number;
    productId: number;
    product: {
        id: number;
        name: string;
        price: string;
        image: string | null;
        category: { name: string };
    };
}

export default function WishlistPage() {
    const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
    const [loading, setLoading] = useState(true);
    const { addToCart } = useCart();
    const { getProductDiscount } = useCampaigns();

    const fetchWishlist = async () => {
        try {
            const res = await api.get('/wishlist');
            setWishlist(res.data);
        } catch (error) {
            console.error('Failed to fetch wishlist', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWishlist();
    }, []);

    const handleRemove = async (productId: number) => {
        try {
            await api.delete(`/wishlist/${productId}`);
            setWishlist(prev => prev.filter(item => item.productId !== productId));
        } catch (error) {
            console.error('Failed to remove from wishlist', error);
        }
    };

    if (loading) return <div className="container pt-28 pb-12 text-center">Yükleniyor...</div>;

    return (
        <div className="container pt-28 pb-8">
            <Breadcrumb />
            <div className="flex items-center justify-between mb-8 mt-6">
                <h1 className="text-3xl font-bold text-gray-900">Favorilerim</h1>
                {wishlist.length > 0 && (
                    <span className="text-gray-500 bg-gray-100 px-3 py-1 rounded-full text-sm font-medium">{wishlist.length} Ürün</span>
                )}
            </div>

            {wishlist.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                        <HeartOff size={32} className="text-gray-300" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Favorileriniz Boş</h3>
                    <p className="text-gray-500 mb-6">Beğendiğiniz ürünleri favorilerinize ekleyerek daha sonra kolayca bulabilirsiniz.</p>
                    <Link href="/products" className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-md hover:shadow-lg inline-flex items-center justify-center">
                        Alışverişe Başla
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {wishlist.map((item) => (
                        <div key={item.id} className="card flex flex-col relative group">
                            <button
                                onClick={() => handleRemove(item.productId)}
                                className="absolute top-2 right-2 bg-white p-2 rounded-full shadow-md z-10 text-red-500 hover:bg-red-50 transition-colors"
                                title="Favorilerden Kaldır"
                            >
                                <Trash2 size={16} />
                            </button>
                            <Link href={`/products/${item.product.id}`} className="flex-1 flex flex-col text-inherit no-underline">
                                <div className="aspect-square bg-gray-100 rounded-lg mb-4 overflow-hidden relative">
                                    {item.product.image ? (
                                        <img
                                            src={item.product.image.startsWith('http') ? item.product.image : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/uploads/${item.product.image}`}
                                            alt={item.product.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                            Görsel Yok
                                        </div>
                                    )}
                                </div>
                                <h3 className="font-semibold mb-1">{item.product.name}</h3>
                                <p className="text-sm text-gray-500 mb-2">{item.product.category.name}</p>
                                <div className="mt-auto">
                                    {(() => {
                                        const price = Number(item.product.price);
                                        const categoryId = item.product.category?.name ? (item.product as any).categoryId : undefined;
                                        const discount = getProductDiscount(item.product.id, categoryId, price);
                                        return discount ? (
                                            <div className="flex flex-col">
                                                <span className="text-xs text-gray-400 line-through">{price.toFixed(2)} ₺</span>
                                                <span className="font-bold text-red-600">{discount.discountedPrice.toFixed(2)} ₺</span>
                                            </div>
                                        ) : (
                                            <span className="text-lg font-bold text-blue-600">{price.toFixed(2)} ₺</span>
                                        );
                                    })()}
                                </div>
                            </Link>
                            <button
                                className="w-full py-3 mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-md hover:shadow-lg flex items-center justify-center"
                                onClick={() => addToCart({ ...item.product, id: item.productId } as any)}
                            >
                                Sepete Ekle
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
