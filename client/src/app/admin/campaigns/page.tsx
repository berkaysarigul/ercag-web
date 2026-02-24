'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Plus, Trash, Edit, Zap, Percent, Gift, Tag, Calendar, ToggleLeft, ToggleRight } from 'lucide-react';
import { toast } from 'sonner';

const TYPE_LABELS: Record<string, string> = {
    CATEGORY_DISCOUNT: 'Kategori İndirimi',
    FLASH_SALE: 'Flash Satış',
    BUY_X_GET_Y: 'Al-Götür (BOGO)',
};

const TYPE_COLORS: Record<string, string> = {
    CATEGORY_DISCOUNT: 'bg-blue-50 text-blue-700 border-blue-100',
    FLASH_SALE: 'bg-orange-50 text-orange-700 border-orange-100',
    BUY_X_GET_Y: 'bg-purple-50 text-purple-700 border-purple-100',
};

const TypeIcon = ({ type }: { type: string }) => {
    if (type === 'FLASH_SALE') return <Zap size={18} className="text-orange-500" />;
    if (type === 'CATEGORY_DISCOUNT') return <Percent size={18} className="text-blue-500" />;
    if (type === 'BUY_X_GET_Y') return <Gift size={18} className="text-purple-500" />;
    return <Tag size={18} className="text-gray-500" />;
};

const initialForm = {
    name: '',
    type: 'CATEGORY_DISCOUNT',
    startDate: '',
    endDate: '',
    isActive: true,
};
const initialConfig = { discountPercent: '', categoryId: '', productIds: '', buyQuantity: '', payQuantity: '' };

