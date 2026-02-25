'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function AdminCouponsPage() {
    const [formData, setFormData] = useState({
        code: '',
        discountType: 'PERCENTAGE', // PERCENTAGE or FIXED
        discountValue: '',
        minOrderAmount: '',
        expirationDate: ''
    });
    const [coupons, setCoupons] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchCoupons();
    }, []);

    const fetchCoupons = async () => {
        try {
            const res = await api.get('/coupons');
            setCoupons(res.data);
        } catch (error) {
            console.error('Failed to fetch coupons', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
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
            setLoading(false);
        }
    };

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">Kupon Yönetimi</h1>

            <div className="bg-white p-6 rounded-xl shadow-sm max-w-2xl">
                <h2 className="text-lg font-semibold mb-4">Yeni Kupon Oluştur</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Kupon Kodu</label>
                        <input
                            type="text"
                            required
                            className="input w-full uppercase"
                            value={formData.code}
                            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                            placeholder="Örn: YAZ2025"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">İndirim Tipi</label>
                            <select
                                className="input w-full"
                                value={formData.discountType}
                                onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                            >
                                <option value="PERCENTAGE">Yüzde (%)</option>
                                <option value="FIXED">Sabit Tutar (₺)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Değer</label>
                            <input
                                type="number"
                                required
                                min="0"
                                step="0.01"
                                className="input w-full"
                                value={formData.discountValue}
                                onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                                placeholder={formData.discountType === 'PERCENTAGE' ? 'Örn: 10' : 'Örn: 50'}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Min. Sepet Tutarı (₺)</label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                className="input w-full"
                                value={formData.minOrderAmount}
                                onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                                placeholder="Opsiyonel"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Son Kullanma Tarihi</label>
                            <input
                                type="date"
                                className="input w-full"
                                value={formData.expirationDate}
                                onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-sm"
                    >
                        {loading ? 'Oluşturuluyor...' : 'Kupon Oluştur'}
                    </button>
                </form>
            </div>

            <div className="mt-8">
                <h2 className="text-lg font-semibold mb-4">Mevcut Kuponlar</h2>
                <div className="grid gap-4">
                    {coupons.map((coupon) => (
                        <div key={coupon.id} className="bg-white p-4 rounded-xl shadow-sm flex justify-between items-center">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-lg">{coupon.code}</span>
                                    <span className={`px-2 py-0.5 rounded text-xs ${coupon.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {coupon.isActive ? 'Aktif' : 'Pasif'}
                                    </span>
                                </div>
                                <p className="text-gray-600 text-sm mt-1">
                                    {coupon.discountType === 'PERCENTAGE' ? `%${coupon.discountValue} İndirim` : `${coupon.discountValue} ₺ İndirim`}
                                    {Number(coupon.minOrderAmount) > 0 && ` • Min. ${coupon.minOrderAmount} ₺`}
                                    {coupon.expirationDate && ` • SKT: ${new Date(coupon.expirationDate).toLocaleDateString('tr-TR')}`}
                                </p>
                            </div>
                            <div className="text-sm text-gray-500">
                                {new Date(coupon.createdAt).toLocaleDateString('tr-TR')}
                            </div>
                        </div>
                    ))}
                    {coupons.length === 0 && <p className="text-gray-500">Henüz kupon oluşturulmamış.</p>}
                </div>
            </div>
        </div>
    );
}
