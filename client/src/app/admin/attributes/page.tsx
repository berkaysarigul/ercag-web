'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Plus, Trash2, Palette, X } from 'lucide-react';
import { toast } from 'sonner';

interface AttrValue { id: number; value: string; colorHex: string | null; sortOrder: number; }
interface AttrType { id: number; name: string; values: AttrValue[]; }

export default function AdminAttributesPage() {
    const [types, setTypes] = useState<AttrType[]>([]);
    const [loading, setLoading] = useState(true);
    const [newTypeName, setNewTypeName] = useState('');
    const [newValues, setNewValues] = useState<Record<number, { value: string; colorHex: string }>>({});

    const fetchTypes = async () => {
        try {
            const r = await api.get('/attributes/types');
            setTypes(r.data);
        } catch {
            toast.error('Yüklenemedi');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchTypes(); }, []);

    const addType = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTypeName.trim()) return;
        try {
            await api.post('/attributes/types', { name: newTypeName });
            setNewTypeName('');
            toast.success('Özellik tipi eklendi');
            fetchTypes();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Hata');
        }
    };

    const deleteType = async (id: number) => {
        if (!confirm('Bu özellik tipini silmek istediğinize emin misiniz?')) return;
        try {
            await api.delete(`/attributes/types/${id}`);
            toast.success('Silindi');
            fetchTypes();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Silinemedi');
        }
    };

    const addValue = async (typeId: number) => {
        const nv = newValues[typeId];
        if (!nv?.value?.trim()) return;
        try {
            await api.post('/attributes/values', { attributeTypeId: typeId, value: nv.value, colorHex: nv.colorHex || null });
            setNewValues(prev => ({ ...prev, [typeId]: { value: '', colorHex: '' } }));
            toast.success('Değer eklendi');
            fetchTypes();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Hata');
        }
    };

    const deleteValue = async (id: number) => {
        try {
            await api.delete(`/attributes/values/${id}`);
            toast.success('Silindi');
            fetchTypes();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Silinemedi');
        }
    };

    const isColorType = (name: string) => name.toLowerCase().includes('renk') || name.toLowerCase().includes('color');

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Ürün Özellikleri</h1>
                    <p className="text-sm text-gray-500 mt-1">Renk, boyut, gramaj gibi dinamik özellik tipleri oluşturun.</p>
                </div>
            </div>

            {/* Yeni Tip Ekle */}
            <form onSubmit={addType} className="flex gap-3">
                <input
                    type="text"
                    placeholder="Yeni özellik tipi (Örn: Renk, Boyut, Uç Kalınlığı)"
                    className="flex-1 border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    value={newTypeName}
                    onChange={e => setNewTypeName(e.target.value)}
                />
                <button type="submit" className="px-5 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-dark font-medium text-sm flex items-center gap-2">
                    <Plus size={16} /> Ekle
                </button>
            </form>

            {/* Tip Listesi */}
            {loading ? (
                <div className="space-y-4">{[1, 2].map(i => <div key={i} className="bg-white rounded-xl border h-32 animate-pulse" />)}</div>
            ) : types.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">
                    <Palette size={48} className="mx-auto mb-4 text-gray-300" />
                    <p className="font-semibold">Henüz özellik tipi yok</p>
                    <p className="text-sm mt-1">Örn: Renk, Boyut, Uç Kalınlığı</p>
                </div>
            ) : (
                types.map(type => (
                    <div key={type.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-3.5 bg-gray-50 border-b">
                            <div className="flex items-center gap-2">
                                <Palette size={18} className="text-primary" />
                                <h3 className="font-bold text-gray-900">{type.name}</h3>
                                <span className="text-xs text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full">{type.values.length} değer</span>
                            </div>
                            <button onClick={() => deleteType(type.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                <Trash2 size={14} />
                            </button>
                        </div>

                        <div className="p-4">
                            {/* Mevcut Değerler */}
                            <div className="flex flex-wrap gap-2 mb-3 min-h-8">
                                {type.values.map(v => (
                                    <span key={v.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-lg text-sm group hover:bg-gray-200 transition-colors">
                                        {v.colorHex && (
                                            <span className="w-3.5 h-3.5 rounded-full border border-gray-300 shrink-0" style={{ backgroundColor: v.colorHex }} />
                                        )}
                                        {v.value}
                                        <button onClick={() => deleteValue(v.id)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                                            <X size={12} />
                                        </button>
                                    </span>
                                ))}
                                {type.values.length === 0 && (
                                    <span className="text-sm text-gray-400 italic">Henüz değer eklenmemiş</span>
                                )}
                            </div>

                            {/* Yeni Değer Ekle */}
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Yeni değer (Örn: Kırmızı, A4, 0.7mm)"
                                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    value={newValues[type.id]?.value || ''}
                                    onChange={e => setNewValues(prev => ({ ...prev, [type.id]: { ...prev[type.id], value: e.target.value } }))}
                                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addValue(type.id))}
                                />
                                {isColorType(type.name) && (
                                    <input
                                        type="color"
                                        className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5"
                                        value={newValues[type.id]?.colorHex || '#000000'}
                                        onChange={e => setNewValues(prev => ({ ...prev, [type.id]: { ...prev[type.id], colorHex: e.target.value } }))}
                                    />
                                )}
                                <button
                                    onClick={() => addValue(type.id)}
                                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                                >
                                    Ekle
                                </button>
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}
