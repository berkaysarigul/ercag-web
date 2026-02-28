'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import {
    TrendingUp, TrendingDown, DollarSign, ShoppingBag, Package, Users,
    Clock, AlertTriangle, ArrowUpRight, Timer, CheckCircle,
    ChevronRight, Zap, BarChart3
} from 'lucide-react';
import Link from 'next/link';
import { useSocket } from '@/context/SocketContext';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';

// ═══ Renk Paleti ═══
const COLORS = {
    primary: '#264a3d',
    primaryLight: '#3a7d65',
    green: '#22c55e',
    orange: '#f59e0b',
    red: '#ef4444',
    blue: '#3b82f6',
    purple: '#8b5cf6',
    gray: '#6b7280',
};

const STATUS_COLORS: Record<string, string> = {
    PENDING: '#f59e0b',
    PREPARING: '#3b82f6',
    READY: '#8b5cf6',
    COMPLETED: '#22c55e',
    CANCELLED: '#ef4444',
};

const STATUS_LABELS: Record<string, string> = {
    PENDING: 'Bekliyor',
    PREPARING: 'Hazırlanıyor',
    READY: 'Teslime Hazır',
    COMPLETED: 'Tamamlandı',
    CANCELLED: 'İptal',
};

interface DashboardData {
    totalRevenue: number;
    revenueTrend: number;
    totalOrders: number;
    thisMonthOrders: number;
    orderTrend: number;
    totalProducts: number;
    totalCustomers: number;
    avgOrderAmount: number;
    pendingOrders: number;
    preparingOrders: number;
    readyOrders: number;
    actionRequired: number;
    avgPrepMinutes: number;
    pickupRate: number;
    chartData: { day: string; revenue: number; orders: number }[];
    statusDistribution: { status: string; count: number }[];
    lowStockProducts: { id: number; name: string; stock: number; lowStockThreshold: number; sku: string | null; image: string | null }[];
    lowStockCount: number;
    topProducts: { productId: number; totalSold: number; product: { id: number; name: string; price: number; image: string | null; stock: number } | null }[];
    todayOrders: number;
    todayRevenue: number;
}

