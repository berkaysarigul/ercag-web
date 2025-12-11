'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { DollarSign, ShoppingBag, Package, Users, TrendingUp, ArrowUpRight, Clock } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        totalOrders: 0,
        pendingOrders: 0,
        totalProducts: 0,
        totalRevenue: 0
    });
    const [recentOrders, setRecentOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, ordersRes] = await Promise.all([
                    api.get('/orders/stats'),
                    api.get('/orders/all')
                ]);
                setStats(statsRes.data);
                setRecentOrders(ordersRes.data.slice(0, 5)); // Get last 5 orders
            } catch (error) {
                console.error('Failed to fetch dashboard data', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Yükleniyor...</div>;
    }

    const StatCard = ({ title, value, icon: Icon, color, trend }: any) => (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-medium text-gray-500">{title}</p>
                    <h3 className="text-2xl font-bold text-gray-900 mt-2">{value}</h3>
                </div>
                <div className={`p-3 rounded-lg ${color}`}>
                    <Icon size={24} />
                </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
                <span className="text-green-500 flex items-center font-medium">
                    <TrendingUp size={16} className="mr-1" />
                    {trend}
                </span>
                <span className="text-gray-400 ml-2">geçen aya göre</span>
            </div>
        </div>
    );

    return (
        <div className="space-y-8">
            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Toplam Gelir"
                    value={`${Number(stats.totalRevenue).toFixed(2)} ₺`}
                    icon={DollarSign}
                    color="bg-green-100 text-green-600"
                    trend="+12.5%"
                />
                <StatCard
                    title="Toplam Sipariş"
                    value={stats.totalOrders}
                    icon={ShoppingBag}
                    color="bg-blue-100 text-blue-600"
                    trend="+8.2%"
                />
                <StatCard
                    title="Toplam Ürün"
                    value={stats.totalProducts}
                    icon={Package}
                    color="bg-purple-100 text-purple-600"
                    trend="+2.4%"
                />
                <StatCard
                    title="Bekleyen Sipariş"
                    value={stats.pendingOrders}
                    icon={Clock}
                    color="bg-orange-100 text-orange-600"
                    trend="-5.0%"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Chart Section (Mock) */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-gray-800">Haftalık Satış Grafiği</h3>
                        <select className="text-sm border-gray-200 rounded-lg text-gray-500">
                            <option>Son 7 Gün</option>
                            <option>Son 30 Gün</option>
                        </select>
                    </div>
                    <div className="h-64 flex items-end justify-between gap-2 px-4">
                        {[40, 70, 45, 90, 65, 85, 55].map((h, i) => (
                            <div key={i} className="w-full bg-primary/10 rounded-t-lg relative group hover:bg-primary/20 transition-colors" style={{ height: `${h}%` }}>
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                    {h * 10} ₺
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between mt-4 text-xs text-gray-400 px-4">
                        <span>Pzt</span><span>Sal</span><span>Çar</span><span>Per</span><span>Cum</span><span>Cmt</span><span>Paz</span>
                    </div>
                </div>

                {/* Recent Orders Widget */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-gray-800">Son Siparişler</h3>
                        <Link href="/admin/orders" className="text-sm text-primary hover:underline flex items-center">
                            Tümü <ArrowUpRight size={16} className="ml-1" />
                        </Link>
                    </div>
                    <div className="space-y-4">
                        {recentOrders.map((order) => (
                            <div key={order.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm
                                        ${order.status === 'PENDING' ? 'bg-orange-500' :
                                            order.status === 'COMPLETED' ? 'bg-green-500' : 'bg-blue-500'}`}>
                                        {order.user.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">#{order.id} - {order.user.name}</p>
                                        <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString('tr-TR')}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-gray-900">{Number(order.totalAmount).toFixed(2)} ₺</p>
                                    <span className={`text-xs px-2 py-0.5 rounded-full 
                                        ${order.status === 'PENDING' ? 'bg-orange-100 text-orange-700' :
                                            order.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                        {order.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {recentOrders.length === 0 && <p className="text-gray-500 text-center py-4">Sipariş bulunamadı.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}
