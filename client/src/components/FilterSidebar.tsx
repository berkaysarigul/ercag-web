'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';

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

    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const newRange = { ...priceRange, [name]: value };
        setPriceRange(newRange);
        onFilterChange({ categoryId: selectedCategory, ...newRange });
    };

    return (
        <div className="card" style={{ height: 'fit-content', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Kategoriler</h3>
            <ul style={{ listStyle: 'none', marginBottom: '2rem' }}>
                <li style={{ marginBottom: '0.5rem' }}>
                    <button
                        onClick={() => handleCategoryChange(null)}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: selectedCategory === null ? 'bold' : 'normal',
                            color: selectedCategory === null ? 'var(--accent)' : 'inherit'
                        }}
                    >
                        Tümü
                    </button>
                </li>
                {categories.map(cat => (
                    <li key={cat.id} style={{ marginBottom: '0.5rem' }}>
                        <button
                            onClick={() => handleCategoryChange(cat.id)}
                            style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                fontWeight: selectedCategory === cat.id ? 'bold' : 'normal',
                                color: selectedCategory === cat.id ? 'var(--accent)' : 'inherit'
                            }}
                        >
                            {cat.name}
                        </button>
                    </li>
                ))}
            </ul>

            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Fiyat Aralığı</h3>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                    type="number"
                    name="minPrice"
                    placeholder="Min"
                    value={priceRange.minPrice}
                    onChange={handlePriceChange}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                />
                <span>-</span>
                <input
                    type="number"
                    name="maxPrice"
                    placeholder="Max"
                    value={priceRange.maxPrice}
                    onChange={handlePriceChange}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                />
            </div>
        </div>
    );
}