export default function AdminDashboard() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [recentOrders, setRecentOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { socket } = useSocket();

    const fetchData = async () => {
        try {
            const [statsRes, ordersRes] = await Promise.all([
                api.get('/orders/stats'),
                api.get('/orders/all?limit=5'),
            ]);
            setData(statsRes.data);
            const arr = Array.isArray(ordersRes.data) ? ordersRes.data : (ordersRes.data.orders ?? []);
            setRecentOrders(arr.slice(0, 5));
        } catch (error) {
            console.error('Dashboard fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    useEffect(() => {
        if (!socket) return;
        socket.on('new-order', () => fetchData());
        socket.on('order-updated', () => fetchData());
        return () => { socket.off('new-order'); socket.off('order-updated'); };
    }, [socket]);

    if (loading || !data) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-white rounded-2xl" />)}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 h-80 bg-white rounded-2xl" />
                    <div className="h-80 bg-white rounded-2xl" />
                </div>
            </div>
        );
    }

    const maxSold = data.topProducts.length > 0 ? data.topProducts[0].totalSold : 1;

    return (
        <div className="space-y-6">

            {/* ═══ ROW 1: Acil İşlem Bandı ═══ */}
            {data.actionRequired > 0 && (
                <Link href="/admin/orders" className="block">
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-center justify-between hover:shadow-md transition-shadow group">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-100 rounded-xl">
                                <Zap size={20} className="text-amber-600" />
                            </div>
                            <div>
                                <p className="font-bold text-amber-900">
                                    {data.pendingOrders > 0 && <span>{data.pendingOrders} bekleyen</span>}
                                    {data.preparingOrders > 0 && <span>{data.pendingOrders > 0 ? ', ' : ''}{data.preparingOrders} hazırlanan</span>}
                                    {data.readyOrders > 0 && <span>{(data.pendingOrders + data.preparingOrders) > 0 ? ', ' : ''}{data.readyOrders} teslime hazır</span>}
                                    <span> sipariş var</span>
                                </p>
                                <p className="text-xs text-amber-700 mt-0.5">Sipariş yönetimine git →</p>
                            </div>
                        </div>
                        <ChevronRight size={20} className="text-amber-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                </Link>
            )}

            {/* ═══ ROW 2: KPI Kartları ═══ */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Bugünün Geliri */}
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Bugün</span>
                        <div className="p-2 bg-emerald-50 rounded-xl"><DollarSign size={16} className="text-emerald-600" /></div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{data.todayRevenue.toFixed(0)} ₺</p>
                    <p className="text-xs text-gray-400 mt-1">{data.todayOrders} sipariş</p>
                </div>

                {/* Bu Ay Gelir */}
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Bu Ay Gelir</span>
                        <div className="p-2 bg-green-50 rounded-xl"><BarChart3 size={16} className="text-green-600" /></div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{data.totalRevenue.toFixed(0)} ₺</p>
                    <div className="flex items-center gap-1 mt-1">
                        {data.revenueTrend >= 0 ? (
                            <TrendingUp size={14} className="text-emerald-500" />
                        ) : (
                            <TrendingDown size={14} className="text-red-500" />
                        )}
                        <span className={`text-xs font-bold ${data.revenueTrend >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            %{Math.abs(data.revenueTrend)}
                        </span>
                        <span className="text-xs text-gray-400">geçen aya göre</span>
                    </div>
                </div>

                {/* Ort. Sepet */}
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Ort. Sepet</span>
                        <div className="p-2 bg-blue-50 rounded-xl"><ShoppingBag size={16} className="text-blue-600" /></div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{data.avgOrderAmount.toFixed(0)} ₺</p>
                    <p className="text-xs text-gray-400 mt-1">{data.totalOrders} toplam sipariş</p>
                </div>

                {/* Ort. Hazırlık Süresi */}
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Ort. Hazırlık</span>
                        <div className="p-2 bg-purple-50 rounded-xl"><Timer size={16} className="text-purple-600" /></div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                        {data.avgPrepMinutes > 60 ? `${Math.floor(data.avgPrepMinutes / 60)}s ${data.avgPrepMinutes % 60}dk` : `${data.avgPrepMinutes} dk`}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                        <CheckCircle size={14} className="text-emerald-500" />
                        <span className="text-xs text-gray-400">%{data.pickupRate} teslim alım</span>
                    </div>
                </div>
            </div>

            {/* ═══ ROW 3: Grafik + Durum Dağılımı ═══ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Haftalık Gelir Grafiği */}
                <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                        <h3 className="font-bold text-gray-800">Son 7 Gün</h3>
                        <div className="flex items-center gap-4 text-xs text-gray-400">
                            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-emerald-400 rounded-full" /> Gelir</span>
                        </div>
                    </div>
                    <p className="text-xs text-gray-400 mb-4">Günlük gelir ve sipariş sayısı</p>
                    <ResponsiveContainer width="100%" height={240}>
                        <AreaChart data={data.chartData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                            <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.15} />
                                    <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={8} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v) => `${v}₺`} />
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: '13px' }}
                                formatter={(value: number | undefined, name: string | undefined) => {
                                    if (value === undefined) return ['', ''];
                                    return [
                                        name === 'revenue' ? `${value.toFixed(2)} ₺` : `${value} sipariş`,
                                        name === 'revenue' ? 'Gelir' : 'Sipariş'
                                    ] as [string, string];
                                }}
                                labelStyle={{ fontWeight: 700, marginBottom: 4 }}
                            />
                            <Area type="monotone" dataKey="revenue" stroke={COLORS.primary} strokeWidth={2.5} fill="url(#colorRevenue)" dot={{ r: 4, fill: COLORS.primary, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, stroke: COLORS.primary, strokeWidth: 2, fill: '#fff' }} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Sipariş Durum Dağılımı */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <h3 className="font-bold text-gray-800 mb-4">Sipariş Durumları</h3>
                    {data.statusDistribution.length > 0 ? (
                        <>
                            <ResponsiveContainer width="100%" height={160}>
                                <PieChart>
                                    <Pie
                                        data={data.statusDistribution.map(s => ({ name: STATUS_LABELS[s.status] || s.status, value: s.count }))}
                                        cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                                        paddingAngle={3} dataKey="value" strokeWidth={0}
                                    >
                                        {data.statusDistribution.map((s, i) => (
                                            <Cell key={i} fill={STATUS_COLORS[s.status] || COLORS.gray} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                                        formatter={(value: number | undefined) => [value !== undefined ? `${value} sipariş` : ''] as [string]}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="space-y-2 mt-2">
                                {data.statusDistribution.map((s) => (
                                    <div key={s.status} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[s.status] }} />
                                            <span className="text-xs text-gray-600">{STATUS_LABELS[s.status] || s.status}</span>
                                        </div>
                                        <span className="text-xs font-bold text-gray-700">{s.count}</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="h-40 flex items-center justify-center text-gray-400 text-sm">Henüz sipariş yok</div>
                    )}
                </div>
            </div>

            {/* ═══ ROW 4: En Çok Satanlar + Düşük Stok + Son Siparişler ═══ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* En Çok Satan Ürünler */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-gray-800">En Çok Satanlar</h3>
                        <span className="text-xs text-gray-400">Son 30 gün</span>
                    </div>
                    {data.topProducts.length > 0 ? (
                        <div className="space-y-3">
                            {data.topProducts.map((tp, i) => (
                                <div key={tp.productId} className="flex items-center gap-3">
                                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-gray-100 text-gray-600' : 'bg-orange-50 text-orange-600'}`}>
                                        {i + 1}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-800 truncate">{tp.product?.name || 'Silinmiş Ürün'}</p>
                                        <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all" style={{ width: `${(tp.totalSold / maxSold) * 100}%` }} />
                                        </div>
                                    </div>
                                    <span className="text-sm font-bold text-gray-700 shrink-0">{tp.totalSold}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-8 text-center text-gray-400 text-sm">Henüz satış verisi yok</div>
                    )}
                </div>

                {/* Düşük Stok Uyarıları */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-gray-800">Düşük Stok</h3>
                            {data.lowStockCount > 0 && (
                                <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-bold">{data.lowStockCount}</span>
                            )}
                        </div>
                        <Link href="/admin/stock" className="text-xs text-primary hover:underline">Tümü →</Link>
                    </div>
                    {data.lowStockProducts.length > 0 ? (
                        <div className="space-y-2">
                            {data.lowStockProducts.slice(0, 5).map(p => (
                                <Link key={p.id} href={`/admin/products/${p.id}`} className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-red-50/50 transition-colors group">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <AlertTriangle size={14} className={`shrink-0 ${p.stock === 0 ? 'text-red-500' : 'text-amber-500'}`} />
                                        <span className="text-sm text-gray-700 truncate group-hover:text-gray-900">{p.name}</span>
                                    </div>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${p.stock === 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {p.stock === 0 ? 'Tükendi' : `${p.stock} kaldı`}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="py-8 text-center">
                            <CheckCircle size={32} className="text-emerald-300 mx-auto mb-2" />
                            <p className="text-sm text-gray-400">Tüm stoklar yeterli</p>
                        </div>
                    )}
                </div>

                {/* Son Siparişler */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-gray-800">Son Siparişler</h3>
                        <Link href="/admin/orders" className="text-xs text-primary hover:underline flex items-center gap-0.5">
                            Tümü <ArrowUpRight size={12} />
                        </Link>
                    </div>
                    {recentOrders.length > 0 ? (
                        <div className="space-y-1">
                            {recentOrders.map(order => (
                                <div key={order.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0`}
                                            style={{ backgroundColor: STATUS_COLORS[order.status] || COLORS.gray }}>
                                            {(order.user?.name || order.fullName || 'M').charAt(0)}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-gray-800 truncate">
                                                #{order.id} · {order.user?.name || order.fullName || 'Misafir'}
                                            </p>
                                            <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0 ml-2">
                                        <p className="text-sm font-bold text-gray-800">{Number(order.totalAmount).toFixed(0)} ₺</p>
                                        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: STATUS_COLORS[order.status] }}>
                                            {STATUS_LABELS[order.status] || order.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-8 text-center text-gray-400 text-sm">Sipariş bulunamadı</div>
                    )}
                </div>
            </div>

            {/* ═══ ROW 5: Alt Bilgi Kartları ═══ */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 text-center">
                    <Package size={20} className="text-gray-400 mx-auto mb-1" />
                    <p className="text-lg font-bold text-gray-800">{data.totalProducts}</p>
                    <p className="text-xs text-gray-400">Toplam Ürün</p>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 text-center">
                    <Users size={20} className="text-gray-400 mx-auto mb-1" />
                    <p className="text-lg font-bold text-gray-800">{data.totalCustomers}</p>
                    <p className="text-xs text-gray-400">Kayıtlı Müşteri</p>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 text-center">
                    <ShoppingBag size={20} className="text-gray-400 mx-auto mb-1" />
                    <p className="text-lg font-bold text-gray-800">{data.thisMonthOrders}</p>
                    <p className="text-xs text-gray-400">Bu Ay Sipariş</p>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 text-center">
                    <CheckCircle size={20} className="text-gray-400 mx-auto mb-1" />
                    <p className="text-lg font-bold text-gray-800">%{data.pickupRate}</p>
                    <p className="text-xs text-gray-400">Teslim Alım Oranı</p>
                </div>
            </div>
        </div>
    );
}
