'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Plus, Trash, Edit, Calendar, Percent, DollarSign, Gift, Truck } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminCampaignsPage() {
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        type: 'PERCENTAGE_OFF',
        value: '',
        minAmount: '',
        targetProductId: '',
        benefitProductId: '',
        startDate: '',
        endDate: '',
        isActive: true
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
        try {
            if (editingId) {
                await api.put(`/campaigns/${editingId}`, formData);
                toast.success('Kampanya güncellendi');
            } else {
                await api.post('/campaigns', formData);
                toast.success('Kampanya oluşturuldu');
            }
            setIsModalOpen(false);
            setEditingId(null);
            setFormData({
                name: '', description: '', type: 'PERCENTAGE_OFF', value: '',
                minAmount: '', targetProductId: '', benefitProductId: '',
                startDate: '', endDate: '', isActive: true
            });
            fetchCampaigns();
        } catch (error) {
            toast.error('İşlem başarısız');
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
        setFormData({
            name: c.name,
            description: c.description || '',
            type: c.type,
            value: c.value || '',
            minAmount: c.minAmount || '',
            targetProductId: c.targetProductId || '',
            benefitProductId: c.benefitProductId || '',
            startDate: c.startDate ? new Date(c.startDate).toISOString().split('T')[0] : '',
            endDate: c.endDate ? new Date(c.endDate).toISOString().split('T')[0] : '',
            isActive: c.isActive
        });
        setIsModalOpen(true);
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'PERCENTAGE_OFF': return <Percent className="text-blue-500" />;
            case 'FIXED_AMOUNT': return <DollarSign className="text-green-500" />;
            case 'BOGO': return <Gift className="text-purple-500" />;
            case 'FREE_SHIPPING': return <Truck className="text-orange-500" />;
            default: return <Calendar className="text-gray-500" />;
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Kampanyalar</h1>
                <button
                    onClick={() => { setEditingId(null); setIsModalOpen(true); }}
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
                                    <p className="text-sm text-gray-500">{c.description}</p>
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
                            <div>
                                <label className="block text-sm font-medium mb-1">Açıklama</label>
                                <textarea className="w-full border rounded-lg p-2" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Tip</label>
                                    <select className="w-full border rounded-lg p-2" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                        <option value="PERCENTAGE_OFF">Yüzde İndirim</option>
                                        <option value="FIXED_AMOUNT">Sabit Tutar</option>
                                        <option value="BOGO">Al-Götür (BOGO)</option>
                                        <option value="FREE_SHIPPING">Kargo Bedava</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Değer (Oran/Tutar)</label>
                                    <input type="number" className="w-full border rounded-lg p-2" value={formData.value} onChange={e => setFormData({ ...formData, value: e.target.value })} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Min. Sepet Tutarı</label>
                                    <input type="number" className="w-full border rounded-lg p-2" value={formData.minAmount} onChange={e => setFormData({ ...formData, minAmount: e.target.value })} />
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

                            {/* Product specific fields could be added here similar to type logic */}
                            {formData.type === 'BOGO' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Hedef Ürün ID</label>
                                        <input type="number" className="w-full border rounded-lg p-2" value={formData.targetProductId} onChange={e => setFormData({ ...formData, targetProductId: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Hediye Ürün ID</label>
                                        <input type="number" className="w-full border rounded-lg p-2" value={formData.benefitProductId} onChange={e => setFormData({ ...formData, benefitProductId: e.target.value })} />
                                    </div>
                                </div>
                            )}

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
