'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Plus, Edit2, Trash2, ToggleRight, ToggleLeft, Tag } from 'lucide-react';
import { toast } from 'sonner';

interface Brand {
    id: number;
    name: string;
    logo: string | null;
    isActive: boolean;
    _count?: { products: number };
}

export default function AdminBrandsPage() {
    const [brands, setBrands] = useState<Brand[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [form, setForm] = useState({ name: '', logo: '' });

    const fetchBrands = async () => {
        try {
            const res = await api.get('/brands');
            setBrands(res.data);
        } catch {
            toast.error('Markalar yüklenemedi');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchBrands(); }, []);

    const openCreate = () => {
        setEditingId(null);
        setForm({ name: '', logo: '' });
        setIsModalOpen(true);
    };
    const openEdit = (b: Brand) => {
        setEditingId(b.id);
        setForm({ name: b.name, logo: b.logo || '' });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingId) {
                await api.put(`/brands/${editingId}`, form);
                toast.success('Marka güncellendi');
            } else {
                await api.post('/brands', form);
                toast.success('Marka eklendi');
            }
            setIsModalOpen(false);
            fetchBrands();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'İşlem başarısız');
        }
    };

    const handleToggle = async (b: Brand) => {
        try {
            await api.put(`/brands/${b.id}`, { isActive: !b.isActive });
            toast.success(`Marka ${!b.isActive ? 'aktif' : 'pasif'} edildi`);
            fetchBrands();
        } catch {
            toast.error('Güncelleme başarısız');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Bu markayı silmek istediğinize emin misiniz? Ürünlerdeki marka bilgisi temizlenecek.')) return;
        try {
            await api.delete(`/brands/${id}`);
            toast.success('Marka silindi');
            fetchBrands();
        } catch {
            toast.error('Silme başarısız');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Markalar</h1>
                    <p className="text-sm text-gray-500 mt-1">Ürünlere atanacak markaları yönetin.</p>
                </div>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors font-medium shadow-sm"
                >
                    <Plus size={18} /> Yeni Marka
                </button>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-8 space-y-3">
                        {[1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />)}
                    </div>
                ) : brands.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        <Tag size={48} className="mx-auto mb-4 text-gray-300" />
                        <p className="font-semibold text-lg mb-1">Henüz marka yok</p>
                        <p className="text-sm">İlk markanızı ekleyerek başlayın.</p>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center gap-4 px-5 py-2.5 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            <div className="w-9 shrink-0" />
                            <div className="flex-1">Marka Adı</div>
                            <div className="w-32 shrink-0 text-right">İşlemler</div>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {brands.map(b => (
                                <div key={b.id} className={`flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors ${!b.isActive ? 'opacity-50' : ''}`}>
                                    <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-bold text-sm shrink-0">
                                        {b.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-gray-900">{b.name}</p>
                                        <p className="text-xs text-gray-400">{b._count?.products || 0} ürün</p>
                                    </div>
                                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${b.isActive ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                                        {b.isActive ? 'Aktif' : 'Pasif'}
                                    </span>
                                    <div className="flex items-center gap-1 shrink-0">
                                        <button
                                            onClick={() => handleToggle(b)}
                                            className={`p-2 rounded-lg transition-colors ${b.isActive ? 'text-green-500 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}
                                            title={b.isActive ? 'Pasife Al' : 'Aktife Al'}
                                        >
                                            {b.isActive ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                                        </button>
                                        <button onClick={() => openEdit(b)} className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors">
                                            <Edit2 size={16} />
                                        </button>
                                        <button onClick={() => handleDelete(b.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
                    onClick={e => e.target === e.currentTarget && setIsModalOpen(false)}
                >
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                        <h2 className="text-lg font-bold mb-4">{editingId ? 'Marka Düzenle' : 'Yeni Marka'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Marka Adı</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    placeholder="Örn: Faber-Castell"
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                />
                            </div>
                            <div className="flex gap-3 justify-end pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl text-sm font-medium"
                                >
                                    İptal
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-dark text-sm font-medium"
                                >
                                    {editingId ? 'Güncelle' : 'Oluştur'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
