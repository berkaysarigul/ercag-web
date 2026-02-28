'use client';

import { useState } from 'react';
import api from '@/lib/api';
import { Search, Package, CheckCircle, Truck, XCircle, ArrowRight, ShoppingBag, Clock, Store } from 'lucide-react';
import Link from 'next/link';

const STATUS_STEPS = [
    { key: 'PENDING', label: 'Sipariş Alındı', icon: Clock },
    { key: 'PREPARING', label: 'Hazırlanıyor', icon: Package },
    { key: 'READY', label: 'Teslime Hazır', icon: CheckCircle },
    { key: 'COMPLETED', label: 'Teslim Edildi', icon: Truck },
];

const STATUS_INDEX: Record<string, number> = {
    PENDING: 0, PREPARING: 1, READY: 2, COMPLETED: 3, CANCELLED: -1,
};

export default function OrderTrackPage() {
    const [code, setCode] = useState('');
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code.trim()) return;
        setLoading(true);
        setError('');
        setOrder(null);

        try {
            const res = await api.get(`/orders/track/${code.trim().toUpperCase()}`);
            setOrder(res.data);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Sipariş bulunamadı. Kodunuzu kontrol edin.');
        } finally {
            setLoading(false);
        }
    };

    const currentStep = order ? STATUS_INDEX[order.status] : -1;
    const isCancelled = order?.status === 'CANCELLED';

    return (
        <div className="container py-12 pt-36 pb-12">
            <div className="max-w-2xl mx-auto">
                <div className="text-center mb-10">
                    <div className="w-16 h-16 bg-brand-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Search size={28} className="text-brand-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Sipariş Takibi</h1>
                    <p className="text-gray-500">Teslimat kodunuzla siparişinizin durumunu sorgulayın.</p>
                </div>

                <form onSubmit={handleSearch} className="flex gap-3 mb-10">
                    <input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        placeholder="Teslimat kodu (ör: A3F2B1)"
                        className="flex-1 px-5 py-4 border border-gray-200 rounded-2xl text-lg font-mono tracking-wider text-center focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none uppercase bg-white"
                        maxLength={6}
                    />
                    <button
                        type="submit"
                        disabled={loading || !code.trim()}
                        className="px-8 py-4 bg-primary hover:bg-primary-dark text-white font-bold rounded-2xl shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                        {loading ? 'Sorgulanıyor...' : <>Sorgula <ArrowRight size={18} /></>}
                    </button>
                </form>

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center mb-8">
                        <XCircle size={32} className="text-red-400 mx-auto mb-3" />
                        <p className="text-red-700 font-medium">{error}</p>
                    </div>
                )}

                {order && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-6 bg-gray-50 border-b border-gray-100">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-sm text-gray-500">Sipariş No</p>
                                    <p className="text-xl font-bold text-gray-900">#{order.id}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-500">Tutar</p>
                                    <p className="text-xl font-bold text-primary">{Number(order.totalAmount).toFixed(2)} ₺</p>
                                </div>
                            </div>
                            <div className="flex justify-between items-end mt-2">
                                <p className="text-xs text-gray-400">
                                    {new Date(order.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </p>
                                {order.branch && (
                                    <div className="flex items-center gap-1.5 text-sm font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100/50 shadow-sm">
                                        <Store size={16} />
                                        {order.branch.name} Şubesi
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-6">
                            {isCancelled ? (
                                <div className="text-center py-6">
                                    <XCircle size={48} className="text-red-400 mx-auto mb-3" />
                                    <p className="text-lg font-bold text-red-600">Sipariş İptal Edildi</p>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between mb-8">
                                    {STATUS_STEPS.map((step, index) => {
                                        const isCompleted = currentStep >= index;
                                        const isCurrent = currentStep === index;
                                        const Icon = step.icon;
                                        return (
                                            <div key={step.key} className="flex-1 flex flex-col items-center relative">
                                                {index > 0 && (
                                                    <div className={`absolute top-5 -left-1/2 w-full h-0.5 ${currentStep >= index ? 'bg-green-400' : 'bg-gray-200'}`} style={{ zIndex: 0 }} />
                                                )}
                                                <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all ${isCurrent ? 'bg-primary text-white shadow-lg ring-4 ring-brand-100' :
                                                    isCompleted ? 'bg-green-500 text-white' :
                                                        'bg-gray-200 text-gray-400'
                                                    }`}>
                                                    <Icon size={18} />
                                                </div>
                                                <p className={`text-xs mt-2 font-medium text-center ${isCurrent ? 'text-primary' : isCompleted ? 'text-green-600' : 'text-gray-400'}`}>
                                                    {step.label}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {order.status === 'READY' && (
                                <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                                    <p className="font-bold text-green-800">Siparişiniz hazır!</p>
                                    <p className="text-sm text-green-600 mt-1">Mağazamıza gelip teslimat kodunuzu göstererek teslim alabilirsiniz.</p>
                                </div>
                            )}
                        </div>

                        {order.items?.length > 0 && (
                            <div className="p-6 border-t border-gray-100">
                                <h3 className="font-semibold text-gray-900 mb-3">Sipariş İçeriği</h3>
                                <div className="space-y-2">
                                    {order.items.map((item: any, i: number) => (
                                        <div key={i} className="flex items-center justify-between py-2">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                                                    <Package size={16} className="text-gray-400" />
                                                </div>
                                                <span className="text-sm text-gray-700">{item.product?.name || 'Ürün'}</span>
                                            </div>
                                            <span className="text-sm text-gray-500">x{item.quantity}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
