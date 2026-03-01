'use client';

import { useEffect, useState, useRef } from 'react';
import api from '@/lib/api';
import Link from 'next/link';
import { Edit, Trash2, Plus, Package, Star, Search, Download, Upload, FileSpreadsheet, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import Skeleton from '@/components/ui/Skeleton';

interface Product {
    id: number;
    name: string;
    price: number;
    category: { id: number; name: string };
    stock: number;
    image: string | null;
    isFeatured: boolean;
    sku: string | null;
    barcode: string | null;
    lowStockThreshold: number;
    brand?: { id: number; name: string };
}

interface Category {
    id: number;
    name: string;
}

export default function AdminProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [importing, setImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        api.get('/categories').then(res => setCategories(res.data)).catch(() => { });
    }, []);

    useEffect(() => {
        fetchProducts(pagination.page);
    }, [pagination.page, searchQuery, categoryFilter]);

    const fetchProducts = async (page: number) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(page), limit: '20' });
            if (searchQuery) params.set('search', searchQuery);
            if (categoryFilter) params.set('categoryId', categoryFilter);
            const res = await api.get(`/products?${params}`);
            if (res.data.products) {
                setProducts(res.data.products);
                setPagination(prev => ({
                    ...prev,
                    totalPages: res.data.pagination?.totalPages || 1,
                    total: res.data.pagination?.total || 0
                }));
            }
            setSelectedIds([]);
        } catch (error) {
            toast.error('Ürünler yüklenemedi');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedIds(e.target.checked ? products.map(p => p.id) : []);
    };

    const handleSelect = (id: number) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]);
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        if (!confirm(`${selectedIds.length} ürünü silmek istediğinize emin misiniz?`)) return;
        try {
            await api.post('/products/bulk-delete', { ids: selectedIds });
            toast.success('Seçilen ürünler silindi');
            fetchProducts(pagination.page);
        } catch { toast.error('Toplu silme başarısız'); }
    };

    const handleToggleFeatured = async (product: Product) => {
        setProducts(prev => prev.map(p => p.id === product.id ? { ...p, isFeatured: !p.isFeatured } : p));
        try {
            await api.put(`/products/${product.id}`, { isFeatured: !product.isFeatured });
            toast.success(product.isFeatured ? 'Öne çıkanlardan kaldırıldı' : 'Öne çıkanlara eklendi');
        } catch { toast.error('Güncelleme başarısız'); fetchProducts(pagination.page); }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Bu ürünü silmek istediğinize emin misiniz?')) return;
        try {
            await api.delete(`/products/${id}`);
            toast.success('Ürün silindi');
            fetchProducts(pagination.page);
        } catch { toast.error('Silme başarısız'); }
    };

    // ── Toplu İşlemler ──
    const handleDownloadTemplate = async () => {
        try {
            const res = await api.get('/products/bulk-template', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const a = document.createElement('a');
            a.href = url; a.download = 'ercag-urun-sablonu.xlsx'; a.click();
            window.URL.revokeObjectURL(url);
            toast.success('Şablon indirildi');
        } catch { toast.error('Şablon indirilemedi'); }
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImporting(true);
        const formData = new FormData();
        formData.append('file', file);
        try {
            const res = await api.post('/products/bulk-import', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            const { created, skipped, errors } = res.data;
            toast.success(`${created} ürün eklendi${skipped > 0 ? `, ${skipped} satır atlandı` : ''}`);
            if (errors?.length > 0) {
                errors.slice(0, 5).forEach((err: any) => toast.error(`Satır ${err.row} (${err.name}): ${err.error}`));
                if (errors.length > 5) toast.info(`...ve ${errors.length - 5} hata daha`);
            }
            fetchProducts(1);
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'İçe aktarma başarısız');
        } finally {
            setImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleExport = async () => {
        try {
            const res = await api.get('/products/export', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const a = document.createElement('a');
            a.href = url; a.download = `ercag-urunler-${new Date().toISOString().split('T')[0]}.xlsx`; a.click();
            window.URL.revokeObjectURL(url);
            toast.success('Dışa aktarıldı');
        } catch { toast.error('Dışa aktarma başarısız'); }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Ürün Yönetimi</h1>
                    <p className="text-sm text-gray-500 mt-1">{pagination.total} ürün</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button onClick={handleDownloadTemplate} className="btn btn-outline text-sm flex items-center gap-1.5 px-3 py-2">
                        <Download size={16} /> Şablon
                    </button>
                    <button onClick={() => fileInputRef.current?.click()} disabled={importing}
                        className="btn btn-outline text-sm flex items-center gap-1.5 px-3 py-2">
                        <Upload size={16} /> {importing ? 'Yükleniyor...' : 'İçe Aktar'}
                    </button>
                    <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleImport} />
                    <button onClick={handleExport} className="btn btn-outline text-sm flex items-center gap-1.5 px-3 py-2">
                        <FileSpreadsheet size={16} /> Dışa Aktar
                    </button>
                    <Link href="/admin/products/new" className="px-4 py-2 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg transition-colors shadow-sm flex items-center gap-1.5 text-sm">
                        <Plus size={16} /> Yeni Ürün
                    </Link>
                </div>
            </div>

            {/* Arama + Filtre */}
            <div className="flex flex-col sm:flex-row gap-3">
                <form onSubmit={handleSearch} className="flex-1 relative">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text" placeholder="Ürün adı, SKU veya barkod ara..."
                        className="input w-full pl-10 pr-4 py-2.5"
                        value={searchQuery}
                        onChange={e => { setSearchQuery(e.target.value); setPagination(prev => ({ ...prev, page: 1 })); }}
                    />
                </form>
                <select
                    className="input py-2.5 px-4 min-w-[180px]"
                    value={categoryFilter}
                    onChange={e => { setCategoryFilter(e.target.value); setPagination(prev => ({ ...prev, page: 1 })); }}
                >
                    <option value="">Tüm Kategoriler</option>
                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
            </div>

            {/* Toplu Silme */}
            {selectedIds.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center justify-between">
                    <span className="text-sm text-red-700 font-medium">{selectedIds.length} ürün seçili</span>
                    <button onClick={handleBulkDelete} className="text-sm font-bold text-red-600 hover:text-red-800 flex items-center gap-1">
                        <Trash2 size={16} /> Seçilenleri Sil
                    </button>
                </div>
            )}

            {/* Tablo */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3 w-10 text-center">
                                    <input type="checkbox" className="checkbox"
                                        checked={products.length > 0 && selectedIds.length === products.length}
                                        onChange={handleSelectAll} disabled={products.length === 0} />
                                </th>
                                <th className="px-4 py-3 font-semibold text-gray-600 text-sm">Ürün</th>
                                <th className="px-4 py-3 font-semibold text-gray-600 text-sm">SKU</th>
                                <th className="px-4 py-3 font-semibold text-gray-600 text-sm">Marka</th>
                                <th className="px-4 py-3 font-semibold text-gray-600 text-sm">Kategori</th>
                                <th className="px-4 py-3 font-semibold text-gray-600 text-sm">Fiyat</th>
                                <th className="px-4 py-3 font-semibold text-gray-600 text-sm">Stok</th>
                                <th className="px-4 py-3 font-semibold text-gray-600 text-sm text-center">Öne Çıkan</th>
                                <th className="px-4 py-3 font-semibold text-gray-600 text-sm text-right">İşlem</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i}>
                                    <td className="px-4 py-3 text-center"><Skeleton width={18} height={18} /></td>
                                    <td className="px-4 py-3"><div className="flex items-center gap-3"><Skeleton width={40} height={40} className="rounded-lg" /><Skeleton variant="text" width={150} /></div></td>
                                    <td className="px-4 py-3"><Skeleton variant="text" width={80} /></td>
                                    <td className="px-4 py-3"><Skeleton variant="text" width={80} /></td>
                                    <td className="px-4 py-3"><Skeleton variant="text" width={100} /></td>
                                    <td className="px-4 py-3"><Skeleton variant="text" width={60} /></td>
                                    <td className="px-4 py-3"><Skeleton variant="text" width={50} /></td>
                                    <td className="px-4 py-3"><Skeleton variant="circular" width={28} height={28} /></td>
                                    <td className="px-4 py-3"><Skeleton className="ml-auto" width={60} height={28} /></td>
                                </tr>
                            )) : products.map(product => (
                                <tr key={product.id} className={`hover:bg-gray-50/50 transition-colors ${selectedIds.includes(product.id) ? 'bg-brand-50/30' : ''}`}>
                                    <td className="px-4 py-3 text-center">
                                        <input type="checkbox" className="checkbox" checked={selectedIds.includes(product.id)} onChange={() => handleSelect(product.id)} />
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border border-gray-200 shrink-0">
                                                {product.image ? (
                                                    <img src={product.image.startsWith('http') ? product.image : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/uploads/${product.image}`}
                                                        alt="" className="w-full h-full object-cover" />
                                                ) : <Package size={18} className="text-gray-400" />}
                                            </div>
                                            <span className="font-medium text-gray-900 text-sm">{product.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        {product.sku ? <code className="text-xs bg-gray-100 px-2 py-0.5 rounded font-mono">{product.sku}</code> : <span className="text-gray-300 text-xs">—</span>}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-500">
                                        {product.brand?.name || <span className="text-gray-300 text-xs">—</span>}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{product.category?.name}</td>
                                    <td className="px-4 py-3 font-medium text-gray-900 text-sm">{Number(product.price).toFixed(2)} ₺</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${product.stock > (product.lowStockThreshold || 5) ? 'bg-green-100 text-green-800' :
                                            product.stock > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                                            {product.stock}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <button onClick={() => handleToggleFeatured(product)}
                                            className={`p-1 rounded-full hover:bg-gray-100 transition-colors ${product.isFeatured ? 'text-yellow-500' : 'text-gray-300'}`}>
                                            <Star size={18} fill={product.isFeatured ? 'currentColor' : 'none'} />
                                        </button>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Link href={`/admin/products/${product.id}`} className="p-1.5 text-gray-400 hover:text-primary hover:bg-brand-50 rounded-lg transition-colors"><Edit size={16} /></Link>
                                            <button onClick={() => handleDelete(product.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {products.length === 0 && !loading && (
                                <tr><td colSpan={9} className="px-4 py-12 text-center text-gray-400">
                                    {searchQuery || categoryFilter ? 'Arama kriterlerine uygun ürün bulunamadı.' : 'Henüz ürün eklenmemiş.'}
                                </td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                        Sayfa {pagination.page} / {pagination.totalPages} ({pagination.total} ürün)
                    </p>
                    <div className="flex gap-1">
                        <button onClick={() => setPagination(p => ({ ...p, page: Math.max(1, p.page - 1) }))}
                            disabled={pagination.page <= 1}
                            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
                            <ChevronLeft size={18} />
                        </button>
                        {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                            const startPage = Math.max(1, Math.min(pagination.page - 2, pagination.totalPages - 4));
                            const pageNum = startPage + i;
                            return (
                                <button key={pageNum} onClick={() => setPagination(p => ({ ...p, page: pageNum }))}
                                    className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${pageNum === pagination.page ? 'bg-primary text-white' : 'border border-gray-200 hover:bg-gray-50 text-gray-700'}`}>
                                    {pageNum}
                                </button>
                            );
                        })}
                        <button onClick={() => setPagination(p => ({ ...p, page: Math.min(p.totalPages, p.page + 1) }))}
                            disabled={pagination.page >= pagination.totalPages}
                            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
