'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import { Download, TrendingUp, Users, ShoppingCart, DollarSign, AlertCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function AnalyticsPage() {
    const [stats, setStats] = useState<any>(null);
    const [period, setPeriod] = useState('month'); // week, month, year
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            try {
                const res = await api.get(`/orders/stats/detailed?period=${period}`);
                setStats(res.data);
            } catch (error) {
                console.error('Stats error', error);
                toast.error('İstatistikler yüklenemedi');
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [period]);

    const exportPDF = () => {
        if (!stats) return;
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text(`Erçağ Kırtasiye Raporu (${period.toUpperCase()})`, 14, 22);

        doc.setFontSize(12);
        doc.text(`Tarih: ${new Date().toLocaleDateString()}`, 14, 32);

        // KPI Table
        autoTable(doc, {
            startY: 40,
            head: [['Metrik', 'Değer']],
            body: [
                ['Toplam Müşteri', stats.totalCustomers],
                ['Tekrar Eden Müşteri', stats.repeatCustomers],
                ['Ortalama Sepet Tutarı', `${Number(stats.avgOrderAmount).toFixed(2)} ₺`]
            ],
            theme: 'grid'
        });

        // Top Products Table
        autoTable(doc, {
            startY: (doc as any).lastAutoTable.finalY + 10,
            head: [['Ürün Adı', 'Adet', 'Fiyat']],
            body: stats.topProducts.map((p: any) => [
                p.product?.name || 'Bilinmeyen Ürün',
                p._sum.quantity,
                `${Number(p.product?.price).toFixed(2)} ₺`
            ]),
            theme: 'striped'
        });

        doc.save(`rapor-${period}-${new Date().toISOString().split('T')[0]}.pdf`);
    };

    if (loading) return <div className="p-8 text-center">Yükleniyor...</div>;
    if (!stats) return <div className="p-8 text-center text-red-500">Veri yok</div>;

    const kpiCards = [
        { title: 'Ortalama Sepet', value: `${Number(stats.avgOrderAmount).toFixed(2)} ₺`, icon: <DollarSign className="text-green-500" /> },
        { title: 'Toplam Müşteri', value: stats.totalCustomers, icon: <Users className="text-blue-500" /> },
        { title: 'Sadık Müşteri', value: stats.repeatCustomers, icon: <Users className="text-purple-500" /> },
    ];

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">Analitik & Raporlama</h1>
                <div className="flex gap-2">
                    <div className="bg-white rounded-lg border border-gray-200 p-1 flex">
                        {['week', 'month', 'year'].map((p) => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${period === p ? 'bg-primary-100 text-primary-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                            >
                                {p === 'week' ? 'Bu Hafta' : p === 'month' ? 'Bu Ay' : 'Bu Yıl'}
                            </button>
                        ))}
                    </div>
                    <button onClick={exportPDF} className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors">
                        <Download size={18} /> Rapor İndir
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {kpiCards.map((card, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 font-medium">{card.title}</p>
                            <h3 className="text-2xl font-bold text-gray-900 mt-1">{card.value}</h3>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-full">{card.icon}</div>
                    </div>
                ))}
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sales Trend */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-4">Satış Trendi</h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.dailySales}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="date" tickFormatter={(str) => new Date(str).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} />
                                <YAxis />
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <Tooltip labelFormatter={(label) => new Date(label).toLocaleDateString('tr-TR')} />
                                <Area type="monotone" dataKey="revenue" stroke="#8884d8" fillOpacity={1} fill="url(#colorRevenue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Category Sales */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-4">Kategori Dağılımı</h3>
                    <div className="h-64 w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.categorySales}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="totalRevenue"
                                >
                                    {stats.categorySales.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: number) => `${Number(value).toFixed(2)} ₺`} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Top Products Table */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-800 mb-4">En Çok Satan Ürünler</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-500">
                        <thead className="bg-gray-50 text-gray-700 uppercase">
                            <tr>
                                <th className="px-4 py-3">Ürün</th>
                                <th className="px-4 py-3 text-center">Satış Adedi</th>
                                <th className="px-4 py-3 text-right">Fiyat</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {stats.topProducts.map((item: any, idx: number) => (
                                <tr key={idx} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-medium text-gray-900 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded bg-gray-100 flex-shrink-0 overflow-hidden">
                                            {item.product?.image ? (
                                                <img src={`${process.env.NEXT_PUBLIC_API_URL}${item.product.image}`} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="flex items-center justify-center h-full text-xs">IMG</div>
                                            )}
                                        </div>
                                        {item.product?.name || 'Silinmiş Ürün'}
                                    </td>
                                    <td className="px-4 py-3 text-center">{item._sum.quantity}</td>
                                    <td className="px-4 py-3 text-right">{item.product?.price} ₺</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
