'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import {
    BookOpen, PenTool, Palette, FileText, FolderOpen, Scissors,
    Backpack, Briefcase, Music, Package, ChevronRight, ArrowRight, Loader2
} from 'lucide-react';

interface Product {
    id: number;
    name: string;
    price: number | string;
    image: string | null;
}

interface Category {
    id: number;
    name: string;
    image: string | null;
    products: Product[];
    _count: { products: number };
    children?: { id: number; name: string; _count: { products: number } }[];
    totalProducts?: number;
}

function getCategoryIcon(name: string) {
    const lower = name.toLowerCase();
    if (lower.includes('defter')) return BookOpen;
    if (lower.includes('kalem')) return PenTool;
    if (lower.includes('boya') || lower.includes('sanat')) return Palette;
    if (lower.includes('kağıt')) return FileText;
    if (lower.includes('dosya')) return FolderOpen;
    if (lower.includes('makas')) return Scissors;
    if (lower.includes('okul')) return Backpack;
    if (lower.includes('ofis')) return Briefcase;
    if (lower.includes('müzik')) return Music;
    return Package;
}

const CATEGORY_COLORS = [
    'bg-emerald-50 text-emerald-600',
    'bg-blue-50 text-blue-600',
    'bg-amber-50 text-amber-600',
    'bg-purple-50 text-purple-600',
    'bg-rose-50 text-rose-600',
    'bg-cyan-50 text-cyan-600',
    'bg-orange-50 text-orange-600',
    'bg-teal-50 text-teal-600',
];

interface MegaMenuProps {
    isOpen: boolean;
    onClose: () => void;
    isDark: boolean; // header scroll durumuna göre renk
}

