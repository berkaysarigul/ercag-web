import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { SlidersHorizontal, ChevronRight, PenTool, Book, Briefcase, Palette } from 'lucide-react';

interface Category {
    id: number;
    name: string;
}

interface FilterProps {
    onFilterChange: (filters: any) => void;
    initialCategory: number | null;
}

export default function FilterSidebar({ onFilterChange, initialCategory }: FilterProps) {
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<number | null>(initialCategory);
    const [priceRange, setPriceRange] = useState({ minPrice: '', maxPrice: '' });

    useEffect(() => {
        api.get('/categories').then(res => setCategories(res.data));
    }, []);

    useEffect(() => {
        setSelectedCategory(initialCategory);
    }, [initialCategory]);

    const handleCategoryChange = (id: number | null) => {
        setSelectedCategory(id);
        onFilterChange({ categoryId: id, ...priceRange });
    };

    const handlePriceApply = () => {
        onFilterChange({ categoryId: selectedCategory, ...priceRange });
    };

    // Helper to get icon based on category name (simple mapping)
    const getCategoryIcon = (name: string) => {
        const lower = name.toLowerCase();
        if (lower.includes('kalem')) return <PenTool size={20} />;
        if (lower.includes('defter') || lower.includes('kitap')) return <Book size={20} />;
        if (lower.includes('ofis')) return <Briefcase size={20} />;
        if (lower.includes('sanat') || lower.includes('boya')) return <Palette size={20} />;
        return <Book size={20} />; // Default
    };

    return (
        <aside className="bg-white rounded-2xl border border-gray-100 shadow-soft p-6 sticky top-24">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                    Kategoriler
                </h2>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <SlidersHorizontal className="w-5 h-5 text-gray-600" />
                </button>
            </div>

            {/* Categories */}
            <div className="space-y-1">
                <button
                    onClick={() => handleCategoryChange(null)}
                    className={`
                        group w-full flex items-center justify-between px-4 py-3 text-left rounded-xl transition-all duration-200 hover:bg-brand-50
                        ${selectedCategory === null ? 'bg-brand-50 border-2 border-brand-200' : ''}
                    `}
                >
                    <div className="flex items-center gap-3">
                        <div className={`
                            w-10 h-10 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110
                            ${selectedCategory === null ? 'bg-brand-500 text-white' : 'bg-gradient-to-br from-brand-100 to-brand-200 text-brand-700'}
                        `}>
                            <SlidersHorizontal size={20} />
                        </div>
                        <span className={`font-medium group-hover:text-brand-700 ${selectedCategory === null ? 'text-brand-900' : 'text-gray-700'}`}>
                            Tümü
                        </span>
                    </div>
                    {selectedCategory === null && <ChevronRight className="w-5 h-5 text-brand-600" />}
                </button>

                {categories.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => handleCategoryChange(cat.id)}
                        className={`
                            group w-full flex items-center justify-between px-4 py-3 text-left rounded-xl transition-all duration-200 hover:bg-brand-50
                            ${selectedCategory === cat.id ? 'bg-brand-50 border-2 border-brand-200' : ''}
                        `}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`
                                w-10 h-10 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110
                                ${selectedCategory === cat.id ? 'bg-brand-500 text-white' : 'bg-gradient-to-br from-brand-100 to-brand-200 text-brand-700'}
                            `}>
                                {getCategoryIcon(cat.name)}
                            </div>
                            <span className={`font-medium group-hover:text-brand-700 ${selectedCategory === cat.id ? 'text-brand-900' : 'text-gray-700'}`}>
                                {cat.name}
                            </span>
                        </div>
                        {selectedCategory === cat.id && <ChevronRight className="w-5 h-5 text-brand-600" />}
                    </button>
                ))}
            </div>

            {/* Price Filter */}
            <div className="mt-8 pt-6 border-t border-gray-100">
                <h3 className="font-bold text-gray-900 mb-4">Fiyat Aralığı</h3>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <input
                            type="number"
                            placeholder="Min"
                            value={priceRange.minPrice}
                            onChange={(e) => setPriceRange({ ...priceRange, minPrice: e.target.value })}
                            className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                        />
                        <input
                            type="number"
                            placeholder="Max"
                            value={priceRange.maxPrice}
                            onChange={(e) => setPriceRange({ ...priceRange, maxPrice: e.target.value })}
                            className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                        />
                    </div>
                    <button
                        onClick={handlePriceApply}
                        className="w-full px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-medium text-sm rounded-lg transition-colors"
                    >
                        Uygula
                    </button>
                </div>
            </div>
        </aside>
    );
}
