'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import api from '@/lib/api';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useCampaigns } from '@/context/CampaignContext';
import Link from 'next/link';
import Script from 'next/script';
import { toast } from 'sonner';
import { FileText, X, Share2, Star, Clock, Heart, Bell, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import ReviewList from '@/components/reviews/ReviewList';
import ProductCard from '@/components/products/ProductCard';
import ReviewForm from '@/components/reviews/ReviewForm';

interface Product {
    id: number;
    name: string;
    description: string;
    price: string;
    image: string | null;
    images?: { url: string; isMain: boolean }[];
    category: { id?: number; name: string };
    brand?: { id: number; name: string } | null;
    stock: number;
    rating?: number;
    numReviews?: number;
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

    // Initialize stats from product prop (Server Side / Static Data)
    const [stats, setStats] = useState({
        average: product.rating || 0,
        count: product.numReviews || 0
    });

    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [relatedProducts, setRelatedProducts] = useState<any[]>([]);

    // === VARYANT STATE ===
    const [variants, setVariants] = useState<any[]>([]);
    const [selectedAttributes, setSelectedAttributes] = useState<Record<number, number>>({}); // typeId -> valueId
    const [selectedVariant, setSelectedVariant] = useState<any>(null);

    // Varyantları çek
    useEffect(() => {
        api.get(`/variants/product/${product.id}`).then(res => {
            setVariants(res.data);
        }).catch(() => { });
    }, [product.id]);

    // Özellik tiplerini varyantlardan çıkar
    const attributeTypes = useMemo(() => {
        const typeMap = new Map<number, any>();
        variants.forEach(v => {
            v.attributes?.forEach((attr: any) => {
                const type = attr.attributeValue.attributeType;
                if (!typeMap.has(type.id)) {
                    typeMap.set(type.id, { ...type, values: new Map() });
                }
                const val = attr.attributeValue;
                typeMap.get(type.id).values.set(val.id, val);
            });
        });
        return Array.from(typeMap.values()).map((t: any) => ({
            ...t,
            values: Array.from(t.values.values())
        }));
    }, [variants]);

    // Seçilen özelliklere göre varyant bul
    useEffect(() => {
        if (attributeTypes.length === 0 || Object.keys(selectedAttributes).length < attributeTypes.length) {
            setSelectedVariant(null);
            return;
        }
        const match = variants.find(v => {
            const variantValueIds = v.attributes.map((a: any) => a.attributeValueId);
            return Object.values(selectedAttributes).every((valId: any) => variantValueIds.includes(valId));
        });
        setSelectedVariant(match || null);
    }, [selectedAttributes, variants, attributeTypes]);

    useEffect(() => {
        if (product.category) {
            const catId = (product as any).categoryId || product.category?.id || '';
            api.get(`/products?categoryId=${catId}&limit=5`)
                .then(res => {
                    const items = Array.isArray(res.data) ? res.data : res.data.products || [];
                    setRelatedProducts(items.filter((p: any) => p.id !== product.id).slice(0, 4));
                })
                .catch(() => { });
        }
    }, [product.id, product.category]);

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

    // ... existing ...

    const fetchReviews = async () => {
        try {
            setLoadingReviews(true);
            const res = await api.get(`/reviews/${product.id}`);
            const data = res.data;
            setReviews(data);

            // Update stats from fresh reviews (client-side sync)
            if (data.length > 0) {
                const total = data.reduce((acc: number, review: { rating: number }) => acc + review.rating, 0);
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
        } catch (error: unknown) {
            const errResponse = (error as any)?.response;
            toast.error(errResponse?.data?.error || 'Bir hata oluştu');
        }
    };

    const { getProductDiscount } = useCampaigns();
    const basePrice = Number(product.price);
    const categoryId = product.category?.id || (product as any).categoryId;
    const discount = getProductDiscount(product.id, categoryId, basePrice);

    // Varyant seçiliyse varyant fiyatını kullan, yoksa kampanya fiyatını
    const variantPrice = selectedVariant?.price ? Number(selectedVariant.price) : null;
    const displayPrice = variantPrice ?? (discount ? discount.discountedPrice : basePrice);
    const displayStock = selectedVariant ? selectedVariant.stock : product.stock;

    const handleAddToCart = () => {
        if (variants.length > 0 && !selectedVariant) {
            toast.error('Lütfen seçenekleri belirleyin');
            return;
        }
        addToCart({
            ...product,
            price: displayPrice,
            quantity,
            ...(selectedVariant ? {
                variantId: selectedVariant.id,
                variantLabel: selectedVariant.attributes.map((a: any) => a.attributeValue.value).join(' / '),
            } : {}),
        });
        toast.success('Ürün sepete eklendi');
    };

    return (
        <div className="container pt-28 pb-8">
            <Script
                id="product-jsonld"
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'Product',
                        name: product.name,
                        description: product.description,
                        image: product.image
                            ? (product.image.startsWith('http') ? product.image : `${process.env.NEXT_PUBLIC_API_URL || ''}/uploads/${product.image}`)
                            : undefined,
                        category: product.category?.name,
                        offers: {
                            '@type': 'Offer',
                            price: displayPrice.toFixed(2),
                            priceCurrency: 'TRY',
                            availability: displayStock > 0
                                ? 'https://schema.org/InStock'
                                : 'https://schema.org/OutOfStock',
                            seller: {
                                '@type': 'Organization',
                                name: 'Erçağ Kırtasiye',
                            }
                        },
                        ...(stats.count > 0 ? {
                            aggregateRating: {
                                '@type': 'AggregateRating',
                                ratingValue: stats.average.toFixed(1),
                                reviewCount: stats.count,
                            }
                        } : {})
                    })
                }}
            />
            <nav className="flex text-sm text-gray-500 mb-6" aria-label="Breadcrumb">
                <ol className="inline-flex items-center space-x-1">
                    <li><Link href="/" className="hover:text-blue-600 transition-colors">Ana Sayfa</Link></li>
                    <span className="mx-2 text-gray-300">/</span>
                    <li><Link href="/products" className="hover:text-blue-600 transition-colors">Ürünler</Link></li>
                    <span className="mx-2 text-gray-300">/</span>
                    <li><Link href={`/products?category=${product.category?.id || ''}`} className="hover:text-blue-600 transition-colors">{product.category?.name}</Link></li>
                    <span className="mx-2 text-gray-300">/</span>
                    <li className="text-gray-900 font-medium truncate max-w-[200px]">{product.name}</li>
                </ol>
            </nav>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                {/* Image Gallery */}
                <div className="space-y-4">
                    <div className="bg-gray-50 rounded-xl overflow-hidden aspect-square relative border group">
                        {selectedImage ? (
                            <Image
                                src={selectedImage.startsWith('http') ? selectedImage : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/uploads/${selectedImage}`}
                                alt={product.name}
                                fill
                                unoptimized
                                sizes="(max-width: 768px) 100vw, 50vw"
                                priority
                                className="object-cover hover:scale-105 transition-transform duration-300 cursor-zoom-in"
                                onClick={() => setLightboxOpen(true)}
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                Görsel Yok
                            </div>
                        )}
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
                                        selectedImage === img ? "border-blue-600 ring-2 ring-blue-600 ring-offset-1" : "hover:border-blue-600"
                                    )}
                                >
                                    <Image
                                        src={img.startsWith('http') ? img : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/uploads/${img}`}
                                        alt={`${product.name} - ${i + 1}`}
                                        fill
                                        unoptimized
                                        sizes="20vw"
                                        loading="lazy"
                                        className="object-cover"
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
                            <div className="flex flex-col">
                                {product.brand && (
                                    <Link href={`/brands/${product.brand.id}`} className="text-sm font-bold text-primary hover:underline uppercase tracking-wide mb-1">
                                        {product.brand.name}
                                    </Link>
                                )}
                                <span className="text-xs text-gray-500 uppercase tracking-wider">{product.category?.name}</span>
                            </div>
                            {getStockBadge(displayStock)}
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 mt-1">{product.name}</h1>
                    </div>

                    <div className="flex items-end gap-4">
                        <div>
                            {discount && !variantPrice ? (
                                <>
                                    <div className="text-lg text-gray-400 line-through">{basePrice.toFixed(2)} ₺</div>
                                    <div className="text-3xl font-bold text-red-600">{displayPrice.toFixed(2)} ₺</div>
                                </>
                            ) : (
                                <div className="text-3xl font-bold text-blue-600">{displayPrice.toFixed(2)} ₺</div>
                            )}
                        </div>
                        {discount && !variantPrice && (
                            <span className="px-3 py-1 bg-red-100 text-red-700 text-sm font-bold rounded-full">
                                %{discount.discountPercent} İndirim
                            </span>
                        )}
                        {/* Dynamic Rating */}
                        <div className="flex items-center mb-1">
                            <span className="text-yellow-400 text-lg">
                                {'★'.repeat(Math.round(stats.average)) + '☆'.repeat(5 - Math.round(stats.average))}
                            </span>
                            <span className="text-sm text-gray-500 ml-1">({stats.count} yorum)</span>
                        </div>
                    </div>

                    {discount && !variantPrice && (
                        <div className="flex items-center gap-2 text-sm font-medium text-orange-600 bg-orange-50 px-3 py-2 rounded-lg border border-orange-100 w-fit">
                            {discount.campaignType === 'FLASH_SALE' ? '⚡' : '🏷️'} {discount.campaignName}
                        </div>
                    )}

                    {/* Preparation Time */}
                    <div className="flex items-center gap-2 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-100 w-fit">
                        <Clock size={18} className="text-blue-600" />
                        <span>Tahmini Hazırlanma Süresi: <strong>30–60 dakika</strong></span>
                    </div>

                    <div className="prose prose-sm text-gray-600">
                        <p>{product.description}</p>
                    </div>

                    {/* === VARYANT SEÇİCİ === */}
                    {attributeTypes.length > 0 && (
                        <div className="space-y-4">
                            {attributeTypes.map((type: any) => (
                                <div key={type.id}>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">{type.name}</label>
                                    <div className="flex flex-wrap gap-2">
                                        {type.values.map((val: any) => {
                                            const isSelected = selectedAttributes[type.id] === val.id;
                                            const isColor = !!val.colorHex;

                                            return isColor ? (
                                                <button
                                                    key={val.id}
                                                    type="button"
                                                    onClick={() => setSelectedAttributes(prev => ({ ...prev, [type.id]: val.id }))}
                                                    className={`w-9 h-9 rounded-full border-2 transition-all ${isSelected ? 'border-primary ring-2 ring-primary/30 scale-110' : 'border-gray-300 hover:border-gray-400'}`}
                                                    style={{ backgroundColor: val.colorHex }}
                                                    title={val.value}
                                                />
                                            ) : (
                                                <button
                                                    key={val.id}
                                                    type="button"
                                                    onClick={() => setSelectedAttributes(prev => ({ ...prev, [type.id]: val.id }))}
                                                    className={`px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all ${isSelected
                                                        ? 'border-primary bg-primary/5 text-primary'
                                                        : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                                                >
                                                    {val.value}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}

                            {/* Varyant bulunamadı uyarısı */}
                            {Object.keys(selectedAttributes).length === attributeTypes.length && !selectedVariant && (
                                <p className="text-sm text-red-500">Bu kombinasyon mevcut değil.</p>
                            )}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="pt-6 border-t space-y-4">
                        <div className="flex gap-4">
                            {displayStock > 0 ? (
                                <>
                                    <div className="flex items-center border border-gray-300 rounded-lg">
                                        <button
                                            className="px-4 py-2 hover:bg-gray-100"
                                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        >-</button>
                                        <span className="px-4 font-medium">{quantity}</span>
                                        <button
                                            className="px-4 py-2 hover:bg-gray-100"
                                            onClick={() => setQuantity(Math.min(displayStock, quantity + 1))}
                                        >+</button>
                                    </div>
                                    <button
                                        onClick={handleAddToCart}
                                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-md hover:shadow-lg flex-1 text-lg py-3 flex items-center justify-center gap-2"
                                    >
                                        Sepete Ekle
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={handleStockAlert}
                                    disabled={alertSubscribed}
                                    className={`py-3 px-6 rounded-xl font-bold w-full text-lg transition-all ${alertSubscribed ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md' : 'border-2 border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'}`}
                                >
                                    {alertSubscribed ? <span className="flex items-center justify-center gap-2"><CheckCircle size={18} /> Haber Verilecek</span> : <span className="flex items-center justify-center gap-2"><Bell size={18} /> Gelince Haber Ver</span>}
                                </button>
                            )}
                            <button
                                onClick={toggleWishlist}
                                className={cn(
                                    "border-2 rounded-xl px-6 text-2xl transition-all flex items-center justify-center hover:shadow-md",
                                    inWishlist ? "border-red-500 bg-red-50 text-red-500" : "border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200"
                                )}
                            >
                                {inWishlist ? <Heart size={24} className="fill-red-500 text-red-500" /> : <Heart size={24} />}
                            </button>
                        </div>

                        <div className="flex items-center gap-3 pt-4 text-sm text-gray-500">
                            <span className="font-medium">Paylaş:</span>
                            <button
                                onClick={() => {
                                    if (navigator.share) {
                                        navigator.share({ title: product.name, url: window.location.href });
                                    } else {
                                        navigator.clipboard.writeText(window.location.href);
                                        toast.success('Link kopyalandı!');
                                    }
                                }}
                                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                title="Paylaş"
                            >
                                <Share2 size={16} />
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
                        className={cn("px-8 py-4 font-medium border-b-2 transition-colors", activeTab === 'description' ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700")}
                    >
                        Açıklama
                    </button>
                    <button
                        onClick={() => setActiveTab('specs')}
                        className={cn("px-8 py-4 font-medium border-b-2 transition-colors", activeTab === 'specs' ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700")}
                    >
                        Özellikler
                    </button>
                    <button
                        onClick={() => setActiveTab('reviews')}
                        className={cn("px-8 py-4 font-medium border-b-2 transition-colors", activeTab === 'reviews' ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700")}
                    >
                        Yorumlar ({stats.count})
                    </button>
                </div>
                <div className="py-8">
                    {activeTab === 'description' && (
                        <div className="prose max-w-none">
                            <p>{product.description}</p>
                        </div>
                    )}
                    {activeTab === 'specs' && (
                        <div className="bg-gray-50 rounded-xl p-8 text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FileText size={24} className="text-gray-400" />
                            </div>
                            <h3 className="font-semibold text-gray-700 mb-2">Teknik Bilgiler</h3>
                            <p className="text-gray-500 text-sm">Bu ürüne ait detaylı teknik bilgiler yakında eklenecektir.</p>
                        </div>
                    )}
                    {activeTab === 'reviews' && (
                        <div className="max-w-3xl">
                            {/* Rating Summary */}
                            {stats.count > 0 && (
                                <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-6 mb-8 border border-amber-100 flex items-center gap-8">
                                    <div className="text-center">
                                        <div className="text-5xl font-bold text-gray-900">{stats.average.toFixed(1)}</div>
                                        <div className="flex justify-center mt-1">
                                            {[1, 2, 3, 4, 5].map(s => (
                                                <Star key={s} size={16} className={s <= Math.round(stats.average) ? "fill-amber-400 text-amber-400" : "text-gray-300"} />
                                            ))}
                                        </div>
                                        <p className="text-sm text-gray-500 mt-1">{stats.count} değerlendirme</p>
                                    </div>
                                    <div className="flex-1 space-y-1.5">
                                        {[5, 4, 3, 2, 1].map(star => {
                                            const count = reviews.filter((r: any) => r.rating === star).length;
                                            const pct = stats.count > 0 ? (count / stats.count) * 100 : 0;
                                            return (
                                                <div key={star} className="flex items-center gap-2 text-sm">
                                                    <span className="w-3 text-gray-500">{star}</span>
                                                    <Star size={12} className="fill-amber-400 text-amber-400" />
                                                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                        <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                                                    </div>
                                                    <span className="w-8 text-right text-gray-400 text-xs">{count}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {user ? (
                                <ReviewForm productId={product.id} onReviewAdded={fetchReviews} />
                            ) : (
                                <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 mb-8 text-center">
                                    <p className="text-gray-600 mb-4 font-medium">Yorum yapmak için giriş yapmalısınız.</p>
                                    <Link href="/auth" className="inline-flex py-2.5 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-sm">
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

            {relatedProducts.length > 0 && (
                <section className="mt-16 pt-16 border-t border-gray-100">
                    <div className="flex justify-between items-end mb-8">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Benzer Ürünler</h2>
                            <p className="text-gray-500 text-sm mt-1">{product.category?.name} kategorisinden</p>
                        </div>
                        <Link href={`/products?category=${(product as any).categoryId || product.category?.id || ''}`} className="text-sm font-semibold text-blue-600 hover:underline">
                            Tümünü Gör →
                        </Link>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {relatedProducts.map(p => (
                            <ProductCard key={p.id} product={p} />
                        ))}
                    </div>
                </section>
            )}

            {lightboxOpen && selectedImage && (
                <div
                    className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4 cursor-zoom-out"
                    onClick={() => setLightboxOpen(false)}
                >
                    <button
                        className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                        onClick={() => setLightboxOpen(false)}
                    >
                        <X size={24} />
                    </button>
                    <img
                        src={selectedImage.startsWith('http') ? selectedImage : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/uploads/${selectedImage}`}
                        alt={product.name}
                        className="max-w-full max-h-[90vh] object-contain rounded-lg"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
}
