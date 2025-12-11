'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Search, Filter, CheckCircle, Clock, Package, XCircle, AlertCircle, ChevronDown, Phone, User } from 'lucide-react';
import toast from 'react-hot-toast';

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
    user: { name: string; email: string; phone: string };
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
    const [pickupCode, setPickupCode] = useState('');
    const [showVerifyModal, setShowVerifyModal] = useState(false);
    const [verifiedOrder, setVerifiedOrder] = useState<Order | null>(null);

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
                order.user.name.toLowerCase().includes(query) ||
                order.user.phone.includes(query) ||
                (order.pickupCode && order.pickupCode.toLowerCase().includes(query))
            );
        }

        setFilteredOrders(result);
    };

    const handleStatusChange = async (orderId: number, newStatus: string) => {
        try {
            await api.put(`/orders/${orderId}/status`, { status: newStatus });
            toast.success('Sipariş durumu güncellendi');
            // Force reload to ensure fresh data
            fetchOrders();
        } catch (error: any) {
            console.error('Failed to update status', error);
            toast.error('Durum güncellenemedi: ' + (error.response?.data?.error || error.message));
        }
    };

    const verifyCode = async () => {
        if (!pickupCode) return;
        try {
            const res = await api.post('/orders/verify-code', { code: pickupCode });
            setVerifiedOrder(res.data);
            setPickupCode('');
            toast.success('Sipariş bulundu!');
        } catch (error) {
            toast.error('Geçersiz kod veya sipariş bulunamadı.');
            setVerifiedOrder(null);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING': return 'border-l-warning bg-orange-50/50';
            case 'PREPARING': return 'border-l-info bg-blue-50/50';
            case 'READY': return 'border-l-secondary bg-yellow-50/50';
            case 'COMPLETED': return 'border-l-success bg-green-50/50';
            case 'CANCELLED': return 'border-l-danger bg-red-50/50';
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
                <div className="flex gap-2 bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
                    {['ALL', 'PENDING', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === tab
                                ? 'bg-primary text-white shadow-sm'
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

                <button
                    onClick={() => setShowVerifyModal(true)}
                    className="btn btn-secondary shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
                >
                    <Package className="mr-2" size={20} />
                    Teslimat Kodu Doğrula
                </button>
            </div>

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                    type="text"
                    placeholder="Sipariş No, Müşteri Adı, Telefon veya Teslimat Kodu ile ara..."
                    className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Orders List */}
            <div className="grid gap-4">
                {filteredOrders.map((order) => (
                    <div key={order.id} className={`bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all border-l-4 ${getStatusColor(order.status)}`}>
                        <div className="p-6">
                            <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className="text-lg font-bold text-gray-900">#{order.id}</h3>
                                        {getStatusBadge(order.status)}
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-gray-500">
                                        <span className="flex items-center"><Clock size={14} className="mr-1" /> {new Date(order.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                                        <span className="flex items-center"><User size={14} className="mr-1" /> {order.user.name}</span>
                                        <span className="flex items-center"><Phone size={14} className="mr-1" /> {order.user.phone}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-primary">{Number(order.totalAmount).toFixed(2)} ₺</div>
                                    {order.pickupCode && (
                                        <div className="text-sm font-mono bg-gray-100 px-2 py-1 rounded mt-1 inline-block">
                                            Kod: <span className="font-bold tracking-wider">{order.pickupCode}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                <div className="text-sm text-gray-600 space-y-1">
                                    {order.items.slice(0, 3).map((item) => (
                                        <div key={item.id} className="flex justify-between">
                                            <span>{item.quantity}x {item.product.name}</span>
                                            <span className="font-medium">{Number(item.price).toFixed(2)} ₺</span>
                                        </div>
                                    ))}
                                    {order.items.length > 3 && (
                                        <div className="text-xs text-gray-400 pt-1 border-t border-gray-200 mt-1">
                                            + {order.items.length - 3} ürün daha...
                                        </div>
                                    )}
                                </div>
                                {order.couponCode && (
                                    <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between text-sm text-green-600 font-medium">
                                        <span>Kupon ({order.couponCode})</span>
                                        <span>-{Number(order.discountAmount).toFixed(2)} ₺</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-2">
                                {order.status === 'PENDING' && (
                                    <button onClick={() => handleStatusChange(order.id, 'PREPARING')} className="btn bg-blue-100 hover:bg-blue-200 text-blue-800 border-none btn-sm">Hazırla</button>
                                )}
                                {order.status === 'PREPARING' && (
                                    <button onClick={() => handleStatusChange(order.id, 'READY')} className="btn bg-amber-100 hover:bg-amber-200 text-amber-800 border-none btn-sm">Hazır</button>
                                )}
                                {order.status === 'READY' && (
                                    <button onClick={() => handleStatusChange(order.id, 'COMPLETED')} className="btn bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border-none btn-sm">Teslim Et</button>
                                )}
                                {order.status !== 'CANCELLED' && order.status !== 'COMPLETED' && (
                                    <button onClick={() => handleStatusChange(order.id, 'CANCELLED')} className="btn bg-red-100 hover:bg-red-200 text-red-800 border-none btn-sm">İptal</button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
                {filteredOrders.length === 0 && (
                    <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                        <Package className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                        <h3 className="text-lg font-medium text-gray-900">Sipariş Bulunamadı</h3>
                        <p className="text-gray-500">Arama kriterlerinize uygun sipariş yok.</p>
                    </div>
                )}
            </div>

            {/* Verify Modal */}
            {showVerifyModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="text-lg font-bold text-gray-800">Teslimat Kodu Doğrula</h3>
                            <button onClick={() => { setShowVerifyModal(false); setVerifiedOrder(null); setPickupCode(''); }} className="text-gray-400 hover:text-gray-600">
                                <XCircle size={24} />
                            </button>
                        </div>

                        <div className="p-6">
                            {!verifiedOrder ? (
                                <div className="space-y-4">
                                    <p className="text-sm text-gray-500 text-center mb-4">Müşteriden aldığınız 6 haneli teslimat kodunu giriniz.</p>
                                    <input
                                        type="text"
                                        className="w-full text-center text-3xl font-mono tracking-[0.5em] font-bold uppercase border-2 border-gray-200 rounded-xl py-4 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                                        placeholder="______"
                                        maxLength={6}
                                        value={pickupCode}
                                        onChange={(e) => setPickupCode(e.target.value.toUpperCase())}
                                    />
                                    <button
                                        onClick={verifyCode}
                                        disabled={pickupCode.length < 6}
                                        className="btn btn-primary w-full py-4 text-lg shadow-lg disabled:opacity-50 disabled:shadow-none"
                                    >
                                        Siparişi Bul
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="text-center">
                                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <CheckCircle size={32} />
                                        </div>
                                        <h4 className="text-xl font-bold text-gray-900">Sipariş Doğrulandı!</h4>
                                        <p className="text-gray-500">#{verifiedOrder.id}</p>
                                    </div>

                                    <div className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-100">
                                        <div className="flex justify-between border-b border-gray-200 pb-2">
                                            <span className="text-gray-500">Müşteri</span>
                                            <span className="font-medium">{verifiedOrder.user.name}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-gray-200 pb-2">
                                            <span className="text-gray-500">Tutar</span>
                                            <span className="font-bold text-primary">{Number(verifiedOrder.totalAmount).toFixed(2)} ₺</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Durum</span>
                                            {getStatusBadge(verifiedOrder.status)}
                                        </div>
                                    </div>

                                    <button
                                        onClick={async () => {
                                            await handleStatusChange(verifiedOrder.id, 'COMPLETED');
                                            setShowVerifyModal(false);
                                            setVerifiedOrder(null);
                                            setPickupCode('');
                                        }}
                                        className="btn btn-success w-full py-4 text-white text-lg shadow-lg hover:bg-green-600"
                                    >
                                        Teslim Et ve Tamamla
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
