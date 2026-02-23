'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import ProductCard from '@/components/products/ProductCard';

interface Product {
    id: number;
    name: string;
    price: number;
    image: string;
    category: { id?: number; name: string };
    categoryId?: number;
    stock: number;
    rating?: number;
    reviewCount?: number;
    isFeatured?: boolean;
}

export default function FeaturedProducts() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/products?isFeatured=true&limit=8')
            .then(res => {
                const items = Array.isArray(res.data) ? res.data : res.data.products || [];
                setProducts(items.slice(0, 4));
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div className="container py-20 bg-white">
            <div className="flex justify-between items-end mb-12">
                <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="bg-gray-50 rounded-2xl p-4 h-[400px] animate-pulse" />
                ))}
            </div>
        </div>
    );

    if (products.length === 0) return null;

    return (
        <section className="py-20 bg-white">
            <div className="container">
                <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">Çok Satan Ürünler</h2>
                        <p className="text-gray-500">Müşterilerimizin en çok tercih ettiği ürünleri keşfedin.</p>
                    </div>
                    <Link href="/products" className="btn btn-outline border-gray-200 hover:border-primary hover:text-primary transition-all">
                        Tüm Ürünleri Gör
                    </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {products.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            </div>
        </section>
    );
}
