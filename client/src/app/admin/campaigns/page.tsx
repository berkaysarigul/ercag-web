'use client';
import { useState, useEffect, useMemo } from 'react';
import api from '@/lib/api';
import { Plus, Trash2, Edit, Zap, Percent, Gift, Tag, Calendar, ToggleLeft, ToggleRight, Copy, Search, X, Clock, AlertCircle, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

// ═══ Sabitler ═══
const TYPE_CONFIG: Record<string, { label: string; icon: typeof Zap; color: string; bg: string; border: string; description: string }> = {
    FLASH_SALE: { label: 'Flash Satış', icon: Zap, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', description: 'Belirli ürünlerde sınırlı süreli indirim' },
    CATEGORY_DISCOUNT: { label: 'Kategori İndirimi', icon: Percent, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', description: 'Bir kategorideki tüm ürünlere indirim' },
    BUY_X_GET_Y: { label: 'Al-Götür', icon: Gift, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200', description: 'X al Y öde kampanyası' },
};

function getCampaignStatus(c: { isActive: boolean; startDate?: string; endDate?: string }): { label: string; color: string; bg: string } {
    if (!c.isActive) return { label: 'Pasif', color: 'text-gray-500', bg: 'bg-gray-100' };
    const now = new Date();
    const start = c.startDate ? new Date(c.startDate) : null;
    const end = c.endDate ? new Date(c.endDate) : null;
    if (end && end < now) return { label: 'Sona Erdi', color: 'text-red-600', bg: 'bg-red-50' };
    if (start && start > now) return { label: 'Planlandı', color: 'text-blue-600', bg: 'bg-blue-50' };
    return { label: 'Aktif', color: 'text-green-600', bg: 'bg-green-50' };
}

function getRemainingText(endDate?: string): string | null {
    if (!endDate) return null;
    const diff = new Date(endDate).getTime() - Date.now();
    if (diff <= 0) return null;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return `${days} gün kaldı`;
    if (hours > 0) return `${hours} saat kaldı`;
    return 'Son dakikalar';
}

// ═══ Ürün Seçici Bileşeni ═══
function ProductPicker({ selectedIds, onChange, allProducts }: {
    selectedIds: number[];
    onChange: (ids: number[]) => void;
    allProducts: { id: number; name: string; price: number; image?: string | null }[];
}) {
    const [search, setSearch] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    const filtered = useMemo(() => {
        if (!search) return allProducts.slice(0, 20);
        const q = search.toLowerCase();
        return allProducts.filter(p => p.name.toLowerCase().includes(q) || p.id.toString().includes(q)).slice(0, 20);
    }, [search, allProducts]);

    const toggle = (id: number) => {
        onChange(selectedIds.includes(id) ? selectedIds.filter(x => x !== id) : [...selectedIds, id]);
    };

    const selectedProducts = allProducts.filter(p => selectedIds.includes(p.id));

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Ürünler</label>

            {/* Seçili ürünler */}
            {selectedProducts.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                    {selectedProducts.map(p => (
                        <span key={p.id} className="inline-flex items-center gap-1 px-2 py-1 bg-primary/5 text-primary rounded-lg text-xs font-medium border border-primary/10">
                            {p.name}
                            <button type="button" onClick={() => toggle(p.id)} className="hover:text-red-500 transition-colors"><X size={12} /></button>
                        </span>
                    ))}
                </div>
            )}

            {/* Arama ve dropdown */}
            <div className="relative">
                <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary">
                    <Search size={16} className="ml-3 text-gray-400 shrink-0" />
                    <input
                        type="text"
                        placeholder="Ürün adı veya ID ile ara..."
                        className="w-full p-2.5 text-sm outline-none"
                        value={search}
                        onChange={e => { setSearch(e.target.value); setIsOpen(true); }}
                        onFocus={() => setIsOpen(true)}
                    />
                    <span className="text-xs text-gray-400 pr-3 shrink-0">{selectedIds.length} seçili</span>
                </div>

                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
                        <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                            {filtered.length > 0 ? filtered.map(p => (
                                <button key={p.id} type="button"
                                    onClick={() => toggle(p.id)}
                                    className={`w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${selectedIds.includes(p.id) ? 'bg-primary/5' : ''}`}>
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span className="text-xs text-gray-400 shrink-0">#{p.id}</span>
                                        <span className="truncate text-gray-800">{p.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className="text-xs text-gray-500">{Number(p.price).toFixed(2)} ₺</span>
                                        {selectedIds.includes(p.id) && <span className="w-4 h-4 bg-primary text-white rounded-full flex items-center justify-center text-xs">✓</span>}
                                    </div>
                                </button>
                            )) : (
                                <div className="px-3 py-4 text-sm text-gray-400 text-center">Ürün bulunamadı</div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

// ═══ Sabit Tipler ═══
const initialForm = { name: '', type: 'FLASH_SALE', startDate: '', endDate: '', isActive: true };
const initialConfig = { discountPercent: '', categoryId: '', productIds: [] as number[], buyQuantity: '', payQuantity: '' };

export default function AdminCampaignsPage() {
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [form, setForm] = useState(initialForm);
    const [config, setConfig] = useState(initialConfig);
    const [filter, setFilter] = useState<'all' | 'active' | 'expired' | 'scheduled'>('all');

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [campRes, catRes, prodRes] = await Promise.all([
                api.get('/campaigns'),
                api.get('/categories'),
                api.get('/products?limit=500'),
            ]);
            setCampaigns(campRes.data);
            setCategories(catRes.data);
            setProducts(prodRes.data.products || prodRes.data || []);
        } catch {
            toast.error('Veriler yüklenemedi');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAll(); }, []);

    // ── Filtreleme ──
    const filteredCampaigns = useMemo(() => {
        if (filter === 'all') return campaigns;
        return campaigns.filter(c => {
            const status = getCampaignStatus(c);
            if (filter === 'active') return status.label === 'Aktif';
            if (filter === 'expired') return status.label === 'Sona Erdi';
            if (filter === 'scheduled') return status.label === 'Planlandı';
            return true;
        });
    }, [campaigns, filter]);

    // ── Modal Aç/Kapa ──
    const openCreate = () => {
        setEditingId(null);
        setForm(initialForm);
        setConfig(initialConfig);
        setIsModalOpen(true);
    };

    const openEdit = (c: any) => {
        setEditingId(c.id);
        let cfg: any = {};
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
            productIds: Array.isArray(cfg.productIds) ? cfg.productIds.map(Number) : [],
            buyQuantity: String(cfg.buyQuantity || ''),
            payQuantity: String(cfg.payQuantity || ''),
        });
        setIsModalOpen(true);
    };

    const handleDuplicate = (c: any) => {
        openEdit(c);
        setEditingId(null); // Yeni olarak oluştur
        setForm(prev => ({ ...prev, name: `${prev.name} (Kopya)` }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        let finalConfig: Record<string, unknown> = {};

        if (form.type === 'CATEGORY_DISCOUNT') {
            finalConfig = { categoryId: parseInt(config.categoryId), discountPercent: parseFloat(config.discountPercent) };
        } else if (form.type === 'FLASH_SALE') {
            if (config.productIds.length === 0) { toast.error('En az 1 ürün seçin'); return; }
            finalConfig = { productIds: config.productIds, discountPercent: parseFloat(config.discountPercent) };
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
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'İşlem başarısız');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Bu kampanyayı silmek istediğinize emin misiniz?')) return;
        try {
            await api.delete(`/campaigns/${id}`);
            toast.success('Kampanya silindi');
            fetchAll();
        } catch { toast.error('Silme başarısız'); }
    };

    const handleToggle = async (c: any) => {
        try {
            await api.put(`/campaigns/${c.id}`, { isActive: !c.isActive });
            toast.success(`Kampanya ${!c.isActive ? 'aktif' : 'pasif'} edildi`);
            fetchAll();
        } catch { toast.error('Durum güncellenemedi'); }
    };

    const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }) : '—';

    const getConfigSummary = (c: any) => {
        let cfg: any = {};
        try { cfg = typeof c.config === 'string' ? JSON.parse(c.config) : c.config; } catch { }
        const catName = categories.find(cat => cat.id === parseInt(cfg.categoryId))?.name;
        if (c.type === 'CATEGORY_DISCOUNT') return `%${cfg.discountPercent || 0} indirim · ${catName || 'Kategori'}`;
        if (c.type === 'FLASH_SALE') return `%${cfg.discountPercent || 0} indirim · ${Array.isArray(cfg.productIds) ? cfg.productIds.length : '?'} ürün`;
        if (c.type === 'BUY_X_GET_Y') return `${cfg.buyQuantity || 0} al ${cfg.payQuantity || 0} öde`;
        return '';
    };

    // ═══ Sayaçlar ═══
    const statusCounts = useMemo(() => {
        const counts = { all: campaigns.length, active: 0, expired: 0, scheduled: 0 };
        campaigns.forEach(c => {
            const s = getCampaignStatus(c);
            if (s.label === 'Aktif') counts.active++;
            if (s.label === 'Sona Erdi') counts.expired++;
            if (s.label === 'Planlandı') counts.scheduled++;
        });
        return counts;
    }, [campaigns]);

    return (
        <div className="space-y-6">
            {/* ═══ Header ═══ */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Kampanya Yönetimi</h1>
                    <p className="text-sm text-gray-500 mt-1">Aktif kampanyalar anasayfada otomatik gösterilir.</p>
                </div>
                <button onClick={openCreate}
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors font-medium shadow-sm">
                    <Plus size={18} /> Yeni Kampanya
                </button>
            </div>

            {/* ═══ Filtre Tab'ları ═══ */}
            {campaigns.length > 0 && (
                <div className="flex gap-1.5 bg-white p-1.5 rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
                    {[
                        { key: 'all' as const, label: 'Tümü', count: statusCounts.all },
                        { key: 'active' as const, label: 'Aktif', count: statusCounts.active },
                        { key: 'scheduled' as const, label: 'Planlandı', count: statusCounts.scheduled },
                        { key: 'expired' as const, label: 'Sona Erdi', count: statusCounts.expired },
                    ].map(tab => (
                        <button key={tab.key} onClick={() => setFilter(tab.key)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${filter === tab.key
                                ? 'bg-primary text-white shadow-sm'
                                : 'text-gray-500 hover:bg-gray-100'
                                }`}>
                            {tab.label}
                            {tab.count > 0 && (
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${filter === tab.key ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-600'}`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            )}

            {/* ═══ Kampanya Listesi ═══ */}
            {loading ? (
                <div className="grid gap-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-gray-200 rounded-lg" />
                                <div className="flex-1 space-y-2"><div className="h-4 bg-gray-200 rounded w-1/3" /><div className="h-3 bg-gray-100 rounded w-1/2" /></div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : filteredCampaigns.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-16 text-center">
                    <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Zap size={28} className="text-orange-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {filter !== 'all' ? 'Bu durumda kampanya yok' : 'Henüz kampanya yok'}
                    </h3>
                    <p className="text-gray-500 text-sm mb-6">Flash satış, kategori indirimi veya al-götür kampanyası oluşturun.</p>
                    <button onClick={openCreate}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors font-medium">
                        <Plus size={16} /> İlk Kampanyayı Oluştur
                    </button>
                </div>
            ) : (
                <div className="grid gap-3">
                    {filteredCampaigns.map((c: any) => {
                        const typeConfig = TYPE_CONFIG[c.type] || TYPE_CONFIG.FLASH_SALE;
                        const status = getCampaignStatus(c);
                        const remaining = c.isActive ? getRemainingText(c.endDate) : null;
                        const isExpired = status.label === 'Sona Erdi';
                        const Icon = typeConfig.icon;

                        return (
                            <div key={c.id}
                                className={`bg-white rounded-xl border p-5 flex items-center gap-5 transition-all hover:shadow-md ${isExpired || !c.isActive ? 'opacity-60' : ''} ${typeConfig.border} border-l-4`}>

                                {/* Tür İkonu */}
                                <div className={`w-11 h-11 ${typeConfig.bg} rounded-xl flex items-center justify-center shrink-0`}>
                                    <Icon size={20} className={typeConfig.color} />
                                </div>

                                {/* Bilgiler */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h3 className="font-semibold text-gray-900">{c.name}</h3>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${status.bg} ${status.color}`}>
                                            {status.label}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500 mt-0.5">{getConfigSummary(c)}</p>
                                    <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                                        <span className="flex items-center gap-1">
                                            <Calendar size={12} />
                                            {formatDate(c.startDate)} — {formatDate(c.endDate)}
                                        </span>
                                        {remaining && (
                                            <span className={`flex items-center gap-1 font-medium ${remaining.includes('saat') || remaining.includes('dakika') ? 'text-red-500' : 'text-amber-500'}`}>
                                                <Clock size={12} />
                                                {remaining}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Aksiyonlar */}
                                <div className="flex items-center gap-1 shrink-0">
                                    <button onClick={() => handleToggle(c)}
                                        className={`p-2 rounded-lg transition-colors ${c.isActive ? 'text-green-500 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}
                                        title={c.isActive ? 'Pasif yap' : 'Aktif yap'}>
                                        {c.isActive ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                                    </button>
                                    <button onClick={() => handleDuplicate(c)}
                                        className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                        title="Kopyala">
                                        <Copy size={16} />
                                    </button>
                                    <button onClick={() => openEdit(c)}
                                        className="p-2 text-gray-400 hover:text-primary hover:bg-brand-50 rounded-lg transition-colors"
                                        title="Düzenle">
                                        <Edit size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(c.id)}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Sil">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ═══ Modal ═══ */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
                    onClick={e => e.target === e.currentTarget && setIsModalOpen(false)}>
                    <div className="bg-white rounded-2xl p-6 w-full max-w-xl shadow-2xl max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-5">{editingId ? 'Kampanya Düzenle' : 'Yeni Kampanya'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-5">

                            {/* Kampanya Adı */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Kampanya Adı</label>
                                <input required type="text"
                                    className="w-full border border-gray-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                                    placeholder="Örn: Yaz Sezonu Flash Satış"
                                    value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                            </div>

                            {/* Tür Seçimi — Görsel Kartlar */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Kampanya Türü</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {Object.entries(TYPE_CONFIG).map(([key, tc]) => {
                                        const Icon = tc.icon;
                                        const isSelected = form.type === key;
                                        return (
                                            <button key={key} type="button"
                                                onClick={() => setForm({ ...form, type: key })}
                                                className={`p-3 rounded-xl border-2 text-center transition-all ${isSelected
                                                    ? `${tc.border} ${tc.bg} shadow-sm`
                                                    : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                                                    }`}>
                                                <Icon size={20} className={`mx-auto mb-1 ${isSelected ? tc.color : 'text-gray-400'}`} />
                                                <p className={`text-xs font-semibold ${isSelected ? tc.color : 'text-gray-600'}`}>{tc.label}</p>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Durum + Tarih */}
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Durum</label>
                                    <select className="w-full border border-gray-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                                        value={form.isActive ? 'true' : 'false'} onChange={e => setForm({ ...form, isActive: e.target.value === 'true' })}>
                                        <option value="true">Aktif</option>
                                        <option value="false">Pasif</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Başlangıç</label>
                                    <input required type="date"
                                        className="w-full border border-gray-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                                        value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Bitiş</label>
                                    <input required type="date"
                                        className="w-full border border-gray-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                                        value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} />
                                </div>
                            </div>

                            {/* Tür-spesifik ayarlar */}
                            <div className="border-t border-gray-100 pt-4">
                                <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                    {(() => { const tc = TYPE_CONFIG[form.type]; const I = tc.icon; return <I size={16} className={tc.color} />; })()}
                                    {TYPE_CONFIG[form.type]?.label} Ayarları
                                </p>

                                {form.type === 'CATEGORY_DISCOUNT' && (
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                                            <select required
                                                className="w-full border border-gray-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                                                value={config.categoryId} onChange={e => setConfig({ ...config, categoryId: e.target.value })}>
                                                <option value="">Seçin...</option>
                                                {categories.map((cat: any) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">İndirim (%)</label>
                                            <input required type="number" min="1" max="100"
                                                className="w-full border border-gray-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                                                placeholder="20" value={config.discountPercent} onChange={e => setConfig({ ...config, discountPercent: e.target.value })} />
                                        </div>
                                    </div>
                                )}

                                {form.type === 'FLASH_SALE' && (
                                    <div className="space-y-3">
                                        <ProductPicker
                                            selectedIds={config.productIds}
                                            onChange={(ids) => setConfig({ ...config, productIds: ids })}
                                            allProducts={products}
                                        />
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">İndirim (%)</label>
                                            <input required type="number" min="1" max="100"
                                                className="w-full border border-gray-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                                                placeholder="30" value={config.discountPercent} onChange={e => setConfig({ ...config, discountPercent: e.target.value })} />
                                        </div>
                                    </div>
                                )}

                                {form.type === 'BUY_X_GET_Y' && (
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Alınacak Adet (X)</label>
                                                <input required type="number" min="1"
                                                    className="w-full border border-gray-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                                                    placeholder="3" value={config.buyQuantity} onChange={e => setConfig({ ...config, buyQuantity: e.target.value })} />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Ödenecek Adet (Y)</label>
                                                <input required type="number" min="1"
                                                    className="w-full border border-gray-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                                                    placeholder="2" value={config.payQuantity} onChange={e => setConfig({ ...config, payQuantity: e.target.value })} />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Kategori <span className="text-gray-400 font-normal">(opsiyonel)</span></label>
                                            <select className="w-full border border-gray-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                                                value={config.categoryId} onChange={e => setConfig({ ...config, categoryId: e.target.value })}>
                                                <option value="">Tüm ürünler</option>
                                                {categories.map((cat: any) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Aksiyonlar */}
                            <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
                                <button type="button" onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors font-medium text-sm">
                                    İptal
                                </button>
                                <button type="submit"
                                    className="px-6 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors font-medium shadow-sm text-sm">
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
