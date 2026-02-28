'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Plus, Edit2, Trash2, ToggleRight, ToggleLeft, MapPin, Phone } from 'lucide-react';
import { toast } from 'sonner';

interface Branch {
    id: number;
    name: string;
    address: string;
    phone: string | null;
    district: string | null;
    city: string;
    isActive: boolean;
    workingHours: string | null;
}

export default function AdminBranchesPage() {
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [form, setForm] = useState({ name: '', address: '', phone: '', district: '', workingHours: '' });

    const fetchBranches = async () => {
        try {
            const r = await api.get('/branches');
            setBranches(r.data);
        } catch {
            toast.error('Yüklenemedi');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchBranches(); }, []);

    const openCreate = () => {
        setEditingId(null);
        setForm({ name: '', address: '', phone: '', district: '', workingHours: '' });
        setIsModalOpen(true);
    };

    const openEdit = (b: Branch) => {
        setEditingId(b.id);
        setForm({ name: b.name, address: b.address, phone: b.phone || '', district: b.district || '', workingHours: b.workingHours || '' });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingId) {
                await api.put(`/branches/${editingId}`, form);
                toast.success('Şube güncellendi');
            } else {
                await api.post('/branches', form);
                toast.success('Şube oluşturuldu');
            }
            setIsModalOpen(false);
            fetchBranches();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'İşlem başarısız');
        }
    };

    const handleToggle = async (b: Branch) => {
        try {
            await api.put(`/branches/${b.id}`, { isActive: !b.isActive });
            toast.success(`Şube ${!b.isActive ? 'aktif' : 'pasif'} edildi`);
            fetchBranches();
        } catch {
            toast.error('Güncelleme başarısız');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Şubeyi silmek istediğinize emin misiniz?')) return;
        try {
            await api.delete(`/branches/${id}`);
            toast.success('Şube silindi');
            fetchBranches();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Silme başarısız');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Şubeler</h1>
                    <p className="text-sm text-gray-500 mt-1">Müşteriler sipariş verirken teslim alacağı şubeyi seçer.</p>
                </div>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors font-medium shadow-sm"
                >
                    <Plus size={18} /> Yeni Şube
                </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                {loading ? (
                    [1, 2].map(i => <div key={i} className="bg-white rounded-xl border p-6 h-40 animate-pulse" />)
                ) : branches.length === 0 ? (
                    <div className="md:col-span-2 p-12 text-center bg-white rounded-xl border border-gray-200 text-gray-500">
                        <MapPin size={48} className="mx-auto mb-4 text-gray-300" />
                        <p className="font-semibold text-lg mb-1">Henüz şube yok</p>
                        <p className="text-sm">İlk şubenizi ekleyerek başlayın.</p>
                    </div>
                ) : (
                    branches.map(b => (
                        <div key={b.id} className={`bg-white rounded-xl border border-gray-200 p-6 shadow-sm transition-all ${!b.isActive ? 'opacity-50' : ''}`}>
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                        <MapPin size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">{b.name}</h3>
                                        {b.district && <span className="text-xs text-gray-500">{b.district}</span>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${b.isActive ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                                        {b.isActive ? 'Aktif' : 'Pasif'}
                                    </span>
                                    <button onClick={() => handleToggle(b)} className={`p-1.5 rounded-lg transition-colors ${b.isActive ? 'text-green-500 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}>
                                        {b.isActive ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                                    </button>
                                    <button onClick={() => openEdit(b)} className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg"><Edit2 size={16} /></button>
                                    <button onClick={() => handleDelete(b.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                                </div>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{b.address}</p>
                            {b.phone && <p className="text-xs text-gray-400 flex items-center gap-1"><Phone size={12} /> {b.phone}</p>}
                        </div>
                    ))
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
                    onClick={e => e.target === e.currentTarget && setIsModalOpen(false)}
                >
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <h2 className="text-lg font-bold mb-4">{editingId ? 'Şube Düzenle' : 'Yeni Şube'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Şube Adı</label>
                                <input required type="text"
                                    className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    placeholder="Örn: Uydukent Şubesi"
                                    value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Adres</label>
                                <textarea required
                                    className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    rows={2} placeholder="Tam adres"
                                    value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Mahalle</label>
                                    <input type="text"
                                        className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                        placeholder="Selçuklu Mah."
                                        value={form.district} onChange={e => setForm({ ...form, district: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                                    <input type="text"
                                        className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                        placeholder="0272 ..."
                                        value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                                </div>
                            </div>
                            <div className="flex gap-3 justify-end pt-2">
                                <button type="button" onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl text-sm font-medium">
                                    İptal
                                </button>
                                <button type="submit"
                                    className="px-6 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-dark text-sm font-medium">
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
