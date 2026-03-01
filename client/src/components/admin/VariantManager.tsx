'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Plus, Trash2, Package } from 'lucide-react';
import { toast } from 'sonner';

interface AttributeType {
    id: number;
    name: string;
    values: { id: number; value: string; colorHex?: string | null }[];
}

interface Variant {
    id: number;
    sku: string | null;
    price: string | null;
    stock: number;
    isActive: boolean;
    attributes: { attributeValueId: number; attributeValue: { value: string; attributeType: { name: string } } }[];
}

export default function VariantManager({ productId }: { productId: number }) {
    const [attributeTypes, setAttributeTypes] = useState<AttributeType[]>([]);
    const [variants, setVariants] = useState<Variant[]>([]);
    const [loading, setLoading] = useState(true);

    // Yeni varyant formu
    const [newVariant, setNewVariant] = useState<{
        selectedAttributes: Record<number, number>; // typeId -> valueId
        price: string;
        stock: string;
        sku: string;
    }>({ selectedAttributes: {}, price: '', stock: '0', sku: '' });

    const fetchData = async () => {
        try {
            const [attrRes, varRes] = await Promise.all([
                api.get('/attributes/types'),
                api.get(`/variants/product/${productId}`),
            ]);
            setAttributeTypes(attrRes.data);
            setVariants(varRes.data);
        } catch {
            toast.error('Varyant bilgileri yüklenemedi');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [productId]);

    const handleAddVariant = async () => {
        const attrValueIds = Object.values(newVariant.selectedAttributes);
        if (attrValueIds.length === 0) {
            toast.error('En az bir özellik seçin');
            return;
        }

        try {
            await api.post('/variants', {
                productId,
                attributeValueIds: attrValueIds,
                price: newVariant.price ? parseFloat(newVariant.price) : null,
                stock: parseInt(newVariant.stock) || 0,
                sku: newVariant.sku || null,
            });
            toast.success('Varyant eklendi');
            setNewVariant({ selectedAttributes: {}, price: '', stock: '0', sku: '' });
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Varyant eklenemedi');
        }
    };

    const handleDeleteVariant = async (variantId: number) => {
        if (!confirm('Bu varyantı silmek istediğinize emin misiniz?')) return;
        try {
            await api.delete(`/variants/${variantId}`);
            toast.success('Varyant silindi');
            fetchData();
        } catch {
            toast.error('Silinemedi');
        }
    };

    if (loading) return null;
    if (attributeTypes.length === 0) return null; // Özellik tipi yoksa bölümü gösterme

    return (
        <div className="mt-8 bg-white rounded-2xl shadow-sm border p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
                <Package size={20} /> Varyantlar
            </h2>
            <p className="text-sm text-gray-500 mb-6">
                Ürünün farklı seçeneklerini (renk, boyut vb.) buradan yönetin.
                Özellik tipleri <a href="/admin/attributes" className="text-primary underline">Özellikler</a> sayfasından tanımlanır.
            </p>

            {/* Mevcut varyantlar */}
            {variants.length > 0 && (
                <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Mevcut Varyantlar ({variants.length})</h3>
                    <div className="space-y-2">
                        {variants.map(v => (
                            <div key={v.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border">
                                <div className="flex items-center gap-3">
                                    <div className="flex flex-wrap gap-1.5">
                                        {v.attributes.map((a, i) => (
                                            <span key={i} className="px-2 py-0.5 bg-white border rounded-md text-xs font-medium">
                                                {a.attributeValue.attributeType.name}: {a.attributeValue.value}
                                            </span>
                                        ))}
                                    </div>
                                    <span className="text-sm text-gray-600">
                                        {v.price ? `${Number(v.price).toFixed(2)} ₺` : 'Ana fiyat'}
                                    </span>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${v.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        Stok: {v.stock}
                                    </span>
                                    {v.sku && <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{v.sku}</code>}
                                </div>
                                <button onClick={() => handleDeleteVariant(v.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Yeni varyant ekle */}
            <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Yeni Varyant Ekle</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                    {attributeTypes.map(type => (
                        <div key={type.id}>
                            <label className="block text-xs font-medium text-gray-600 mb-1">{type.name}</label>
                            <select
                                className="w-full border rounded-lg p-2 text-sm"
                                value={newVariant.selectedAttributes[type.id] || ''}
                                onChange={e => setNewVariant(prev => ({
                                    ...prev,
                                    selectedAttributes: {
                                        ...prev.selectedAttributes,
                                        [type.id]: parseInt(e.target.value)
                                    }
                                }))}
                            >
                                <option value="">Seçiniz</option>
                                {type.values.map(v => (
                                    <option key={v.id} value={v.id}>
                                        {v.value} {v.colorHex ? `(${v.colorHex})` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-3 gap-3 mb-3">
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Fiyat (boş = ana fiyat)</label>
                        <input type="number" step="0.01" className="w-full border rounded-lg p-2 text-sm" placeholder="Opsiyonel"
                            value={newVariant.price} onChange={e => setNewVariant({ ...newVariant, price: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Stok</label>
                        <input type="number" min="0" className="w-full border rounded-lg p-2 text-sm"
                            value={newVariant.stock} onChange={e => setNewVariant({ ...newVariant, stock: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">SKU (opsiyonel)</label>
                        <input type="text" className="w-full border rounded-lg p-2 text-sm" placeholder="VAR-001"
                            value={newVariant.sku} onChange={e => setNewVariant({ ...newVariant, sku: e.target.value.toUpperCase() })} />
                    </div>
                </div>
                <button onClick={handleAddVariant}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-dark">
                    <Plus size={16} /> Varyant Ekle
                </button>
            </div>
        </div>
    );
}
