'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShoppingCart, Star, Eye } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import { useCart } from '@/context/CartContext';

interface Product {
    id: number;
    name: string;
    price: number;
    image: string;
    category: { name: string };
    stock: number;
}

export default function FeaturedProducts() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const { addToCart } = useCart();
    const { user } = useAuth();

    useEffect(() => {
        // Fetch products (Limiting to 8 for the featured section)
        // In a real app, you might have a dedicated /products/featured endpoint
        api.get('/products?isFeatured=true&limit=8')
            .then(res => {
                // Determine if res.data is array or object with products array
                const items = Array.isArray(res.data) ? res.data : res.data.products || [];
                // Slice top 4 if needed
                setProducts(items.slice(0, 4));
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    const handleAddToCart = async (e: React.MouseEvent, product: Product) => {
        e.preventDefault(); // Prevent navigating if wrapped in Link
        try {
            await addToCart(product);
            toast.success(`${product.name} sepete eklendi`);
        } catch (error) {
            toast.error('Sepete eklenirken hata oluştu');
        }
    };

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
                        <div key={product.id} className="group relative bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                            {/* Badge */}
                            <div className="absolute top-4 left-4 z-10 bg-yellow-400 text-xs font-bold px-2 py-1 rounded-full text-gray-900 shadow-sm">
                                Fırsat
                            </div>

                            {/* Image */}
                            <div className="relative aspect-square mb-4 overflow-hidden rounded-xl bg-gray-50 p-6 flex items-center justify-center">
                                <img
                                    src={product.image ? (product.image.startsWith('http') ? product.image : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/uploads/${product.image}`) : 'https://placehold.co/400?text=Urun'}
                                    alt={product.name}
                                    className="object-contain w-full h-full mix-blend-multiply group-hover:scale-110 transition-transform duration-500"
                                />

                                {/* Quick Action Overlay */}
                                <div className="absolute inset-x-4 bottom-4 flex gap-2 translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                                    <button
                                        onClick={(e) => handleAddToCart(e, product)}
                                        className="flex-1 bg-primary text-white py-2 rounded-lg font-medium shadow-lg hover:bg-primary-hover flex items-center justify-center gap-2"
                                    >
                                        <ShoppingCart size={18} /> Sepete Ekle
                                    </button>
                                    <Link href={`/products/${product.id}`} className="bg-white text-gray-700 p-2 rounded-lg shadow-lg hover:bg-gray-50 border border-gray-100 flex items-center justify-center">
                                        <Eye size={18} />
                                    </Link>
                                </div>
                            </div>

                            {/* Content */}
                            <div>
                                <div className="text-xs text-gray-500 mb-1">{product.category?.name || 'Genel'}</div>
                                <h3 className="font-bold text-gray-900 text-lg mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                                    <Link href={`/products/${product.id}`}>{product.name}</Link>
                                </h3>

                                <div className="flex items-center gap-1 mb-3">
                                    <Star size={14} className="fill-yellow-400 text-yellow-400" />
                                    <Star size={14} className="fill-yellow-400 text-yellow-400" />
                                    <Star size={14} className="fill-yellow-400 text-yellow-400" />
                                    <Star size={14} className="fill-yellow-400 text-yellow-400" />
                                    <Star size={14} className="fill-gray-200 text-gray-200" />
                                    <span className="text-xs text-gray-400 ml-1">(4.0)</span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-xl font-bold text-primary">{Number(product.price).toFixed(2)} ₺</span>
                                    {product.stock > 0 ? (
                                        <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full font-medium">Stokta</span>
                                    ) : (
                                        <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full font-medium">Tükendi</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
