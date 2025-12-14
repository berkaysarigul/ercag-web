'use client';

import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { cn } from '@/lib/utils';
import Breadcrumb from '@/components/ui/Breadcrumb';
import ReviewList from '@/components/reviews/ReviewList';
import ReviewForm from '@/components/reviews/ReviewForm';
import api from '@/lib/api';
import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';

interface Product {
    id: number;
    name: string;
    description: string;
    price: string;
    image: string | null;
    images?: { url: string; isMain: boolean }[];
    category: { name: string };
    stock: number;
}

export default function ProductDetailClient({ product }: { product: Product }) {
    const [activeTab, setActiveTab] = useState<'description' | 'specs' | 'reviews'>('description');
    const { addToCart } = useCart();
    const { user } = useAuth();
    const [reviews, setReviews] = useState([]);
    const [loadingReviews, setLoadingReviews] = useState(false);
    const [inWishlist, setInWishlist] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const [alertSubscribed, setAlertSubscribed] = useState(false);

    // Resolve initial images: If product.images exists, use it. Else fallback to [product.image].
    const allImages = product.images && product.images.length > 0
        ? product.images.map(img => img.url)
        : (product.image ? [product.image] : []);

    const [selectedImage, setSelectedImage] = useState<string | null>(allImages[0] || null);

    useEffect(() => {
        if (allImages.length > 0) {
            setSelectedImage(allImages[0]);
        }
    }, [product]);

    useEffect(() => {
        if (user) {
            api.get(`/wishlist/check/${product.id}`)
                .then(res => setInWishlist(res.data.inWishlist))
                .catch(err => console.error('Failed to check wishlist status', err));
        }
    }, [user, product.id]);

    const toggleWishlist = async () => {
        if (!user) {
            alert('Favorilere eklemek için giriş yapmalısınız.');
            return;
        }

        try {
            if (inWishlist) {
                await api.delete(`/wishlist/${product.id}`);
                setInWishlist(false);
            } else {
                await api.post('/wishlist', { productId: product.id });
                setInWishlist(true);
            }
        } catch (error) {
            console.error('Failed to toggle wishlist', error);
        }
    };

    const [stats, setStats] = useState({ average: 0, count: 0 });

    const fetchReviews = async () => {
        try {
            setLoadingReviews(true);
            const res = await api.get(`/reviews/${product.id}`);
            const data = res.data;
            setReviews(data);

            // Calculate Stats
            if (data.length > 0) {
                const total = data.reduce((acc: number, review: any) => acc + review.rating, 0);
                setStats({
                    average: total / data.length,
                    count: data.length
                });
            } else {
                setStats({ average: 0, count: 0 });
            }
        } catch (error) {
            console.error('Failed to fetch reviews', error);
        } finally {
            setLoadingReviews(false);
        }
    };

    useEffect(() => {
        fetchReviews();
    }, [product.id]);

    const getStockBadge = (stock: number) => {
        if (stock > 5) return <span className="bg-emerald-100 text-emerald-800 text-xs font-medium px-2.5 py-0.5 rounded">Stokta</span>;
        if (stock > 0) return <span className="bg-amber-100 text-amber-800 text-xs font-medium px-2.5 py-0.5 rounded">Sınırlı Stok ({stock} adet)</span>;
        return <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded">Tükendi</span>;
    };

    const handleStockAlert = async () => {
        if (!user) {
            toast.error('Lütfen önce giriş yapın');
            return;
        }
        try {
            await api.post('/stock-alerts', { productId: product.id });
            setAlertSubscribed(true);
            toast.success('Stok gelince size haber vereceğiz!');
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Bir hata oluştu');
        }
    };

    return (
        <div className="container py-8">
            <Breadcrumb productName={product.name} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                {/* Image Gallery */}
                <div className="space-y-4">
                    <div className="bg-gray-50 rounded-xl overflow-hidden aspect-square relative border group">
                        {selectedImage ? (
                            <img
                                src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/uploads/${selectedImage}`}
                                alt={product.name}
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300 cursor-zoom-in"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                Görsel Yok
                            </div>
                        )}
                        {/* Discount Badge if needed logic here */}
                    </div>
                    {/* Thumbnails */}
                    {allImages.length > 1 && (
                        <div className="grid grid-cols-5 gap-2">
                            {allImages.map((img, i) => (
                                <div
                                    key={i}
                                    onClick={() => setSelectedImage(img)}
                                    className={cn(
                                        "aspect-square rounded-lg bg-gray-50 border cursor-pointer overflow-hidden relative transition-all",
                                        selectedImage === img ? "border-[var(--primary)] ring-2 ring-[var(--primary)] ring-offset-1" : "hover:border-[var(--primary)]"
                                    )}
                                >
                                    <img
                                        src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/uploads/${img}`}
                                        alt={`${product.name} - ${i + 1}`}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Product Info */}
                <div className="space-y-6">
                    <div>
                        <div className="flex justify-between items-start">
                            <span className="text-sm text-gray-500 uppercase tracking-wider">{product.category?.name}</span>
                            {getStockBadge(product.stock)}
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 mt-1">{product.name}</h1>
                    </div>

                    <div className="flex items-end gap-4">
                        <div className="text-3xl font-bold text-[var(--primary)]">
                            {Number(product.price).toFixed(2)} ₺
                        </div>
                        {/* Dynamic Rating */}
                        <div className="flex items-center mb-1">
                            <span className="text-yellow-400 text-lg">
                                {'★'.repeat(Math.round(stats.average)) + '☆'.repeat(5 - Math.round(stats.average))}
                            </span>
                            <span className="text-sm text-gray-500 ml-1">({stats.count} yorum)</span>
                        </div>
                    </div>

                    {/* Preparation Time */}
                    <div className="flex items-center gap-2 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-100 w-fit">
                        <span className="text-xl">⏱️</span>
                        <span>Tahmini Hazırlanma Süresi: <strong>30–60 dakika</strong></span>
                    </div>

                    <div className="prose prose-sm text-gray-600">
                        <p>{product.description}</p>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-6 border-t space-y-4">
                        <div className="flex gap-4">
                            {product.stock > 0 ? (
                                <>
                                    <div className="flex items-center border border-gray-300 rounded-lg">
                                        <button
                                            className="px-4 py-2 hover:bg-gray-100"
                                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        >-</button>
                                        <span className="px-4 font-medium">{quantity}</span>
                                        <button
                                            className="px-4 py-2 hover:bg-gray-100"
                                            onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                                        >+</button>
                                    </div>
                                    <button
                                        onClick={() => {
                                            addToCart({ ...product, quantity });
                                            toast.success('Ürün sepete eklendi');
                                        }}
                                        className="btn btn-primary flex-1 text-lg"
                                    >
                                        Sepete Ekle
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={handleStockAlert}
                                    disabled={alertSubscribed}
                                    className={`btn w-full text-lg ${alertSubscribed ? 'btn-success text-white' : 'btn-outline'}`}
                                >
                                    {alertSubscribed ? '✅ Haber Verilecek' : '🔔 Gelince Haber Ver'}
                                </button>
                            )}
                            <button
                                onClick={toggleWishlist}
                                className={cn(
                                    "btn btn-outline px-6 text-2xl transition-colors",
                                    inWishlist ? "text-red-500 border-red-500 bg-red-50" : "text-gray-400 hover:text-red-500"
                                )}
                            >
                                {inWishlist ? '❤️' : '🤍'}
                            </button>
                        </div>

                        <div className="bg-blue-50 p-4 rounded-lg flex items-start gap-3 text-sm text-blue-800">
                            <span className="text-xl">🏪</span>
                            <div>
                                <span className="font-bold block">Mağazadan Teslim</span>
                                Siparişiniz hazırlandığında SMS ile bilgilendirileceksiniz. Ödemeyi mağazada yapabilirsiniz.
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="mt-16">
                <div className="flex border-b">
                    <button
                        onClick={() => setActiveTab('description')}
                        className={cn("px-8 py-4 font-medium border-b-2 transition-colors", activeTab === 'description' ? "border-[var(--primary)] text-[var(--primary)]" : "border-transparent text-gray-500 hover:text-gray-700")}
                    >
                        Açıklama
                    </button>
                    <button
                        onClick={() => setActiveTab('specs')}
                        className={cn("px-8 py-4 font-medium border-b-2 transition-colors", activeTab === 'specs' ? "border-[var(--primary)] text-[var(--primary)]" : "border-transparent text-gray-500 hover:text-gray-700")}
                    >
                        Özellikler
                    </button>
                    <button
                        onClick={() => setActiveTab('reviews')}
                        className={cn("px-8 py-4 font-medium border-b-2 transition-colors", activeTab === 'reviews' ? "border-[var(--primary)] text-[var(--primary)]" : "border-transparent text-gray-500 hover:text-gray-700")}
                    >
                        Yorumlar ({stats.count})
                    </button>
                </div>
                <div className="py-8">
                    {activeTab === 'description' && (
                        <div className="prose max-w-none">
                            <p>{product.description}</p>
                            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
                        </div>
                    )}
                    {activeTab === 'specs' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
                            <div className="flex justify-between border-b py-2">
                                <span className="text-gray-500">Marka</span>
                                <span className="font-medium">Faber-Castell</span>
                            </div>
                            <div className="flex justify-between border-b py-2">
                                <span className="text-gray-500">Renk</span>
                                <span className="font-medium">Mavi</span>
                            </div>
                            <div className="flex justify-between border-b py-2">
                                <span className="text-gray-500">Materyal</span>
                                <span className="font-medium">Plastik</span>
                            </div>
                        </div>
                    )}
                    {activeTab === 'reviews' && (
                        <div className="max-w-3xl">
                            {user ? (
                                <ReviewForm productId={product.id} onReviewAdded={fetchReviews} />
                            ) : (
                                <div className="bg-gray-50 p-6 rounded-xl border mb-8 text-center">
                                    <p className="text-gray-600 mb-4">Yorum yapmak için giriş yapmalısınız.</p>
                                    <Link href="/auth" className="btn btn-primary inline-block">
                                        Giriş Yap
                                    </Link>
                                </div>
                            )}
                            {loadingReviews ? (
                                <div>Yorumlar yükleniyor...</div>
                            ) : (
                                <ReviewList reviews={reviews} />
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
