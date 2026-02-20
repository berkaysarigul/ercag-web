'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, X, Loader2 } from 'lucide-react';
import api from '@/lib/api';

export default function SearchAutocomplete() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<{ products: any[], categories: any[] }>({ products: [], categories: [] });
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const fetchSuggestions = async () => {
            if (query.length < 2) {
                setResults({ products: [], categories: [] });
                return;
            }

            setLoading(true);
            try {
                const res = await api.get(`/products/search/suggestions?q=${encodeURIComponent(query)}`);
                setResults(res.data);
                setIsOpen(true);
            } catch (error) {
                console.error('Search error', error);
            } finally {
                setLoading(false);
            }
        };

        const debounce = setTimeout(fetchSuggestions, 300);
        return () => clearTimeout(debounce);
    }, [query]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            setIsOpen(false);
            router.push(`/products?search=${encodeURIComponent(query)}`);
        }
    };

    return (
        <div ref={wrapperRef} className="relative w-full max-w-xl">
            <form onSubmit={handleSubmit} className="relative">
                <input
                    type="text"
                    placeholder="Ürün, kategori veya marka ara..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-full border border-gray-200 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 bg-gray-50/50 transition-all text-sm"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => query.length >= 2 && setIsOpen(true)}
                />
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                {loading && <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 text-primary-500 w-4 h-4 animate-spin" />}
            </form>

            {isOpen && (results.products.length > 0 || results.categories.length > 0) && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
                    {/* Categories */}
                    {results.categories.length > 0 && (
                        <div className="p-2 bg-gray-50/50">
                            <p className="text-xs font-semibold text-gray-500 px-2 py-1 uppercase tracking-wider">Kategoriler</p>
                            {results.categories.map((cat: any) => (
                                <Link
                                    key={cat.id}
                                    href={`/products?categoryId=${cat.id}`}
                                    className="block px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
                                    onClick={() => setIsOpen(false)}
                                >
                                    {cat.name}
                                </Link>
                            ))}
                        </div>
                    )}

                    {/* Products */}
                    {results.products.length > 0 && (
                        <div className="p-2">
                            <p className="text-xs font-semibold text-gray-500 px-2 py-1 uppercase tracking-wider">Ürünler</p>
                            {results.products.map((product: any) => (
                                <Link
                                    key={product.id}
                                    href={`/products/${product.id}`}
                                    className="flex items-center gap-3 px-2 py-2 hover:bg-gray-50 rounded-lg group transition-colors"
                                    onClick={() => setIsOpen(false)}
                                >
                                    <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-200">
                                        {product.images?.[0]?.url ? (
                                            <img src={`${process.env.NEXT_PUBLIC_API_URL}${product.images[0].url}`} alt={product.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                <Package className="w-5 h-5" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate group-hover:text-primary-600">{product.name}</p>
                                        <p className="text-xs text-gray-500 font-medium">{Number(product.price).toFixed(2)} ₺</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}

                    <div className="p-2 border-t border-gray-100 bg-gray-50 text-center">
                        <button
                            onClick={handleSubmit}
                            className="text-xs font-medium text-primary-600 hover:text-primary-700 hover:underline"
                        >
                            Tüm sonuçları gör ({query})
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

import { Package } from 'lucide-react';
