'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';

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

    if (loading) return <div className="container py-12 text-center">Yükleniyor...</div>;

    return (
        <div className="container py-8">
            <h1 className="text-2xl font-bold mb-8">Favorilerim</h1>

            {wishlist.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <p className="text-gray-500 mb-4">Favori listeniz boş.</p>
                    <Link href="/products" className="btn btn-primary">
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
                                🗑️
                            </button>
                            <Link href={`/products/${item.product.id}`} className="flex-1 flex flex-col text-inherit no-underline">
                                <div className="aspect-square bg-gray-100 rounded-lg mb-4 overflow-hidden relative">
                                    {item.product.image ? (
                                        <img
                                            src={`http://localhost:3001/uploads/${item.product.image}`}
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
                                <div className="mt-auto flex justify-between items-center">
                                    <span className="font-bold text-[var(--primary)]">
                                        {Number(item.product.price).toFixed(2)} ₺
                                    </span>
                                </div>
                            </Link>
                            <button
                                className="btn btn-primary w-full mt-4"
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
