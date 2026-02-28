'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import api from '@/lib/api';
import { Search, Clock, Package, User, Phone, Eye, RefreshCw, ChevronLeft, ChevronRight, Copy, Check, ChevronDown, Store } from 'lucide-react';
import { toast } from 'sonner';
import OrderDetailsModal from '@/components/admin/OrderDetailsModal';
import { useSocket } from '@/context/SocketContext';

interface OrderItem {
    id: number;
    quantity: number;
    price: number;
    product: { name: string; image?: string };
}

interface Order {
    id: number;
    status: string;
    totalAmount: number;
    createdAt: string;
    completedAt?: string;
    readyAt?: string;
    user?: { name?: string; email?: string; phone?: string } | null;
    branch?: { name: string } | null;
    fullName?: string;
    phoneNumber?: string;
    email?: string;
    note?: string;
    items: OrderItem[];
    pickupCode?: string;
    couponCode?: string;
    discountAmount?: number;
    campaignDiscount?: number;
    campaignDetails?: string;
    statusHistory?: string;
}

type StatusCounts = Record<string, number>;

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; action?: string; actionColor?: string; nextStatus?: string }> = {
    PENDING: { label: 'Bekleyen', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-l-amber-400', action: 'Hazırla', actionColor: 'bg-blue-600 hover:bg-blue-700', nextStatus: 'PREPARING' },
    PREPARING: { label: 'Hazırlanan', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-l-blue-500', action: 'Hazır', actionColor: 'bg-amber-500 hover:bg-amber-600', nextStatus: 'READY' },
    READY: { label: 'Teslime Hazır', color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-l-purple-500', action: 'Teslim Et', actionColor: 'bg-green-600 hover:bg-green-700', nextStatus: 'COMPLETED' },
    COMPLETED: { label: 'Tamamlanan', color: 'text-green-700', bg: 'bg-green-50', border: 'border-l-green-500' },
    CANCELLED: { label: 'İptal', color: 'text-red-700', bg: 'bg-red-50', border: 'border-l-red-400' },
};

function timeAgo(dateStr: string): { text: string; urgent: boolean } {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return { text: 'az önce', urgent: false };
    if (mins < 60) return { text: `${mins} dk önce`, urgent: mins > 30 };
    const hours = Math.floor(mins / 60);
    if (hours < 24) return { text: `${hours} saat önce`, urgent: hours >= 1 };
    const days = Math.floor(hours / 24);
    return { text: `${days} gün önce`, urgent: true };
}

function CopyableCode({ code }: { code: string }) {
    const [copied, setCopied] = useState(false);
    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };
    return (
        <button onClick={handleCopy} className="inline-flex items-center gap-1 font-mono text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded border border-gray-200 tracking-wider transition-colors" title="Kopyala">
            {code}
            {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} className="text-gray-400" />}
        </button>
    );
}

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [counts, setCounts] = useState<StatusCounts>({});
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [quickLoading, setQuickLoading] = useState<number | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const { socket } = useSocket();
    const searchTimer = useRef<NodeJS.Timeout | null>(null);

    // ── Debounced Search ──
    useEffect(() => {
        if (searchTimer.current) clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setPagination(prev => ({ ...prev, page: 1 }));
        }, 400);
        return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
    }, [searchQuery]);

    // ── Fetch Orders (Server-Side Filtering) ──
    const fetchOrders = useCallback(async (page?: number) => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.set('page', String(page || pagination.page));
            params.set('limit', '20');
            if (activeTab !== 'ALL') params.set('status', activeTab);
            if (debouncedSearch) params.set('search', debouncedSearch);

            const res = await api.get(`/orders/all?${params}`);
            if (res.data.orders) {
                setOrders(res.data.orders);
                setPagination(prev => ({ ...prev, totalPages: res.data.totalPages, total: res.data.total }));
            }
        } catch { toast.error('Siparişler yüklenemedi'); }
        finally { setLoading(false); }
    }, [activeTab, debouncedSearch, pagination.page]);

    // ── Fetch Counts ──
    const fetchCounts = useCallback(async () => {
        try {
            const res = await api.get('/orders/counts');
            setCounts(res.data);
        } catch { /* silent */ }
    }, []);

    useEffect(() => { fetchOrders(); fetchCounts(); }, [activeTab, debouncedSearch, pagination.page]);

    // ── Socket.io Real-Time ──
    useEffect(() => {
        if (!socket) return;
        const refresh = () => { fetchOrders(); fetchCounts(); };
        socket.on('new-order', refresh);
        socket.on('order-updated', refresh);
        return () => { socket.off('new-order'); socket.off('order-updated'); };
    }, [socket, fetchOrders, fetchCounts]);

    // ── Status Change (from both card and modal) ──
    const handleStatusChange = async (orderId: number, newStatus: string) => {
        try {
            await api.put(`/orders/${orderId}/status`, { status: newStatus });
            toast.success('Sipariş durumu güncellendi');
            setIsModalOpen(false);
            fetchOrders();
            fetchCounts();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Durum güncellenemedi');
        }
    };

    // ── Quick Status Change (card button) ──
    const handleQuickAction = async (e: React.MouseEvent, order: Order) => {
        e.stopPropagation();
        const config = STATUS_CONFIG[order.status];
        if (!config?.nextStatus) return;

        // COMPLETED ve CANCELLED için onay iste
        if (config.nextStatus === 'COMPLETED') {
            if (!window.confirm('Siparişi TAMAMLANDI olarak işaretlemek istiyor musunuz?')) return;
        }

        setQuickLoading(order.id);
        await handleStatusChange(order.id, config.nextStatus);
        setQuickLoading(null);
    };

    // ── Manual Refresh ──
    const handleRefresh = async () => {
        setRefreshing(true);
        await Promise.all([fetchOrders(), fetchCounts()]);
        setRefreshing(false);
        toast.success('Güncellendi');
    };

    // ── Tab Change ──
    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const tabs = [
        { key: 'ALL', label: 'Tümü' },
        { key: 'PENDING', label: 'Bekleyen' },
        { key: 'PREPARING', label: 'Hazırlanan' },
        { key: 'READY', label: 'Hazır' },
        { key: 'COMPLETED', label: 'Tamamlanan' },
        { key: 'CANCELLED', label: 'İptal' },
    ];

    return (
        <div className="space-y-5">

            {/* ═══ Header ═══ */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-800">Sipariş Yönetimi</h1>
                <button onClick={handleRefresh} disabled={refreshing}
                    className="p-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors text-gray-500 hover:text-gray-700 disabled:opacity-50">
                    <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* ═══ Tab'lar (Sayaçlı) ═══ */}
            <div className="flex gap-1.5 bg-white p-1.5 rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
                {tabs.map(tab => {
                    const count = counts[tab.key] || 0;
                    const isActive = activeTab === tab.key;
                    const isUrgent = (tab.key === 'PENDING' || tab.key === 'READY') && count > 0;
                    return (
                        <button key={tab.key} onClick={() => handleTabChange(tab.key)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 ${isActive
                                ? 'bg-primary text-white shadow-sm'
                                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                                }`}>
                            {tab.label}
                            {count > 0 && (
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center ${isActive
                                    ? 'bg-white/25 text-white'
                                    : isUrgent
                                        ? 'bg-red-100 text-red-700 animate-pulse'
                                        : 'bg-gray-100 text-gray-600'
                                    }`}>
                                    {count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* ═══ Arama ═══ */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                    type="text"
                    placeholder="Sipariş no, müşteri adı, telefon veya teslimat kodu..."
                    className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm outline-none text-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs px-2 py-1 bg-gray-100 rounded-md">
                        Temizle
                    </button>
                )}
            </div>

            {/* ═══ Sipariş Kartları ═══ */}
            <div className="space-y-3">
                {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 animate-pulse">
                            <div className="flex justify-between">
                                <div className="space-y-2">
                                    <div className="h-5 w-32 bg-gray-200 rounded" />
                                    <div className="h-4 w-48 bg-gray-100 rounded" />
                                </div>
                                <div className="h-8 w-24 bg-gray-200 rounded" />
                            </div>
                        </div>
                    ))
                ) : orders.length > 0 ? orders.map(order => {
                    const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
                    const elapsed = timeAgo(order.createdAt);
                    const isActive = ['PENDING', 'PREPARING', 'READY'].includes(order.status);
                    const isQuickLoading = quickLoading === order.id;

                    return (
                        <div key={order.id}
                            onClick={() => { setSelectedOrder(order); setIsModalOpen(true); }}
                            className={`bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all border-l-4 cursor-pointer group ${config.border}`}>
                            <div className="p-5">
                                <div className="flex flex-col md:flex-row justify-between items-start gap-3">
                                    {/* Sol: Bilgiler */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                                            <h3 className="text-lg font-bold text-gray-900">#{order.id}</h3>
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${config.bg} ${config.color}`}>
                                                {config.label}
                                            </span>
                                            {order.pickupCode && <CopyableCode code={order.pickupCode} />}

                                            {/* Bekleme süresi — sadece aktif siparişlerde */}
                                            {isActive && (
                                                <span className={`flex items-center gap-1 text-xs ${elapsed.urgent ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
                                                    <Clock size={12} />
                                                    {elapsed.text}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <User size={13} />
                                                {order.fullName || order.user?.name || 'Misafir'}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Phone size={13} />
                                                {order.phoneNumber || order.user?.phone}
                                            </span>
                                            {order.branch && (
                                                <span className="flex items-center gap-1 font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                                                    <Store size={12} />
                                                    {order.branch.name}
                                                </span>
                                            )}
                                            {order.note && (
                                                <span className="text-amber-600 text-xs italic truncate max-w-[200px]" title={order.note}>
                                                    📝 {order.note}
                                                </span>
                                            )}
                                        </div>

                                        {/* Sipariş Özeti */}
                                        <div className="mt-3 flex gap-1.5 overflow-hidden flex-wrap">
                                            {order.items.slice(0, 3).map(item => (
                                                <span key={item.id} className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-50 text-xs text-gray-600 border border-gray-100 whitespace-nowrap">
                                                    <span className="font-bold mr-1">{item.quantity}x</span> {item.product.name}
                                                </span>
                                            ))}
                                            {order.items.length > 3 && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 text-xs text-gray-500 font-medium">
                                                    +{order.items.length - 3}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Sağ: Tutar + Aksiyon */}
                                    <div className="flex flex-row md:flex-col items-center md:items-end gap-3 shrink-0">
                                        <div className="text-xl font-bold text-gray-900">{Number(order.totalAmount).toFixed(2)} ₺</div>

                                        <div className="flex gap-2">
                                            {/* Hızlı Aksiyon Butonu */}
                                            {config.action && config.nextStatus && (
                                                <button
                                                    onClick={(e) => handleQuickAction(e, order)}
                                                    disabled={isQuickLoading}
                                                    className={`px-4 py-2 text-white text-sm font-bold rounded-lg shadow-sm transition-all ${config.actionColor} disabled:opacity-50`}
                                                >
                                                    {isQuickLoading ? '...' : config.action}
                                                </button>
                                            )}

                                            {/* Detay Butonu */}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); setIsModalOpen(true); }}
                                                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                                title="Detay"
                                            >
                                                <Eye size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                }) : (
                    <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
                        <Package className="mx-auto h-14 w-14 text-gray-300 mb-3" />
                        <h3 className="text-lg font-medium text-gray-900">Sipariş Bulunamadı</h3>
                        <p className="text-sm text-gray-500 mt-1">
                            {debouncedSearch ? 'Arama kriterlerinize uygun sipariş yok.' : 'Bu durumda sipariş bulunmuyor.'}
                        </p>
                    </div>
                )}
            </div>

            {/* ═══ Pagination ═══ */}
            {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                    <p className="text-sm text-gray-500">
                        {pagination.total} sipariş · Sayfa {pagination.page}/{pagination.totalPages}
                    </p>
                    <div className="flex gap-1">
                        <button onClick={() => setPagination(p => ({ ...p, page: Math.max(1, p.page - 1) }))}
                            disabled={pagination.page <= 1}
                            className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
                            <ChevronLeft size={18} />
                        </button>
                        {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                            const startPage = Math.max(1, Math.min(pagination.page - 2, pagination.totalPages - 4));
                            const pageNum = startPage + i;
                            return (
                                <button key={pageNum} onClick={() => setPagination(p => ({ ...p, page: pageNum }))}
                                    className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${pageNum === pagination.page ? 'bg-primary text-white' : 'border border-gray-200 bg-white hover:bg-gray-50 text-gray-700'}`}>
                                    {pageNum}
                                </button>
                            );
                        })}
                        <button onClick={() => setPagination(p => ({ ...p, page: Math.min(p.totalPages, p.page + 1) }))}
                            disabled={pagination.page >= pagination.totalPages}
                            className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            )}

            {/* ═══ Modal ═══ */}
            {selectedOrder && (
                <OrderDetailsModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    // @ts-ignore
                    order={selectedOrder}
                    onStatusChange={handleStatusChange}
                />
            )}
        </div>
    );
}
