'use client';

import { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Upload, Download, AlertTriangle, History, ArrowUpRight, ArrowDownLeft, RefreshCw, Search } from 'lucide-react';

export default function StockManagementPage() {
    const [activeTab, setActiveTab] = useState<'upload' | 'low-stock' | 'history'>('upload');
    const [stats, setStats] = useState({ lowStockCount: 0 }); // Placeholder for future stats

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">Stok Yönetimi</h1>
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('upload')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'upload' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                    >
                        Toplu İşlemler
                    </button>
                    <button
                        onClick={() => setActiveTab('low-stock')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'low-stock' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                    >
                        Düşük Stok
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'history' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                    >
                        Hareket Geçmişi
                    </button>
                </div>
            </div>

            {activeTab === 'upload' && <BulkStockUpload />}
            {activeTab === 'low-stock' && <LowStockList />}
            {activeTab === 'history' && <StockHistory />}
        </div>
    );
}

function BulkStockUpload() {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDownloadTemplate = async () => {
        try {
            const res = await api.get('/stock/template', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `stok-sablonu-${Date.now()}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            toast.error('Şablon indirilemedi');
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return toast.error('Lütfen bir dosya seçin');

        const formData = new FormData();
        formData.append('file', file);

        setLoading(true);
        try {
            const res = await api.post('/stock/bulk-update', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setResults(res.data);
            toast.success(res.data.message);
            setFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (error: unknown) {
            const errResponse = (error as any)?.response;
            toast.error(errResponse?.data?.error || 'Yükleme başarısız');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <Download size={20} />
                        1. Şablon İndir
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">
                        Mevcut ürün listesini ve stok durumlarını içeren Excel dosyasını indirin.
                    </p>
                    <button onClick={handleDownloadTemplate} className="btn btn-outline w-full flex items-center justify-center gap-2">
                        <Download size={18} />
                        Excel Şablonu İndir
                    </button>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <Upload size={20} />
                        2. Dosya Yükle
                    </h3>
                    <form onSubmit={handleUpload} className="space-y-4">
                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-[var(--primary)] transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                                className="hidden"
                                accept=".xlsx,.xls,.csv"
                            />
                            <Upload size={32} className="mx-auto text-gray-400 mb-2" />
                            <p className="text-sm text-gray-600 font-medium">{file ? file.name : 'Dosya Seç veya Sürükle'}</p>
                            <p className="text-xs text-gray-400 mt-1">.xlsx, .xls, .csv</p>
                        </div>
                        <button type="submit" disabled={!file || loading} className="btn btn-primary w-full">
                            {loading ? 'Yükleniyor...' : 'Güncellemeyi Başlat'}
                        </button>
                    </form>
                </div>
            </div>

            <div className="lg:col-span-2">
                {results ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-4 border-b flex justify-between items-center">
                            <h3 className="font-semibold text-gray-800">Sonuçlar</h3>
                            <button onClick={() => setResults(null)} className="text-sm text-gray-500 hover:text-gray-900">Temizle</button>
                        </div>
                        <div className="overflow-x-auto max-h-[600px]">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500 sticky top-0">
                                    <tr>
                                        <th className="px-4 py-2">Satır</th>
                                        <th className="px-4 py-2">Ürün</th>
                                        <th className="px-4 py-2">Değişim</th>
                                        <th className="px-4 py-2">Yeni Stok</th>
                                        <th className="px-4 py-2">Durum</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {results.errors.map((err: { row: number; message: string }, i: number) => (
                                        <tr key={`err-${i}`} className="bg-red-50">
                                            <td className="px-4 py-2">{err.row}</td>
                                            <td className="px-4 py-2 text-red-600" colSpan={3}>{err.message}</td>
                                            <td className="px-4 py-2">❌</td>
                                        </tr>
                                    ))}
                                    {results.success.map((item: { row: number; productName: string; change: number; newStock: number }, i: number) => (
                                        <tr key={`succ-${i}`} className="border-b last:border-0 hover:bg-gray-50">
                                            <td className="px-4 py-2">{item.row}</td>
                                            <td className="px-4 py-2 font-medium">{item.productName}</td>
                                            <td className={`px-4 py-2 font-bold ${item.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {item.change > 0 ? '+' : ''}{item.change}
                                            </td>
                                            <td className="px-4 py-2">{item.newStock}</td>
                                            <td className="px-4 py-2 text-green-600">✅</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-100 text-center text-gray-400">
                        <Upload size={48} className="mx-auto mb-4 opacity-20" />
                        <p>Sonuçları görmek için bir dosya yükleyin.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function LowStockList() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchLowStock = async () => {
        setLoading(true);
        try {
            const res = await api.get('/stock/low-stock');
            setProducts(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLowStock();
    }, []);

    if (loading) return <div>Yükleniyor...</div>;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4 font-semibold text-gray-700">Ürün</th>
                            <th className="px-6 py-4 font-semibold text-gray-700">SKU</th>
                            <th className="px-6 py-4 font-semibold text-gray-700">Mevcut Stok</th>
                            <th className="px-6 py-4 font-semibold text-gray-700">Alt Limit</th>
                            <th className="px-6 py-4 font-semibold text-gray-700">Durum</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {products.map((product: any) => (
                            <tr key={product.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium text-gray-900">{product.name}</td>
                                <td className="px-6 py-4 text-gray-500">{product.sku || '-'}</td>
                                <td className="px-6 py-4 font-bold text-red-600">{product.stock}</td>
                                <td className="px-6 py-4 text-gray-500">{product.lowStockThreshold}</td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                        Kritik Seviye
                                    </span>
                                </td>
                            </tr>
                        ))}
                        {products.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                    Kritik seviyede ürün bulunmuyor.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function StockHistory() {
    const [movements, setMovements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchHistory = async (p = 1) => {
        setLoading(true);
        try {
            const res = await api.get(`/stock/movements?page=${p}`);
            setMovements(res.data.movements);
            setTotalPages(res.data.totalPages);
            setPage(p);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 font-semibold text-gray-700">Tarih</th>
                            <th className="px-6 py-3 font-semibold text-gray-700">Ürün</th>
                            <th className="px-6 py-3 font-semibold text-gray-700">İşlem</th>
                            <th className="px-6 py-3 font-semibold text-gray-700">Miktar</th>
                            <th className="px-6 py-3 font-semibold text-gray-700">Önceki / Yeni</th>
                            <th className="px-6 py-3 font-semibold text-gray-700">Açıklama</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan={6} className="p-8 text-center">Yükleniyor...</td></tr>
                        ) : movements.map((m: any) => (
                            <tr key={m.id} className="hover:bg-gray-50">
                                <td className="px-6 py-3 text-gray-500 whitespace-nowrap">
                                    {new Date(m.createdAt).toLocaleString('tr-TR')}
                                </td>
                                <td className="px-6 py-3 font-medium text-gray-900">{m.product.name}</td>
                                <td className="px-6 py-3">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium 
                                        ${m.type === 'IN' ? 'bg-green-100 text-green-800' :
                                            m.type === 'OUT' ? 'bg-orange-100 text-orange-800' :
                                                m.type === 'ORDER' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {m.type === 'IN' ? 'Giriş' : m.type === 'OUT' ? 'Çıkış' : m.type === 'ORDER' ? 'Sipariş' : 'Düzeltme'}
                                    </span>
                                </td>
                                <td className={`px-6 py-3 font-bold ${m.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {m.quantity > 0 ? '+' : ''}{m.quantity}
                                </td>
                                <td className="px-6 py-3 text-gray-500">
                                    {m.previousStock} → {m.newStock}
                                </td>
                                <td className="px-6 py-3 text-gray-500 max-w-xs truncate" title={m.reason}>
                                    {m.reason}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {/* Pagination Controls */}
            <div className="p-4 border-t flex justify-between items-center bg-gray-50">
                <button
                    disabled={page <= 1}
                    onClick={() => fetchHistory(page - 1)}
                    className="px-4 py-2 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                >
                    Önceki
                </button>
                <span className="text-sm text-gray-600">Sayfa {page} / {totalPages}</span>
                <button
                    disabled={page >= totalPages}
                    onClick={() => fetchHistory(page + 1)}
                    className="px-4 py-2 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                >
                    Sonraki
                </button>
            </div>
        </div>
    );
}
