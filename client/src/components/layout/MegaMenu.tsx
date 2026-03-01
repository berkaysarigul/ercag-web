'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
    const router = useRouter();

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
                                            onClick={() => { onClose(); router.push(`/products?category=${cat.id}`); }}
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

                    {/* ── Sağ Panel: Alt Kategoriler ── */}
                    <div className="flex-1 p-6 overflow-y-auto bg-white">
                        {activeCat ? (
                            <>
                                <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-xl">{activeCat.name}</h3>
                                        <p className="text-sm text-gray-500 mt-1">Toplam {(activeCat as any).totalProducts || activeCat._count.products} ürün mevcut</p>
                                    </div>
                                    <button
                                        onClick={() => { onClose(); router.push(`/products?category=${activeCat.id}`); }}
                                        className="text-sm font-semibold text-primary hover:bg-primary hover:text-white transition-colors flex items-center gap-1.5 bg-primary/10 px-4 py-2 rounded-full"
                                    >
                                        Tüm {activeCat.name} Ürünleri <ArrowRight size={14} />
                                    </button>
                                </div>

                                {/* Alt Kategori Grid */}
                                {activeCat.children && activeCat.children.length > 0 ? (
                                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                        {activeCat.children.map((sub, idx) => {
                                            const SubIcon = getCategoryIcon(sub.name);
                                            const subColor = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
                                            return (
                                                <Link
                                                    key={sub.id}
                                                    href={`/products?category=${sub.id}`}
                                                    onClick={onClose}
                                                    className="group flex flex-col p-5 bg-white border border-gray-100 rounded-2xl hover:border-primary/30 hover:shadow-md transition-all duration-300"
                                                >
                                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-colors ${subColor} group-hover:bg-primary group-hover:text-white shadow-sm`}>
                                                        <SubIcon size={28} strokeWidth={1.5} />
                                                    </div>
                                                    <h4 className="font-bold text-gray-800 group-hover:text-primary transition-colors text-base mb-1.5 line-clamp-1">
                                                        {sub.name}
                                                    </h4>
                                                    <p className="text-sm font-medium text-gray-400 group-hover:text-gray-500 transition-colors">
                                                        {sub._count?.products || 0} Ürün
                                                    </p>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                ) : activeCat.products && activeCat.products.length > 0 ? (
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                        {activeCat.products.slice(0, 8).map(product => (
                                            <Link
                                                key={product.id}
                                                href={`/products/${product.id}`}
                                                onClick={onClose}
                                                className="group flex flex-col p-3 bg-white border border-gray-100 rounded-2xl hover:border-primary/30 hover:shadow-md transition-all duration-300"
                                            >
                                                <div className="w-full aspect-square bg-gray-50 rounded-xl mb-3 overflow-hidden relative">
                                                    {product.image ? (
                                                        <img src={getProductImage(product.image)!} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-300"><Package size={24} /></div>
                                                    )}
                                                </div>
                                                <h4 className="font-medium text-gray-800 group-hover:text-primary transition-colors text-sm mb-1 line-clamp-2 leading-tight">
                                                    {product.name}
                                                </h4>
                                                <p className="text-sm font-bold text-primary mt-auto">
                                                    {Number(product.price).toFixed(2)} ₺
                                                </p>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                                        <FolderOpen size={48} className="mb-4 opacity-20" />
                                        <p className="text-sm font-medium text-gray-500">Bu kategoriye ait alt kategori veya ürün bulunmuyor.</p>
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
