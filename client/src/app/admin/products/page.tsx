'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Link from 'next/link';
import { Edit, Trash2, Plus, Package, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import Skeleton from '@/components/ui/Skeleton';

interface Product {
    id: number;
    name: string;
    price: number;
    category: { name: string };
    stock: number;
    image: string | null;
    isFeatured: boolean;
}

export default function AdminProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await api.get('/products');
            setProducts(res.data);
            setSelectedIds([]); // Reset selection on refresh
        } catch (error) {
            console.error('Failed to fetch products', error);
            toast.error('Ürünler yüklenemedi');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedIds(products.map(p => p.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelect = (id: number) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
        );
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        if (!confirm(`${selectedIds.length} ürünü silmek istediğinize emin misiniz?`)) return;

        try {
            await api.post('/products/bulk-delete', { ids: selectedIds });
            toast.success('Seçilen ürünler silindi');
            fetchProducts();
        } catch (error) {
            console.error('Failed to bulk delete', error);
            toast.error('Toplu silme başarısız');
        }
    };

    const handleToggleFeatured = async (product: Product) => {
        try {
            // Optimistic update
            const updatedProducts = products.map(p =>
                p.id === product.id ? { ...p, isFeatured: !p.isFeatured } : p
            );
            setProducts(updatedProducts);

            await api.put(`/products/${product.id}`, {
                isFeatured: !product.isFeatured
            });

            toast.success(product.isFeatured ? 'Öne çıkanlardan kaldırıldı' : 'Öne çıkanlara eklendi');
        } catch (error) {
            console.error('Failed to update product', error);
            toast.error('Güncelleme başarısız');
            fetchProducts(); // Revert on error
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Bu ürünü silmek istediğinize emin misiniz?')) return;
        try {
            await api.delete(`/products/${id}`);
            toast.success('Ürün silindi');
            fetchProducts();
        } catch (error) {
            console.error('Failed to delete product', error);
            toast.error('Ürün silinirken bir hata oluştu');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">Ürün Yönetimi</h1>
                <div className="flex gap-3">
                    {selectedIds.length > 0 && (
                        <button
                            onClick={handleBulkDelete}
                            className="btn bg-red-50 text-red-600 hover:bg-red-100 flex items-center gap-2 border border-red-200"
                        >
                            <Trash2 size={20} /> Seçilenleri Sil ({selectedIds.length})
                        </button>
                    )}
                    <Link href="/admin/products/new" className="btn btn-primary flex items-center gap-2">
                        <Plus size={20} /> Yeni Ürün Ekle
                    </Link>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 w-12 text-center">
                                    <input
                                        type="checkbox"
                                        className="checkbox"
                                        checked={products.length > 0 && selectedIds.length === products.length}
                                        onChange={handleSelectAll}
                                        disabled={products.length === 0}
                                    />
                                </th>
                                <th className="px-6 py-4 font-semibold text-gray-600">Ürün</th>
                                <th className="px-6 py-4 font-semibold text-gray-600">Kategori</th>
                                <th className="px-6 py-4 font-semibold text-gray-600">Fiyat</th>
                                <th className="px-6 py-4 font-semibold text-gray-600">Stok</th>
                                <th className="px-6 py-4 font-semibold text-gray-600">Zirve</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-right">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}>
                                        <td className="px-6 py-4 text-center"><Skeleton className="mx-auto" width={20} height={20} /></td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <Skeleton width={40} height={40} className="rounded-lg" />
                                                <Skeleton variant="text" width={150} />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4"><Skeleton variant="text" width={100} /></td>
                                        <td className="px-6 py-4"><Skeleton variant="text" width={80} /></td>
                                        <td className="px-6 py-4"><Skeleton variant="text" width={60} /></td>
                                        <td className="px-6 py-4"><Skeleton variant="circular" width={32} height={32} /></td>
                                        <td className="px-6 py-4"><Skeleton className="ml-auto" width={80} height={32} /></td>
                                    </tr>
                                ))
                            ) : products.map((product) => (
                                <tr key={product.id} className={`hover:bg-gray-50 transition-colors ${selectedIds.includes(product.id) ? 'bg-blue-50/50' : ''}`}>
                                    <td className="px-6 py-4 text-center">
                                        <input
                                            type="checkbox"
                                            className="checkbox"
                                            checked={selectedIds.includes(product.id)}
                                            onChange={() => handleSelect(product.id)}
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border border-gray-200">
                                                {product.image ? (
                                                    <img
                                                        src={product.image ? (product.image.startsWith('http') ? product.image : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/uploads/${product.image}`) : ''}
                                                        alt={product.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <Package size={20} className="text-gray-400" />
                                                )}
                                            </div>
                                            <span className="font-medium text-gray-900">{product.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">{product.category?.name}</td>
                                    <td className="px-6 py-4 font-medium text-gray-900">{Number(product.price).toFixed(2)} ₺</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${product.stock > 10 ? 'bg-green-100 text-green-800' :
                                            product.stock > 0 ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-red-100 text-red-800'
                                            }`}>
                                            {product.stock} Adet
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => handleToggleFeatured(product)}
                                            className={`p-1 rounded-full hover:bg-gray-100 transition-colors ${product.isFeatured ? 'text-yellow-500' : 'text-gray-300'}`}
                                            title={product.isFeatured ? "Öne Çıkanlardan Kaldır" : "Öne Çıkanlara Ekle"}
                                        >
                                            <Star size={20} fill={product.isFeatured ? "currentColor" : "none"} />
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link
                                                href={`/admin/products/${product.id}`}
                                                className="p-2 text-gray-400 hover:text-primary hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Düzenle"
                                            >
                                                <Edit size={18} />
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(product.id)}
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Sil"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {products.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                                        Henüz ürün eklenmemiş.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
