'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Ticket, Plus, Trash2, Calendar, DollarSign, Percent, Activity } from 'lucide-react';
import Skeleton from '@/components/ui/Skeleton';

export default function AdminCouponsPage() {
    const [formData, setFormData] = useState({
        code: '',
        discountType: 'PERCENTAGE', // PERCENTAGE or FIXED
        discountValue: '',
        minOrderAmount: '',
        expirationDate: ''
    });
    const [coupons, setCoupons] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchCoupons();
    }, []);

    const fetchCoupons = async () => {
        setLoading(true);
        try {
            const res = await api.get('/coupons');
            setCoupons(res.data);
        } catch (error) {
            console.error('Failed to fetch coupons', error);
            toast.error('Kuponlar yüklenemedi');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.post('/coupons', formData);
            toast.success('Kupon başarıyla oluşturuldu');
            setFormData({
                code: '',
                discountType: 'PERCENTAGE',
                discountValue: '',
                minOrderAmount: '',
                expirationDate: ''
            });
            fetchCoupons();
        } catch (error: unknown) {
            console.error('Create coupon error', error);
            const errResponse = (error as any)?.response;
            toast.error(errResponse?.data?.error || 'Kupon oluşturulamadı');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Bu kuponu silmek istediğinize emin misiniz?')) return;
        try {
            await api.delete(`/coupons/${id}`);
            toast.success('Kupon başarıyla silindi');
            fetchCoupons();
        } catch (error: unknown) {
            toast.error('Silme başarısız');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Kupon Yönetimi</h1>
                    <p className="text-sm text-gray-500 mt-1">{loading ? 'Yükleniyor...' : `${coupons.length} kupon listeleniyor`}</p>
                </div>
            </div>

            {/* Yeni Kupon Formu */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <div className="p-2 bg-brand-100 text-brand-600 rounded-lg">
                        <Plus size={20} />
                    </div>
                    Yeni Kupon Oluştur
                </h2>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                    <div className="lg:col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5"><Ticket size={16} className="text-gray-400" />Kupon Kodu</label>
                        <input
                            type="text"
                            required
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none uppercase font-mono tracking-wider"
                            value={formData.code}
                            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                            placeholder="YAZ25"
                        />
                    </div>

                    <div className="lg:col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5"><Activity size={16} className="text-gray-400" />İndirim Tipi</label>
                        <select
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none bg-white"
                            value={formData.discountType}
                            onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                        >
                            <option value="PERCENTAGE">Yüzde (%)</option>
                            <option value="FIXED">Sabit Tutar (₺)</option>
                        </select>
                    </div>

                    <div className="lg:col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                            {formData.discountType === 'PERCENTAGE' ? <Percent size={16} className="text-gray-400" /> : <DollarSign size={16} className="text-gray-400" />}
                            Değer
                        </label>
                        <input
                            type="number"
                            required
                            min="0"
                            step="0.01"
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                            value={formData.discountValue}
                            onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                            placeholder={formData.discountType === 'PERCENTAGE' ? '15' : '100'}
                        />
                    </div>

                    <div className="lg:col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5"><DollarSign size={16} className="text-gray-400" />Min. Sepet</label>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                            value={formData.minOrderAmount}
                            onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                            placeholder="0.00"
                        />
                    </div>

                    <div className="lg:col-span-1 flex flex-col gap-2 relative">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5"><Calendar size={16} className="text-gray-400" />SKT</label>
                            <input
                                type="date"
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                                value={formData.expirationDate}
                                onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="md:col-span-2 lg:col-span-5 flex justify-end mt-2 border-t pt-4">
                        <button
                            type="submit"
                            disabled={saving}
                            className="min-w-[140px] px-6 py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {saving ? 'Oluşturuluyor...' : 'Oluştur'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Tablo */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Kupon Kodu</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">İndirim</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Alt Limit (Sepet)</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Oluşturulma</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Son Kullanma (SKT)</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-sm text-center">Durum</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-sm text-right">İşlem</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <tr key={i}>
                                        <td className="px-6 py-4"><Skeleton variant="text" width={100} /></td>
                                        <td className="px-6 py-4"><Skeleton variant="text" width={80} /></td>
                                        <td className="px-6 py-4"><Skeleton variant="text" width={80} /></td>
                                        <td className="px-6 py-4"><Skeleton variant="text" width={100} /></td>
                                        <td className="px-6 py-4"><Skeleton variant="text" width={100} /></td>
                                        <td className="px-6 py-4 text-center"><Skeleton variant="circular" width={60} height={24} className="mx-auto rounded" /></td>
                                        <td className="px-6 py-4 text-right"><Skeleton variant="circular" width={32} height={32} className="ml-auto rounded-lg" /></td>
                                    </tr>
                                ))
                            ) : coupons.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500 font-medium bg-gray-50/50">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                                                <Ticket size={24} className="text-gray-400" />
                                            </div>
                                            Henüz oluşturulmuş bir kupon bulunmamaktadır.
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                coupons.map(coupon => (
                                    <tr key={coupon.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 font-mono font-bold text-gray-900 tracking-wide text-sm">{coupon.code}</td>
                                        <td className="px-6 py-4 font-medium text-brand-700">
                                            {coupon.discountType === 'PERCENTAGE'
                                                ? <span className="flex items-center gap-1"><Percent size={14} />{coupon.discountValue}</span>
                                                : <span className="flex items-center gap-1"><DollarSign size={14} />{coupon.discountValue} ₺</span>}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 text-sm">
                                            {Number(coupon.minOrderAmount) > 0 ? `${Number(coupon.minOrderAmount).toFixed(2)} ₺` : <span className="text-gray-400 italic">Limit Yok</span>}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 text-sm">
                                            {new Date(coupon.createdAt).toLocaleDateString('tr-TR')}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 text-sm">
                                            {coupon.expirationDate
                                                ? new Date(coupon.expirationDate).toLocaleDateString('tr-TR')
                                                : <span className="text-gray-400 italic">Süresiz</span>}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${coupon.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {coupon.isActive ? 'Aktif' : 'Pasif'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleDelete(coupon.id)}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-auto flex items-center gap-2"
                                                title="Sil"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
