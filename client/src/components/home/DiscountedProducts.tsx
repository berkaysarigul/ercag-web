'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import ProductCard from '@/components/products/ProductCard';
import { Zap, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function DiscountedProducts() {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/products/discounted?limit=8')
            .then(res => setProducts(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    // İndirimli ürün yoksa section'ı gösterme
    if (!loading && products.length === 0) return null;

    return (
        <section className="py-16 bg-red-50/30">
            <div className="container">
                <div className="flex items-end justify-between mb-8">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-red-600 bg-red-100 px-3 py-1.5 rounded-full">
                                <Zap size={12} /> Fırsat Ürünleri
                            </span>
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900">Kaçırılmayacak Fırsatlar</h2>
                        <p className="text-gray-500 mt-1">İndirimli ürünlerimizi keşfedin.</p>
                    </div>
                    <Link
                        href="/products?hasDiscount=true"
                        className="text-primary font-semibold text-sm hover:underline flex items-center gap-1"
                    >
                        Tümünü Gör <ArrowRight size={16} />
                    </Link>
                </div>

                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="aspect-[3/4] bg-gray-100 rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {products.map(p => <ProductCard key={p.id} product={p} />)}
                    </div>
                )}
            </div>
        </section>
    );
}