export default function MegaMenu({ isOpen, onClose, isDark }: MegaMenuProps) {
    const [categories, setCategories] = useState<Category[]>([]);
    const [activeCategory, setActiveCategory] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [fetched, setFetched] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const closeTimerRef = useRef<NodeJS.Timeout | null>(null);

    // İlk açılışta veri çek (sadece 1 kere)
    useEffect(() => {
        if (isOpen && !fetched) {
            setLoading(true);
            api.get('/categories/mega-menu')
                .then(res => {
                    setCategories(res.data);
                    if (res.data.length > 0) setActiveCategory(res.data[0].id);
                    setFetched(true);
                })
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [isOpen, fetched]);

    // İlk kategoriyi aktif yap her açılışta
    useEffect(() => {
        if (isOpen && categories.length > 0 && activeCategory === null) {
            setActiveCategory(categories[0].id);
        }
    }, [isOpen, categories]);

    const activeCat = categories.find(c => c.id === activeCategory);
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    const getProductImage = (img: string | null) => {
        if (!img) return null;
        if (img.startsWith('http')) return img;
        return `${apiBase}/uploads/${img}`;
    };

    // Menü dışına çıkınca kısa bir gecikmeyle kapat
    const handleMouseLeave = () => {
        closeTimerRef.current = setTimeout(() => {
            onClose();
        }, 200);
    };

    const handleMouseEnter = () => {
        if (closeTimerRef.current) {
            clearTimeout(closeTimerRef.current);
            closeTimerRef.current = null;
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop — tıkla kapat */}
            <div className="fixed inset-0 z-40" onClick={onClose} />

            {/* Menu Panel */}
            <div
                ref={menuRef}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                className="absolute top-full left-1/2 -translate-x-1/2 mt-3 z-50 w-[900px] max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-gray-200/80 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
                style={{ animation: 'megaMenuIn 0.2s ease-out' }}
            >
                <div className="flex min-h-[420px] max-h-[70vh]">

                    {/* ── Sol Panel: Kategoriler ── */}
                    <div className="w-[260px] bg-gray-50/70 border-r border-gray-100 py-3 overflow-y-auto shrink-0">
                        {loading ? (
                            <div className="flex items-center justify-center h-full">
                                <Loader2 size={24} className="animate-spin text-gray-400" />
                            </div>
                        ) : (
                            <>
                                {categories.map((cat, idx) => {
                                    const Icon = getCategoryIcon(cat.name);
                                    const isActive = activeCategory === cat.id;
                                    const colorClass = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
                                    return (
                                        <button
                                            key={cat.id}
                                            onMouseEnter={() => setActiveCategory(cat.id)}
                                            onClick={() => { onClose(); }}
                                            className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-150 group relative ${isActive
                                                ? 'bg-white shadow-sm'
                                                : 'hover:bg-white/60'
                                                }`}
                                        >
                                            {/* Aktif göstergesi */}
                                            {isActive && (
                                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-8 bg-primary rounded-r-full" />
                                            )}

                                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${isActive ? colorClass : 'bg-gray-100 text-gray-400'}`}>
                                                <Icon size={18} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm font-medium truncate transition-colors ${isActive ? 'text-gray-900' : 'text-gray-600'}`}>
                                                    {cat.name}
                                                </p>
                                                <p className="text-[10px] text-gray-400">{(activeCat as any).totalProducts || cat._count.products} ürün</p>
                                            </div>
                                            <ChevronRight size={14} className={`shrink-0 transition-all duration-150 ${isActive ? 'text-primary opacity-100 translate-x-0' : 'text-gray-300 opacity-0 -translate-x-1'}`} />
                                        </button>
                                    );
                                })}
                            </>
                        )}
                    </div>

                    {/* ── Sağ Panel: Ürünler ── */}
                    <div className="flex-1 p-5 overflow-y-auto">
                        {activeCat ? (
                            <>
                                <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100">
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-lg">{activeCat.name}</h3>
                                        <p className="text-xs text-gray-400">{(activeCat as any).totalProducts || activeCat._count.products} ürün mevcut</p>
                                    </div>
                                    <Link
                                        href={`/products?category=${activeCat.id}`}
                                        onClick={onClose}
                                        className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                                    >
                                        Tümünü Gör <ArrowRight size={12} />
                                    </Link>
                                </div>

                                {/* Alt Kategoriler */}
                                {activeCat.children && activeCat.children.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mb-4">
                                        {activeCat.children.map((sub) => (
                                            <Link
                                                key={sub.id}
                                                href={`/products?category=${sub.id}`}
                                                onClick={onClose}
                                                className="px-3 py-1.5 bg-gray-100 hover:bg-primary/10 hover:text-primary rounded-lg text-xs font-medium text-gray-600 transition-colors"
                                            >
                                                {sub.name}
                                                <span className="text-gray-400 ml-1">({sub._count?.products || 0})</span>
                                            </Link>
                                        ))}
                                    </div>
                                )}

                                {/* Ürün Grid */}
                                {activeCat.products.length > 0 ? (
                                    <div className="grid grid-cols-4 gap-3">
                                        {activeCat.products.map(product => {
                                            const imgSrc = getProductImage(product.image);
                                            return (
                                                <Link
                                                    key={product.id}
                                                    href={`/products/${product.id}`}
                                                    onClick={onClose}
                                                    className="group flex flex-col items-center text-center p-3 rounded-xl hover:bg-gray-50 transition-colors"
                                                >
                                                    {/* Ürün Görseli */}
                                                    <div className="w-full aspect-square bg-gray-100 rounded-xl overflow-hidden mb-2.5 flex items-center justify-center">
                                                        {imgSrc ? (
                                                            <img
                                                                src={imgSrc}
                                                                alt={product.name}
                                                                className="w-full h-full object-contain p-2 group-hover:scale-110 transition-transform duration-300"
                                                                loading="lazy"
                                                            />
                                                        ) : (
                                                            <Package size={28} className="text-gray-300" />
                                                        )}
                                                    </div>
                                                    {/* Ürün Bilgisi */}
                                                    <p className="text-xs font-medium text-gray-700 line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                                                        {product.name}
                                                    </p>
                                                    <p className="text-xs font-bold text-primary mt-1">
                                                        {Number(product.price).toFixed(2)} ₺
                                                    </p>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
                                        Bu kategoride henüz ürün yok
                                    </div>
                                )}

                                {/* Daha fazla varsa alt link */}
                                {activeCat._count.products > 8 && (
                                    <div className="mt-4 pt-3 border-t border-gray-100 text-center">
                                        <Link
                                            href={`/products?category=${activeCat.id}`}
                                            onClick={onClose}
                                            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                                        >
                                            +{activeCat._count.products - 8} ürün daha <ArrowRight size={14} />
                                        </Link>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                                Bir kategori seçin
                            </div>
                        )}
                    </div>
                </div>

                {/* Alt Bant */}
                <div className="bg-gray-50 border-t border-gray-100 px-5 py-3 flex items-center justify-between">
                    <p className="text-xs text-gray-400">
                        {categories.length} kategori · {categories.reduce((sum, c) => sum + c._count.products, 0)} ürün
                    </p>
                    <Link
                        href="/products"
                        onClick={onClose}
                        className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                    >
                        Tüm Ürünleri Gör <ArrowRight size={12} />
                    </Link>
                </div>
            </div>

            {/* CSS Animation */}
            <style jsx global>{`
                @keyframes megaMenuIn {
                    from {
                        opacity: 0;
                        transform: translateX(-50%) translateY(-8px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(-50%) translateY(0);
                    }
                }
            `}</style>
        </>
    );
}
