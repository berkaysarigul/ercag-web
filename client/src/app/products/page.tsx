'use client';

import Link from "next/link";
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { useCart } from '@/context/CartContext';
import FilterSidebar from "@/components/FilterSidebar";
import { useSearchParams } from 'next/navigation';
import { Search, SlidersHorizontal, ChevronDown } from 'lucide-react';

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

    const [pagination, setPagination] = useState({
        page: 1,
        totalPages: 1,
        total: 0
    });

    const [showFilters, setShowFilters] = useState(false);

    // Listen for URL changes (e.g. from Header search)
    useEffect(() => {
        setFilters(prev => ({
            ...prev,
            search: searchParams.get('search') || '',
            categoryId: searchParams.get('category') || null,
        }));
        setPagination(prev => ({ ...prev, page: 1 })); // Reset page on filter change
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
            params.append('page', pagination.page.toString());
            params.append('limit', '12');

            const res = await api.get(`/products?${params.toString()}`);
            // Check if response is paginated (object with products) or array (legacy/error)
            if (res.data.products) {
                setProducts(res.data.products);
                setPagination(prev => ({
                    ...prev,
                    totalPages: res.data.totalPages,
                    total: res.data.total
                }));
            } else if (Array.isArray(res.data)) {
                setProducts(res.data);
            }
        } catch (error) {
            console.error('Failed to fetch products', error);
        } finally {
            setLoading(false);
        }
    }, [filters, pagination.page]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const handleFilterChange = (newFilters: { search?: string; category?: string; sort?: string; inStock?: boolean }) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            setPagination(prev => ({ ...prev, page: newPage }));
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    return (
        <div className="container py-8">
            <Breadcrumb />
            <div className="flex flex-col md:flex-row gap-8 py-8">
                {/* Sidebar */}
                <div className="w-full md:w-64 flex-shrink-0">
                    {/* Mobile toggle */}
                    <button
                        className="md:hidden w-full flex items-center justify-between bg-white rounded-xl border border-gray-200 p-4 mb-4 shadow-sm"
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <span className="font-semibold text-gray-700 flex items-center gap-2">
                            <SlidersHorizontal size={18} /> Filtreler
                        </span>
                        <ChevronDown size={18} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                    </button>

                    <div className={`${showFilters ? 'block' : 'hidden'} md:block`}>
                        <FilterSidebar
                            onFilterChange={handleFilterChange}
                            initialCategory={filters.categoryId ? Number(filters.categoryId) : null}
                        />
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1">
                    <div className="flex justify-between items-center mb-8">
                        <div className="flex items-center gap-4">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">
                                    {filters.search ? `"${filters.search}" için sonuçlar` : 'Tüm Ürünler'}
                                </h1>
                                {pagination.total > 0 && (
                                    <p className="text-sm text-gray-500 mt-1">{pagination.total} ürün bulundu</p>
                                )}
                            </div>
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
                                onChange={(e) => {
                                    setFilters(prev => ({ ...prev, sort: e.target.value }));
                                    setPagination(prev => ({ ...prev, page: 1 }));
                                }}
                                className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-white"
                            >
                                <option value="newest">En Yeni</option>
                                <option value="price_asc">Fiyat (Artan)</option>
                                <option value="price_desc">Fiyat (Azalan)</option>
                            </select>
                        </div>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {[...Array(8)].map((_, i) => (
                                <ProductCardSkeleton key={i} />
                            ))}
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
                                {products.map((product) => (
                                    <ProductCard key={product.id} product={product} />
                                ))}
                                {products.length === 0 && (
                                    <div className="col-span-full text-center py-16">
                                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Search size={32} className="text-gray-300" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-700 mb-2">Ürün Bulunamadı</h3>
                                        <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                                            {filters.search
                                                ? `"${filters.search}" ile eşleşen ürün yok. Farklı bir arama deneyin.`
                                                : 'Seçtiğiniz filtrelere uygun ürün bulunamadı.'
                                            }
                                        </p>
                                        <Link href="/products" className="btn btn-outline px-6">
                                            Filtreleri Temizle
                                        </Link>
                                    </div>
                                )}
                            </div>

                            {/* Pagination */}
                            {pagination.totalPages > 1 && (
                                <div className="flex justify-center items-center gap-1 mt-10">
                                    <button
                                        onClick={() => handlePageChange(pagination.page - 1)}
                                        disabled={pagination.page === 1}
                                        className="px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                    >
                                        ← Önceki
                                    </button>

                                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                                        .filter(p => p === 1 || p === pagination.totalPages || Math.abs(p - pagination.page) <= 1)
                                        .reduce((acc: (number | string)[], p, idx, arr) => {
                                            if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('...');
                                            acc.push(p);
                                            return acc;
                                        }, [])
                                        .map((p, idx) =>
                                            typeof p === 'string' ? (
                                                <span key={`dots-${idx}`} className="px-2 text-gray-400">…</span>
                                            ) : (
                                                <button
                                                    key={p}
                                                    onClick={() => handlePageChange(p as number)}
                                                    className={`w-10 h-10 text-sm rounded-lg font-medium transition-colors ${pagination.page === p
                                                        ? 'bg-brand-600 text-white shadow-md'
                                                        : 'border border-gray-200 hover:bg-gray-50 text-gray-700'
                                                        }`}
                                                >
                                                    {p}
                                                </button>
                                            )
                                        )}

                                    <button
                                        onClick={() => handlePageChange(pagination.page + 1)}
                                        disabled={pagination.page === pagination.totalPages}
                                        className="px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Sonraki →
                                    </button>
                                </div>
                            )}
                        </>
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
