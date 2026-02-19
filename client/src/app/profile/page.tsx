'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { User, ShoppingBag, Key, LogOut, Package, Clock, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { ProfileSkeleton } from '@/components/profile/ProfileSkeleton';
import Skeleton from '@/components/ui/Skeleton';

export default function ProfilePage() {
    const { user, logout, loading: authLoading } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('profile');
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);

    // Profile Form State
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/auth');
        }
        if (user) {
            setFormData(prev => ({
                ...prev,
                name: user.name,
                email: user.email,
                phone: user.phone || ''
            }));
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (activeTab === 'orders') {
            fetchOrders();
        }
    }, [activeTab]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res = await api.get('/orders');
            setOrders(res.data);
        } catch (error) {
            console.error('Failed to fetch orders', error);
            toast.error('Sipariş geçmişi yüklenemedi');
        } finally {
            setLoading(false);
        }
    };

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.put('/users/profile', {
                name: formData.name,
                email: formData.email,
                phone: formData.phone
            });
            toast.success('Profil bilgileri güncellendi');
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Güncelleme başarısız');
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.newPassword !== formData.confirmPassword) {
            toast.error('Yeni şifreler eşleşmiyor');
            return;
        }
        setLoading(true);
        try {
            await api.put('/users/profile', {
                currentPassword: formData.currentPassword,
                newPassword: formData.newPassword
            });
            toast.success('Şifre başarıyla değiştirildi');
            setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Şifre değiştirilemedi');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PENDING': return <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700 flex items-center gap-1"><Clock size={12} /> Bekliyor</span>;
            case 'PREPARING': return <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 flex items-center gap-1"><Package size={12} /> Hazırlanıyor</span>;
            case 'READY': return <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700 flex items-center gap-1"><CheckCircle size={12} /> Hazır</span>;
            case 'COMPLETED': return <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 flex items-center gap-1"><CheckCircle size={12} /> Tamamlandı</span>;
            case 'CANCELLED': return <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 flex items-center gap-1"><XCircle size={12} /> İptal</span>;
            default: return null;
        }
    };

    if (authLoading || !user) return <ProfileSkeleton />;

    return (
        <div className="container py-12">
            <h1 className="text-3xl font-bold text-primary mb-8">Hesabım</h1>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* Sidebar */}
                <div className="md:col-span-1">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-6 bg-gray-50 border-b border-gray-200 text-center">
                            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto mb-3">
                                <User size={32} />
                            </div>
                            <h3 className="font-bold text-gray-900">{user.name}</h3>
                            <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                        <nav className="p-2">
                            <button
                                onClick={() => setActiveTab('profile')}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'profile' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                            >
                                <User size={20} /> Profil Bilgileri
                            </button>
                            <button
                                onClick={() => setActiveTab('orders')}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'orders' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                            >
                                <ShoppingBag size={20} /> Siparişlerim
                            </button>
                            <button
                                onClick={() => setActiveTab('password')}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'password' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                            >
                                <Key size={20} /> Şifre Değiştir
                            </button>
                            <button
                                onClick={logout}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors mt-2"
                            >
                                <LogOut size={20} /> Çıkış Yap
                            </button>
                        </nav>
                    </div>
                </div>

                {/* Content */}
                <div className="md:col-span-3">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                        {activeTab === 'profile' && (
                            <form onSubmit={handleProfileUpdate} className="space-y-6 max-w-lg">
                                <h2 className="text-2xl font-bold text-gray-900 mb-6">Profil Bilgileri</h2>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Ad Soyad</label>
                                    <input
                                        type="text"
                                        className="input w-full"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">E-posta</label>
                                    <input
                                        type="email"
                                        className="input w-full bg-gray-50"
                                        value={formData.email}
                                        disabled
                                    />
                                    <p className="text-xs text-gray-500 mt-1">E-posta adresi değiştirilemez.</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Telefon</label>
                                    <input
                                        type="tel"
                                        className="input w-full"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="0555 123 45 67"
                                    />
                                </div>
                                <button type="submit" className="btn btn-primary" disabled={loading}>
                                    {loading ? 'Güncelleniyor...' : 'Bilgileri Güncelle'}
                                </button>
                            </form>
                        )}

                        {activeTab === 'password' && (
                            <form onSubmit={handlePasswordUpdate} className="space-y-6 max-w-lg">
                                <h2 className="text-2xl font-bold text-gray-900 mb-6">Şifre Değiştir</h2>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Mevcut Şifre</label>
                                    <input
                                        type="password"
                                        className="input w-full"
                                        value={formData.currentPassword}
                                        onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Yeni Şifre</label>
                                    <input
                                        type="password"
                                        className="input w-full"
                                        value={formData.newPassword}
                                        onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Yeni Şifre (Tekrar)</label>
                                    <input
                                        type="password"
                                        className="input w-full"
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    />
                                </div>
                                <button type="submit" className="btn btn-primary" disabled={loading}>
                                    {loading ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
                                </button>
                            </form>
                        )}

                        {activeTab === 'orders' && (
                            <div className="space-y-6">
                                <h2 className="text-2xl font-bold text-gray-900 mb-6">Sipariş Geçmişi</h2>
                                {loading ? (
                                    <div className="space-y-4">
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className="border border-gray-200 rounded-xl p-6">
                                                <div className="flex justify-between mb-4">
                                                    <div className="space-y-2">
                                                        <Skeleton className="h-6 w-32" />
                                                        <Skeleton className="h-4 w-48" />
                                                    </div>
                                                    <div className="space-y-2 text-right">
                                                        <Skeleton className="h-6 w-24 ml-auto" />
                                                        <Skeleton className="h-4 w-16 ml-auto" />
                                                    </div>
                                                </div>
                                                <Skeleton className="h-16 w-full rounded-lg" />
                                            </div>
                                        ))}
                                    </div>
                                ) : orders.length === 0 ? (
                                    <p className="text-gray-500">Henüz siparişiniz bulunmuyor.</p>
                                ) : (
                                    <div className="space-y-4">
                                        {orders.map((order: any) => (
                                            <div key={order.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <div className="flex items-center gap-3">
                                                            <h3 className="font-bold text-lg">Sipariş #{order.id}</h3>
                                                            {getStatusBadge(order.status)}
                                                        </div>
                                                        <p className="text-sm text-gray-500 mt-1">
                                                            {new Date(order.createdAt).toLocaleDateString('tr-TR')} - {new Date(order.createdAt).toLocaleTimeString('tr-TR')}
                                                        </p>
                                                        {order.status === 'PENDING' && (
                                                            <button
                                                                onClick={async () => {
                                                                    if (window.confirm('Siparişi iptal etmek istediğinize emin misiniz?')) {
                                                                        try {
                                                                            await api.put(`/orders/${order.id}/cancel`);
                                                                            toast.success('Sipariş iptal edildi');
                                                                            fetchOrders(); // Refresh list
                                                                        } catch (err: any) {
                                                                            toast.error(err.response?.data?.error || 'İptal edilemedi');
                                                                        }
                                                                    }
                                                                }}
                                                                className="text-xs text-red-600 hover:text-red-800 underline mt-2"
                                                            >
                                                                Siparişi İptal Et
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-bold text-primary text-xl">{Number(order.totalAmount).toFixed(2)} ₺</p>
                                                        {order.pickupCode && (
                                                            <div className="text-xs bg-gray-100 px-2 py-1 rounded mt-1 inline-block font-mono">
                                                                Kod: <strong>{order.pickupCode}</strong>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="bg-gray-50 rounded-lg p-4">
                                                    <div className="space-y-2">
                                                        {order.items.map((item: any) => (
                                                            <div key={item.id} className="flex justify-between text-sm">
                                                                <span>{item.quantity}x {item.product.name}</span>
                                                                <span className="font-medium">{Number(item.price).toFixed(2)} ₺</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
