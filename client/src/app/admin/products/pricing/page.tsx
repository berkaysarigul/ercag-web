'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { DollarSign, ArrowUp, ArrowDown, Percent, Hash, Eye, Play, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const ACTIONS = [
    { value: 'increase_percent', label: 'Yüzde Zam', icon: ArrowUp, color: 'text-red-500', desc: 'Tüm fiyatlara % artış' },
    { value: 'decrease_percent', label: 'Yüzde İndirim', icon: ArrowDown, color: 'text-green-500', desc: 'Tüm fiyatlardan % düşüş' },
    { value: 'increase_fixed', label: 'Sabit Zam (₺)', icon: ArrowUp, color: 'text-red-500', desc: 'Her ürüne sabit ₺ ekle' },
    { value: 'decrease_fixed', label: 'Sabit İndirim (₺)', icon: ArrowDown, color: 'text-green-500', desc: 'Her üründen sabit ₺ çıkar' },
    { value: 'set_price', label: 'Sabit Fiyat Ata', icon: Hash, color: 'text-blue-500', desc: 'Tüm ürünleri aynı fiyata çek' },
];

export default function BulkPricingPage() {
    const [categories, setCategories] = useState<any[]>([]);
    const [brands, setBrands] = useState<any[]>([]);
    const [scope, setScope] = useState<string>('all');
    const [scopeId, setScopeId] = useState<string>('');
    const [action, setAction] = useState<string>('increase_percent');
    const [value, setValue] = useState<string>('');
    const [preview, setPreview] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [applied, setApplied] = useState(false);

    useEffect(() => {
        Promise.all([
            api.get('/categories?flat=true'),
            api.get('/brands'),
        ]).then(([catRes, brandRes]) => {
            setCategories(catRes.data);
            setBrands(brandRes.data);
        });
    }, []);

    const handlePreview = async () => {
        if (!value) { toast.error('Değer girin'); return; }
        setLoading(true);
        setPreview(null);
        setApplied(false);
        try {
            const res = await api.post(`/products/bulk-price-update?preview=true`, {
                scope, scopeId: scopeId || undefined, action, value: parseFloat(value)
            });
            setPreview(res.data);
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Önizleme başarısız');
        } finally {
            setLoading(false);
        }
    };

    const handleApply = async () => {
        if (!confirm(`${preview?.affectedCount} ürünün fiyatı güncellenecek. Emin misiniz?`)) return;
        setLoading(true);
        try {
            const res = await api.post('/products/bulk-price-update', {
                scope, scopeId: scopeId || undefined, action, value: parseFloat(value)
            });
            toast.success(res.data.message);
            setApplied(true);
            setPreview(null);
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Güncelleme başarısız');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-4xl">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Toplu Fiyat Güncelleme</h1>
                <p className="text-sm text-gray-500 mt-1">Kategori, marka veya tüm ürünlere toplu fiyat değişikliği uygulayın.</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
                {/* Kapsam Seçimi */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Hedef</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {[
                            { key: 'all', label: 'Tüm Ürünler' },
                            { key: 'category', label: 'Kategoriye Göre' },
                            { key: 'subcategory', label: 'Alt Kategoriye Göre' },
                            { key: 'brand', label: 'Markaya Göre' },
                        ].map(s => (
                            <button key={s.key} type="button"
                                onClick={() => { setScope(s.key); setScopeId(''); setPreview(null); }}
                                className={`px-4 py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${scope === s.key ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                    }`}>
                                {s.label}
                            </button>
                        ))}
                    </div>

                    {scope === 'category' && (
                        <select className="mt-3 w-full border border-gray-200 rounded-xl p-2.5 text-sm"
                            value={scopeId} onChange={e => { setScopeId(e.target.value); setPreview(null); }}>
                            <option value="">Kategori seçin...</option>
                            {categories.filter(c => !c.parentId).map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    )}
                    {scope === 'subcategory' && (
                        <select className="mt-3 w-full border border-gray-200 rounded-xl p-2.5 text-sm"
                            value={scopeId} onChange={e => { setScopeId(e.target.value); setPreview(null); }}>
                            <option value="">Alt kategori seçin...</option>
                            {categories.filter(c => c.parentId).map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    )}
                    {scope === 'brand' && (
                        <select className="mt-3 w-full border border-gray-200 rounded-xl p-2.5 text-sm"
                            value={scopeId} onChange={e => { setScopeId(e.target.value); setPreview(null); }}>
                            <option value="">Marka seçin...</option>
                            {brands.map(b => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                        </select>
                    )}
                </div>

                {/* İşlem Seçimi */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">İşlem</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        {ACTIONS.map(a => {
                            const Icon = a.icon;
                            return (
                                <button key={a.value} type="button"
                                    onClick={() => { setAction(a.value); setPreview(null); }}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${action === a.value ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'
                                        }`}>
                                    <Icon size={18} className={a.color} />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{a.label}</p>
                                        <p className="text-[10px] text-gray-400">{a.desc}</p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Değer */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Değer {action.includes('percent') ? '(%)' : '(₺)'}
                    </label>
                    <div className="flex gap-3">
                        <input type="number" min="0" step="0.01"
                            className="flex-1 border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            placeholder={action.includes('percent') ? 'Örn: 10' : 'Örn: 5.00'}
                            value={value}
                            onChange={e => { setValue(e.target.value); setPreview(null); }} />
                        <button onClick={handlePreview} disabled={loading || !value}
                            className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium text-sm flex items-center gap-2 disabled:opacity-50 transition-colors">
                            <Eye size={16} /> Önizle
                        </button>
                    </div>
                </div>
            </div>

            {/* Önizleme Tablosu */}
            {preview && (
                <div className="bg-white rounded-xl border border-amber-200 shadow-sm overflow-hidden">
                    <div className="bg-amber-50 px-5 py-3 border-b border-amber-200 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <AlertTriangle size={18} className="text-amber-600" />
                            <span className="font-bold text-amber-800">{preview.affectedCount} ürün etkilenecek</span>
                        </div>
                        <button onClick={handleApply} disabled={loading}
                            className="px-5 py-2 bg-primary text-white rounded-xl font-medium text-sm flex items-center gap-2 hover:bg-primary-dark disabled:opacity-50 transition-colors">
                            <Play size={14} /> Uygula
                        </button>
                    </div>

                    <div className="p-4">
                        <div className="grid grid-cols-3 gap-4 mb-4 text-center">
                            <div className="bg-gray-50 rounded-lg p-3">
                                <p className="text-xs text-gray-500 mb-1">Toplam Eski</p>
                                <p className="font-bold text-gray-900">{preview.totalOldSum.toFixed(2)} ₺</p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3">
                                <p className="text-xs text-gray-500 mb-1">Toplam Yeni</p>
                                <p className="font-bold text-primary">{preview.totalNewSum.toFixed(2)} ₺</p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3">
                                <p className="text-xs text-gray-500 mb-1">Fark</p>
                                <p className={`font-bold ${preview.totalNewSum > preview.totalOldSum ? 'text-red-500' : 'text-green-500'}`}>
                                    {(preview.totalNewSum - preview.totalOldSum) > 0 ? '+' : ''}
                                    {(preview.totalNewSum - preview.totalOldSum).toFixed(2)} ₺
                                </p>
                            </div>
                        </div>

                        <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-100">
                            <table className="w-full text-sm">
                                <thead className="text-xs text-gray-500 bg-gray-50 sticky top-0">
                                    <tr>
                                        <th className="text-left px-3 py-2">Ürün</th>
                                        <th className="text-right px-3 py-2">Eski</th>
                                        <th className="text-right px-3 py-2">Yeni</th>
                                        <th className="text-right px-3 py-2">Fark</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {preview.preview.map((p: any) => (
                                        <tr key={p.id} className="hover:bg-gray-50">
                                            <td className="px-3 py-2 truncate max-w-[200px]">{p.name}</td>
                                            <td className="px-3 py-2 text-right text-gray-500">{p.oldPrice.toFixed(2)} ₺</td>
                                            <td className="px-3 py-2 text-right font-medium">{p.newPrice.toFixed(2)} ₺</td>
                                            <td className={`px-3 py-2 text-right font-medium ${p.diff > 0 ? 'text-red-500' : p.diff < 0 ? 'text-green-500' : 'text-gray-400'}`}>
                                                {p.diff > 0 ? '+' : ''}{p.diff.toFixed(2)} ₺
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {preview.affectedCount > 50 && (
                                <p className="text-xs text-gray-400 text-center py-2 border-t border-gray-100">
                                    ...ve {preview.affectedCount - 50} ürün daha
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Başarı Mesajı */}
            {applied && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                    <CheckCircle2 size={20} className="text-green-600" />
                    <span className="text-sm font-medium text-green-800">Fiyatlar başarıyla güncellendi!</span>
                </div>
            )}
        </div>
    );
}