export default function AdminCampaignsPage() {
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [form, setForm] = useState(initialForm);
    const [config, setConfig] = useState(initialConfig);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [campRes, catRes] = await Promise.all([
                api.get('/campaigns'),
                api.get('/categories')
            ]);
            setCampaigns(campRes.data);
            setCategories(catRes.data);
        } catch {
            toast.error('Veriler yüklenemedi');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAll(); }, []);

    const openCreate = () => {
        setEditingId(null);
        setForm(initialForm);
        setConfig(initialConfig);
        setIsModalOpen(true);
    };

    const openEdit = (c: { id: number; config: string | object; name: string; type: string; startDate?: string; endDate?: string; isActive: boolean }) => {
        setEditingId(c.id);
        let cfg: { discountPercent?: string | number, categoryId?: string | number, productIds?: string[] | string, buyQuantity?: number | string, payQuantity?: number | string } = {};
        try { cfg = typeof c.config === 'string' ? JSON.parse(c.config) : c.config; } catch { }
        setForm({
            name: c.name,
            type: c.type,
            startDate: c.startDate ? c.startDate.split('T')[0] : '',
            endDate: c.endDate ? c.endDate.split('T')[0] : '',
            isActive: c.isActive,
        });
        setConfig({
            discountPercent: String(cfg.discountPercent || ''),
            categoryId: String(cfg.categoryId || ''),
            productIds: Array.isArray(cfg.productIds) ? cfg.productIds.join(', ') : String(cfg.productIds || ''),
            buyQuantity: String(cfg.buyQuantity || ''),
            payQuantity: String(cfg.payQuantity || ''),
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        let finalConfig: Record<string, unknown> = {};
        if (form.type === 'CATEGORY_DISCOUNT') {
            finalConfig = { categoryId: parseInt(config.categoryId), discountPercent: parseFloat(config.discountPercent) };
        } else if (form.type === 'FLASH_SALE') {
            finalConfig = {
                productIds: config.productIds.split(',').map(s => s.trim()).filter(Boolean).map(Number),
                discountPercent: parseFloat(config.discountPercent)
            };
        } else if (form.type === 'BUY_X_GET_Y') {
            finalConfig = { buyQuantity: parseInt(config.buyQuantity), payQuantity: parseInt(config.payQuantity), categoryId: config.categoryId ? parseInt(config.categoryId) : undefined };
        }

        const payload = { ...form, config: finalConfig };
        try {
            if (editingId) {
                await api.put(`/campaigns/${editingId}`, payload);
                toast.success('Kampanya güncellendi');
            } else {
                await api.post('/campaigns', payload);
                toast.success('Kampanya oluşturuldu');
            }
            setIsModalOpen(false);
            fetchAll();
        } catch (err: unknown) {
            const errResponse = (err as any)?.response;
            toast.error(errResponse?.data?.error || 'İşlem başarısız');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Bu kampanyayı silmek istediğinize emin misiniz?')) return;
        try {
            await api.delete(`/campaigns/${id}`);
            toast.success('Kampanya silindi');
            fetchAll();
        } catch {
            toast.error('Silme başarısız');
        }
    };

    const handleToggle = async (c: { id: number; isActive: boolean;[key: string]: unknown }) => {
        try {
            await api.put(`/campaigns/${c.id}`, { ...c, isActive: !c.isActive });
            toast.success(`Kampanya ${!c.isActive ? 'aktif' : 'pasif'} edildi`);
            fetchAll();
        } catch {
            toast.error('Durum güncellenemedi');
        }
    };

    const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('tr-TR') : '—';
    const getCategoryName = (id: number) => categories.find(c => c.id === id)?.name || `#${id}`;

    const getConfigSummary = (c: { type: string; config: string | object }) => {
        let cfg: { discountPercent?: number; categoryId?: number; productIds?: number[]; buyQuantity?: number; payQuantity?: number } = {};
        try { cfg = typeof c.config === 'string' ? JSON.parse(c.config) : c.config; } catch { }
        if (c.type === 'CATEGORY_DISCOUNT') return `%${cfg.discountPercent || 0} indirim • ${getCategoryName(cfg.categoryId || 0)}`;
        if (c.type === 'FLASH_SALE') return `%${cfg.discountPercent || 0} indirim • ${Array.isArray(cfg.productIds) ? cfg.productIds.length : '?'} ürün`;
        if (c.type === 'BUY_X_GET_Y') return `${cfg.buyQuantity || 0} al ${cfg.payQuantity || 0} öde`;
        return '';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Kampanyalar</h1>
                    <p className="text-sm text-gray-500 mt-1">Aktif kampanyalar anasayfada otomatik olarak gösterilir.</p>
                </div>
                <button onClick={openCreate}
                    className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium shadow-sm">
                    <Plus size={18} />
                    Yeni Kampanya
                </button>
            </div>

            {/* Content */}
            {loading ? (
                <div className="grid gap-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                                    <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : campaigns.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-16 text-center">
                    <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Zap size={28} className="text-orange-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Henüz kampanya yok</h3>
                    <p className="text-gray-500 text-sm mb-6">Flash satış, kategori indirimi veya al-götür kampanyası oluşturun.<br />Aktif kampanyalar anasayfada otomatik gösterilir.</p>
                    <button onClick={openCreate}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium">
                        <Plus size={16} />
                        İlk Kampanyayı Oluştur
                    </button>
                </div>
            ) : (
                <div className="grid gap-3">
                    {campaigns.map((c: { id: number; name: string; type: string; isActive: boolean; startDate?: string; endDate?: string; viewCount?: number; useCount?: number; config: string | object }) => (
                        <div key={c.id}
                            className={`bg-white rounded-xl border p-5 flex items-center gap-5 transition-all ${c.isActive ? 'border-gray-100 shadow-sm' : 'border-gray-100 opacity-60'}`}>
                            {/* Icon */}
                            <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center shrink-0">
                                <TypeIcon type={c.type} />
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="font-semibold text-gray-900">{c.name}</h3>
                                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${TYPE_COLORS[c.type] || 'bg-gray-50 text-gray-600'}`}>
                                        {TYPE_LABELS[c.type] || c.type}
                                    </span>
                                    {c.isActive ? (
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-100 font-medium">Aktif</span>
                                    ) : (
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-50 text-gray-500 border font-medium">Pasif</span>
                                    )}
                                </div>
                                <p className="text-sm text-gray-500 mt-0.5">{getConfigSummary(c)}</p>
                                <div className="flex items-center gap-1.5 mt-1.5 text-xs text-gray-400">
                                    <Calendar size={12} />
                                    {formatDate(c.startDate as string)} — {formatDate(c.endDate as string)}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1 shrink-0">
                                <button onClick={() => handleToggle(c)}
                                    className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                    title={c.isActive ? 'Pasif yap' : 'Aktif yap'}>
                                    {c.isActive ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                                </button>
                                <button onClick={() => openEdit(c)}
                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                    <Edit size={18} />
                                </button>
                                <button onClick={() => handleDelete(c.id)}
                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                    <Trash size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={e => e.target === e.currentTarget && setIsModalOpen(false)}>
                    <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-5">{editingId ? 'Kampanya Düzenle' : 'Yeni Kampanya'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Kampanya Adı</label>
                                <input required type="text"
                                    className="w-full border border-gray-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    placeholder="Örn: Yaz Sezonu Flash Satış"
                                    value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                            </div>

                            {/* Type & Status */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tür</label>
                                    <select className="w-full border border-gray-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                        value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                                        <option value="CATEGORY_DISCOUNT">Kategori İndirimi</option>
                                        <option value="FLASH_SALE">Flash Satış</option>
                                        <option value="BUY_X_GET_Y">Al-Götür</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Durum</label>
                                    <select className="w-full border border-gray-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                        value={form.isActive ? 'true' : 'false'} onChange={e => setForm({ ...form, isActive: e.target.value === 'true' })}>
                                        <option value="true">Aktif</option>
                                        <option value="false">Pasif</option>
                                    </select>
                                </div>
                            </div>

                            {/* Dates */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Başlangıç</label>
                                    <input required type="date"
                                        className="w-full border border-gray-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                        value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Bitiş</label>
                                    <input required type="date"
                                        className="w-full border border-gray-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                        value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} />
                                </div>
                            </div>

                            {/* Type-specific config */}
                            <div className="border-t border-gray-100 pt-4">
                                <p className="text-sm font-semibold text-gray-700 mb-3">
                                    {TYPE_LABELS[form.type]} Ayarları
                                </p>

                                {form.type === 'CATEGORY_DISCOUNT' && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                                            <select required
                                                className="w-full border border-gray-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                                value={config.categoryId} onChange={e => setConfig({ ...config, categoryId: e.target.value })}>
                                                <option value="">Seçin...</option>
                                                {categories.map(cat => (
                                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">İndirim Oranı (%)</label>
                                            <input required type="number" min="1" max="100"
                                                className="w-full border border-gray-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                                placeholder="Örn: 20"
                                                value={config.discountPercent} onChange={e => setConfig({ ...config, discountPercent: e.target.value })} />
                                        </div>
                                    </div>
                                )}

                                {form.type === 'FLASH_SALE' && (
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Ürün ID'leri <span className="text-gray-400 font-normal">(virgülle ayırın)</span></label>
                                            <input required type="text" placeholder="1, 2, 3"
                                                className="w-full border border-gray-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                                value={config.productIds} onChange={e => setConfig({ ...config, productIds: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">İndirim Oranı (%)</label>
                                            <input required type="number" min="1" max="100"
                                                className="w-full border border-gray-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                                placeholder="Örn: 30"
                                                value={config.discountPercent} onChange={e => setConfig({ ...config, discountPercent: e.target.value })} />
                                        </div>
                                    </div>
                                )}

                                {form.type === 'BUY_X_GET_Y' && (
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Alınacak Adet (X)</label>
                                                <input required type="number" min="1"
                                                    className="w-full border border-gray-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                                    placeholder="Örn: 3"
                                                    value={config.buyQuantity} onChange={e => setConfig({ ...config, buyQuantity: e.target.value })} />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Ödenecek Adet (Y)</label>
                                                <input required type="number" min="1"
                                                    className="w-full border border-gray-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                                    placeholder="Örn: 2"
                                                    value={config.payQuantity} onChange={e => setConfig({ ...config, payQuantity: e.target.value })} />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Kategori <span className="text-gray-400 font-normal">(opsiyonel)</span></label>
                                            <select className="w-full border border-gray-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                                value={config.categoryId} onChange={e => setConfig({ ...config, categoryId: e.target.value })}>
                                                <option value="">Tüm ürünler</option>
                                                {categories.map(cat => (
                                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 justify-end pt-2">
                                <button type="button" onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors font-medium">
                                    İptal
                                </button>
                                <button type="submit"
                                    className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium shadow-sm">
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
