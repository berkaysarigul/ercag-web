'use client';

import { useState } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Search, Package, CheckCircle } from 'lucide-react';
import OrderDetailsModal from '@/components/admin/OrderDetailsModal';

export default function VerifyPickupPage() {
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [order, setOrder] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code || code.length < 6) {
            toast.error('Lütfen geçerli bir kod girin (6 karakter)');
            return;
        }

        setLoading(true);
        try {
            const res = await api.post('/orders/verify-code', { code: code.toUpperCase() });
            setOrder(res.data.order);
            setIsModalOpen(true); // Open the modal immediately with order details
            toast.success('Sipariş bulundu!');
        } catch (error: any) {
            console.error(error);
            setOrder(null);
            toast.error(error.response?.data?.error || 'Kod bulunamadı');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (orderId: number, status: string) => {
        try {
            await api.put(`/orders/${orderId}/status`, { status });
            toast.success('Sipariş durumu güncellendi!');
            setIsModalOpen(false);
            setOrder(null);
            setCode('');
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'İşlem başarısız');
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[60vh]">
            <div className="text-center mb-12">
                <div className="w-20 h-20 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-md">
                    <Package size={40} />
                </div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Teslimat Kodu Doğrulama</h1>
                <p className="text-lg text-gray-500">Müşteriden aldığınız 6 haneli kodu giriniz.</p>
            </div>

            {/* Input Section */}
            <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 w-full max-w-lg relative z-10">
                <form onSubmit={handleVerify} className="relative">
                    <input
                        type="text"
                        placeholder="ABC123"
                        className="w-full text-center text-4xl font-bold tracking-[0.5em] p-6 border-2 border-primary-100 rounded-xl focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-50 uppercase placeholder:text-gray-200 transition-all"
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        maxLength={6}
                        autoFocus
                    />
                    {loading ? (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                            <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <button
                            type="submit"
                            disabled={code.length < 6}
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
                        >
                            <Search size={24} />
                        </button>
                    )}
                </form>
            </div>

            {/* Use the shared OrderDetailsModal */}
            <OrderDetailsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                order={order}
                onStatusChange={handleStatusChange}
            />
        </div>
    );
}
