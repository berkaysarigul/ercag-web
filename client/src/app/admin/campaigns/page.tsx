'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Plus, Trash, Edit, Calendar, Percent, DollarSign, Gift, Truck, Zap, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminCampaignsPage() {
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    // Initial state matching new schema
    const initialFormState = {
        name: '',
        type: 'CATEGORY_DISCOUNT', // Default
        config: {}, // Will hold type-specific data
        startDate: '',
        endDate: '',
        isActive: true
    };

    const [formData, setFormData] = useState(initialFormState);

    // Config sub-states for easier form handling
    const [configData, setConfigData] = useState<any>({
        discountPercent: '',
        categoryId: '',
        productIds: '',
        buyQuantity: '',
        payQuantity: '',
        benefitProductId: '',
    });

    const fetchCampaigns = async () => {
        try {
            const res = await api.get('/campaigns');
            setCampaigns(res.data);
        } catch (error) {
            console.error(error);
            toast.error('Kampanyalar yüklenemedi');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCampaigns();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Construct config object based on type
        let finalConfig = {};
        if (formData.type === 'CATEGORY_DISCOUNT') {
            finalConfig = { categoryId: configData.categoryId, discountPercent: configData.discountPercent };
        } else if (formData.type === 'FLASH_SALE') {
            finalConfig = {
                productIds: configData.productIds.split(',').map((s: string) => s.trim()).filter(Boolean),
                discountPercent: configData.discountPercent
            };
        } else if (formData.type === 'BUY_X_GET_Y') {
            finalConfig = {
                buyQuantity: configData.buyQuantity,
                payQuantity: configData.payQuantity,
                categoryId: configData.categoryId, // Optional
                productId: configData.productIds // reused field for target product ID
            };
        }

        const payload = { ...formData, config: finalConfig };

        try {
            if (editingId) {
                await api.put(`/campaigns/${editingId}`, payload);
                toast.success('Kampanya güncellendi');
            } else {
                await api.post('/campaigns', payload);
                toast.success('Kampanya oluşturuldu');
            }
            setIsModalOpen(false);
            setEditingId(null);
            setFormData(initialFormState);
            setConfigData({});
            fetchCampaigns();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'İşlem başarısız');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Bu kampanyayı silmek istediğinize emin misiniz?')) return;
        try {
            await api.delete(`/campaigns/${id}`);
            toast.success('Kampanya silindi');
            fetchCampaigns();
        } catch (error) {
            toast.error('Silme başarısız');
        }
    };

    const handleEdit = (c: any) => {
        setEditingId(c.id);
        const config = typeof c.config === 'string' ? JSON.parse(c.config) : c.config;

        setFormData({
            name: c.name,
            type: c.type,
            config: config,
            startDate: c.startDate ? new Date(c.startDate).toISOString().split('T')[0] : '',
            endDate: c.endDate ? new Date(c.endDate).toISOString().split('T')[0] : '',
            isActive: c.isActive
        });

        // Populate config state
        let newConfigData = {};
        if (c.type === 'CATEGORY_DISCOUNT') {
            newConfigData = { categoryId: config.categoryId, discountPercent: config.discountPercent };
        } else if (c.type === 'FLASH_SALE') {
            newConfigData = {
                productIds: Array.isArray(config.productIds) ? config.productIds.join(',') : config.productIds,
                discountPercent: config.discountPercent
            };
        } else if (c.type === 'BUY_X_GET_Y') {
            newConfigData = {
                buyQuantity: config.buyQuantity,
                payQuantity: config.payQuantity,
                categoryId: config.categoryId,
                productIds: config.productId // mapping productId to productIds field for UI reuse
            };
        }
        setConfigData(newConfigData);
        setIsModalOpen(true);
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'CATEGORY_DISCOUNT': return <Percent className="text-blue-500" />;
            case 'FLASH_SALE': return <Zap className="text-yellow-500" />;
            case 'BUY_X_GET_Y': return <Gift className="text-purple-500" />;
            case 'LOYALTY': return <ShoppingBag className="text-green-500" />;
            default: return <Calendar className="text-gray-500" />;
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Kampanyalar</h1>
                <button
                    onClick={() => {
                        setEditingId(null);
                        setFormData(initialFormState);
                        setConfigData({});
                        setIsModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                    <Plus size={18} /> Yeni Kampanya
                </button>
            </div>

            {loading ? (
                <div>Yükleniyor...</div>
            ) : (
                <div className="grid gap-4">
                    {campaigns.map((c: any) => (
                        <div key={c.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-gray-50 rounded-lg">{getIcon(c.type)}</div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">{c.name}</h3>
                                    <p className="text-sm text-gray-500">{c.type}</p>
                                    <div className="flex gap-2 mt-1 text-xs text-gray-400">
                                        <span>{new Date(c.startDate).toLocaleDateString()} - {new Date(c.endDate).toLocaleDateString()}</span>
                                        {c.isActive ? <span className="text-green-600 font-medium">Aktif</span> : <span className="text-red-500">Pasif</span>}
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => handleEdit(c)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                                    <Edit size={18} />
                                </button>
                                <button onClick={() => handleDelete(c.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                                    <Trash size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4">{editingId ? 'Kampanya Düzenle' : 'Yeni Kampanya'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Kampanya Adı</label>
                                <input required type="text" className="w-full border rounded-lg p-2" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Tip</label>
                                    <select className="w-full border rounded-lg p-2" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                        <option value="CATEGORY_DISCOUNT">Kategori İndirimi</option>
                                        <option value="FLASH_SALE">Flash Sale (Ürün)</option>
                                        <option value="BUY_X_GET_Y">Al-Götür (BOGO)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Durum</label>
                                    <select className="w-full border rounded-lg p-2" value={formData.isActive ? 'true' : 'false'} onChange={e => setFormData({ ...formData, isActive: e.target.value === 'true' })}>
                                        <option value="true">Aktif</option>
                                        <option value="false">Pasif</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Başlangıç Tarihi</label>
                                    <input required type="date" className="w-full border rounded-lg p-2" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Bitiş Tarihi</label>
                                    <input required type="date" className="w-full border rounded-lg p-2" value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} />
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <h3 className="font-medium text-gray-700 mb-2">Ayarlar ({formData.type})</h3>

                                {formData.type === 'CATEGORY_DISCOUNT' && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Kategori ID</label>
                                            <input required type="number" className="w-full border rounded-lg p-2" value={configData.categoryId || ''} onChange={e => setConfigData({ ...configData, categoryId: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">İndirim Oranı (%)</label>
                                            <input required type="number" className="w-full border rounded-lg p-2" value={configData.discountPercent || ''} onChange={e => setConfigData({ ...configData, discountPercent: e.target.value })} />
                                        </div>
                                    </div>
                                )}

                                {formData.type === 'FLASH_SALE' && (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Ürün ID'leri (Virgülle ayır)</label>
                                            <input required type="text" placeholder="1, 2, 3" className="w-full border rounded-lg p-2" value={configData.productIds || ''} onChange={e => setConfigData({ ...configData, productIds: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">İndirim Oranı (%)</label>
                                            <input required type="number" className="w-full border rounded-lg p-2" value={configData.discountPercent || ''} onChange={e => setConfigData({ ...configData, discountPercent: e.target.value })} />
                                        </div>
                                    </div>
                                )}

                                {formData.type === 'BUY_X_GET_Y' && (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium mb-1">Alınacak Adet (X)</label>
                                                <input required type="number" className="w-full border rounded-lg p-2" value={configData.buyQuantity || ''} onChange={e => setConfigData({ ...configData, buyQuantity: e.target.value })} />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-1">Ödenecek Adet (Y)</label>
                                                <input required type="number" className="w-full border rounded-lg p-2" value={configData.payQuantity || ''} onChange={e => setConfigData({ ...configData, payQuantity: e.target.value })} />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Ürün ID (Opsiyonel)</label>
                                            <input type="number" className="w-full border rounded-lg p-2" value={configData.productIds || ''} onChange={e => setConfigData({ ...configData, productIds: e.target.value })} />
                                            <p className="text-xs text-gray-500">Boş bırakılırsa hangi ürün/kategoriye uygulanacağı belirsiz kalabilir.</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 justify-end mt-6">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">İptal</button>
                                <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Kaydet</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
