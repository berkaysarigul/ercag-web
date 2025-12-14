'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Search, Filter, Clock, Package, User, Phone, Eye } from 'lucide-react';
import { toast } from 'sonner';
import OrderDetailsModal from '@/components/admin/OrderDetailsModal';

interface OrderItem {
    id: number;
    quantity: number;
    price: number;
    product: { name: string };
}

interface Order {
    id: number;
    status: string;
    totalAmount: number;
    createdAt: string;
    completedAt?: string;
    user: { name: string; email: string; phone: string };
    fullName?: string;
    phoneNumber?: string;
    email?: string;
    note?: string;
    items: OrderItem[];
    pickupCode?: string;
    couponCode?: string;
    discountAmount?: number;
}

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
    const [activeTab, setActiveTab] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');

    // Modal State
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        fetchOrders();
    }, []);

    useEffect(() => {
        filterOrders();
    }, [orders, activeTab, searchQuery]);

    const fetchOrders = async () => {
        try {
            const res = await api.get('/orders/all');
            setOrders(res.data);
        } catch (error) {
            console.error('Failed to fetch orders', error);
            toast.error('Siparişler yüklenemedi');
        }
    };

    const filterOrders = () => {
        let result = orders;

        // Tab Filter
        if (activeTab !== 'ALL') {
            result = result.filter(order => order.status === activeTab);
        }

        // Search Filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(order =>
                order.id.toString().includes(query) ||
                (order.user?.name || order.fullName || '').toLowerCase().includes(query) ||
                (order.user?.phone || order.phoneNumber || '').includes(query) ||
                (order.pickupCode?.toLowerCase() || '').includes(query)
            );
        }

        setFilteredOrders(result);
    };

    const handleStatusChange = async (orderId: number, newStatus: string) => {
        try {
            await api.put(`/orders/${orderId}/status`, { status: newStatus });
            toast.success('Sipariş durumu güncellendi');

            // Close modal if open
            setIsModalOpen(false);

            // Refresh Data
            fetchOrders();
        } catch (error: any) {
            console.error('Failed to update status', error);
            toast.error(error.response?.data?.error || 'Durum güncellenemedi');
        }
    };

    const openOrderDetails = (order: Order) => {
        setSelectedOrder(order);
        setIsModalOpen(true);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING': return 'border-l-orange-400 bg-orange-50/30';
            case 'PREPARING': return 'border-l-blue-500 bg-blue-50/30';
            case 'READY': return 'border-l-yellow-400 bg-yellow-50/30';
            case 'COMPLETED': return 'border-l-green-500 bg-green-50/30';
            case 'CANCELLED': return 'border-l-red-500 bg-red-50/30';
            default: return 'border-l-gray-300';
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PENDING': return <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700">Bekliyor</span>;
            case 'PREPARING': return <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">Hazırlanıyor</span>;
            case 'READY': return <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700">Hazır</span>;
            case 'COMPLETED': return <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">Tamamlandı</span>;
            case 'CANCELLED': return <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">İptal</span>;
            default: return null;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header & Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex gap-2 bg-white p-1 rounded-lg border border-gray-200 shadow-sm overflow-x-auto max-w-full">
                    {['ALL', 'PENDING', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab
                                ? 'bg-primary-600 text-white shadow-sm'
                                : 'text-gray-500 hover:bg-gray-100'
                                }`}
                        >
                            {tab === 'ALL' ? 'Tümü' :
                                tab === 'PENDING' ? 'Bekleyen' :
                                    tab === 'PREPARING' ? 'Hazırlanan' :
                                        tab === 'READY' ? 'Hazır' :
                                            tab === 'COMPLETED' ? 'Tamamlanan' : 'İptal'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                    type="text"
                    placeholder="Sipariş No, Müşteri Adı, Telefon veya Teslimat Kodu ile ara..."
                    className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all shadow-sm outline-none"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Orders List */}
            <div className="grid gap-4">
                {filteredOrders.map((order) => (
                    <div key={order.id} className={`bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all border-l-4 ${getStatusColor(order.status)}`}>
                        <div className="p-6">
                            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                                {/* Left: Info */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-lg font-bold text-gray-900">#{order.id}</h3>
                                        {getStatusBadge(order.status)}
                                        {order.pickupCode && (
                                            <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded border border-gray-200 tracking-wider">
                                                {order.pickupCode}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                                        <span className="flex items-center"><Clock size={14} className="mr-1" /> {new Date(order.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                                        <span className="flex items-center"><User size={14} className="mr-1" /> {order.fullName || order.user?.name}</span>
                                        <span className="flex items-center"><Phone size={14} className="mr-1" /> {order.phoneNumber || order.user?.phone}</span>
                                    </div>
                                </div>

                                {/* Right: Total & Action */}
                                <div className="text-right flex flex-col items-end gap-3">
                                    <div className="text-2xl font-bold text-primary-600">{Number(order.totalAmount).toFixed(2)} ₺</div>
                                    <button
                                        onClick={() => openOrderDetails(order)}
                                        className="btn btn-sm bg-gray-900 text-white hover:bg-gray-800 flex items-center gap-2 shadow-sm"
                                    >
                                        <Eye size={16} /> Detay & İşlem
                                    </button>
                                </div>
                            </div>

                            {/* Preview Items (Max 2) */}
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <p className="text-xs text-gray-400 mb-2 uppercase tracking-wider font-semibold">Sipariş Özeti</p>
                                <div className="flex gap-2 overflow-hidden">
                                    {order.items.slice(0, 3).map((item) => (
                                        <span key={item.id} className="inline-flex items-center px-2 py-1 rounded bg-gray-50 text-xs text-gray-600 border border-gray-100 whitespace-nowrap">
                                            <span className="font-bold mr-1">{item.quantity}x</span> {item.product.name}
                                        </span>
                                    ))}
                                    {order.items.length > 3 && (
                                        <span className="inline-flex items-center px-2 py-1 rounded bg-gray-100 text-xs text-gray-500 font-medium">
                                            +{order.items.length - 3} diğer
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {filteredOrders.length === 0 && (
                    <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
                        <Package className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">Sipariş Bulunamadı</h3>
                        <p className="text-gray-500">Arama kriterlerinize uygun sipariş yok.</p>
                    </div>
                )}
            </div>

            <OrderDetailsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                order={selectedOrder}
                onStatusChange={handleStatusChange}
            />
        </div>
    );
}
