'use client';

import Link from "next/link";
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { useCart } from '@/context/CartContext';
import FilterSidebar from "@/components/FilterSidebar";
import { useSearchParams } from 'next/navigation';

interface Product {
    id: number;
    name: string;
    price: string;
    category: { name: string };
    image: string | null;
}

import { Suspense } from 'react';
import { ProductCardSkeleton } from "@/components/products/ProductCardSkeleton";
import ProductCard from "@/components/products/ProductCard";
import Breadcrumb from '@/components/ui/Breadcrumb';

function ProductList() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const { addToCart } = useCart();
    const searchParams = useSearchParams();

    const [filters, setFilters] = useState({
        categoryId: searchParams.get('category') || null,
        minPrice: searchParams.get('minPrice') || '',
        maxPrice: searchParams.get('maxPrice') || '',
        search: searchParams.get('search') || '',
        sort: searchParams.get('sort') || 'newest'
    });

    // Listen for URL changes (e.g. from Header search)
    useEffect(() => {
        setFilters(prev => ({
            ...prev,
            search: searchParams.get('search') || '',
            categoryId: searchParams.get('category') || null,
        }));
    }, [searchParams]);

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.categoryId) params.append('categoryId', filters.categoryId.toString());
            if (filters.minPrice) params.append('minPrice', filters.minPrice);
            if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
            if (filters.search) params.append('search', filters.search);
            if (filters.sort) params.append('sort', filters.sort);

            const res = await api.get(`/products?${params.toString()}`);
            setProducts(res.data);
        } catch (error) {
            console.error('Failed to fetch products', error);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const handleFilterChange = (newFilters: any) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
    };

    return (
        <div className="container py-8">
            <Breadcrumb />
            <div className="flex flex-col md:flex-row gap-8 py-8">
                {/* Sidebar */}
                <div className="w-full md:w-64 flex-shrink-0">
                    <FilterSidebar
                        onFilterChange={handleFilterChange}
                        initialCategory={filters.categoryId ? Number(filters.categoryId) : null}
                    />
                </div>

                {/* Main Content */}
                <div className="flex-1">
                    <div className="flex justify-between items-center mb-8">
                        <div className="flex items-center gap-4">
                            <h1 className="text-3xl font-bold text-gray-900">
                                {filters.search ? `"${filters.search}" için sonuçlar` : 'Tüm Ürünler'}
                            </h1>
                            {filters.search && (
                                <Link
                                    href="/products"
                                    className="text-sm bg-red-100 text-red-600 px-3 py-1 rounded-full hover:bg-red-200 transition-colors flex items-center gap-1"
                                >
                                    Aramayı Temizle
                                </Link>
                            )}
                        </div>

                        <div className="flex items-center gap-4">
                            <select
                                value={filters.sort}
                                onChange={(e) => setFilters(prev => ({ ...prev, sort: e.target.value }))}
                                className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-white"
                            >
                                <option value="newest">En Yeni</option>
                                <option value="price_asc">Fiyat (Artan)</option>
                                <option value="price_desc">Fiyat (Azalan)</option>
                            </select>
                        </div>
                    </div>

                    {loading ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '2rem' }}>
                            {[...Array(8)].map((_, i) => (
                                <ProductCardSkeleton key={i} />
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {products.map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                            {products.length === 0 && (
                                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                                    Aradığınız kriterlere uygun ürün bulunamadı.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function ProductsPage() {
    return (
        <Suspense fallback={<div className="container py-8"><ProductCardSkeleton /></div>}>
            <ProductList />
        </Suspense>
    );
}
