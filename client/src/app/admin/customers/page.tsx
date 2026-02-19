'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Search, User, ShoppingBag, Calendar, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

import UserRoleModal from '@/components/admin/UserRoleModal';

interface Order {
    id: number;
    totalAmount: number;
    status: string;
    createdAt: string;
    items: { product: { name: string; }; quantity: number; }[];
}

interface UserData {
    id: number;
    name: string;
    email: string | null;
    phone: string;
    role: string;
    createdAt: string;
    _count: {
        orders: number;
    };
}

export default function AdminCustomersPage() {
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
    const [userOrders, setUserOrders] = useState<Order[]>([]);
    const [ordersLoading, setOrdersLoading] = useState(false);
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);

    const [pagination, setPagination] = useState({
        page: 1,
        totalPages: 1,
        total: 0
    });

    useEffect(() => {
        fetchUsers(search, pagination.page);
    }, [pagination.page]); // Depend on page

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setPagination(prev => ({ ...prev, page: 1 })); // Reset page on search
            fetchUsers(search, 1);
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    const fetchUsers = async (searchTerm = '', page = 1) => {
        try {
            const res = await api.get(`/users?search=${searchTerm}&page=${page}&limit=20`);
            if (res.data.users) {
                setUsers(res.data.users);
                setPagination(prev => ({
                    ...prev,
                    totalPages: res.data.totalPages,
                    total: res.data.total,
                    page: res.data.page // Ensure sync
                }));
            } else if (Array.isArray(res.data)) {
                setUsers(res.data);
            } else {
                console.error('API response format error:', res.data);
                setUsers([]);
                toast.error('Beklenmeyen veri formatı');
            }
            setLoading(false);
        } catch (error) {
            console.error(error);
            toast.error('Kullanıcılar yüklenemedi');
            setLoading(false);
        }
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            setPagination(prev => ({ ...prev, page: newPage }));
        }
    };

    const handleRoleUpdate = async (newRole: string) => {
        if (!selectedUser) return;

        try {
            await api.put(`/users/${selectedUser.id}/role`, { role: newRole });
            toast.success('Kullanıcı rolü güncellendi');
            fetchUsers(search); // Refresh list
        } catch (error) {
            console.error('Role update error:', error);
            toast.error('Rol güncellenemedi');
            throw error;
        }
    };

    const openRoleModal = (user: UserData) => {
        setSelectedUser(user);
        setIsRoleModalOpen(true);
    };

    const handleViewOrders = async (user: UserData) => {
        setSelectedUser(user);
        setOrdersLoading(true);
        try {
            const res = await api.get(`/users/${user.id}/orders`);
            setUserOrders(res.data);
        } catch (error) {
            toast.error('Sipariş geçmişi yüklenemedi');
        } finally {
            setOrdersLoading(false);
        }
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Kullanıcı Yönetimi</h1>
                    <p className="text-gray-500">Müşterileri ve personeli yönetin.</p>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="İsim, Telefon veya E-posta ile ara..."
                        className="pl-10 input w-full"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-gray-700">Müşteri</th>
                                <th className="px-6 py-4 font-semibold text-gray-700">İletişim</th>
                                <th className="px-6 py-4 font-semibold text-gray-700">Rol</th>
                                <th className="px-6 py-4 font-semibold text-gray-700">Kayıt Tarihi</th>
                                <th className="px-6 py-4 font-semibold text-gray-700">Siparişler</th>
                                <th className="px-6 py-4 font-semibold text-gray-700 text-right">İşlem</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="font-medium text-gray-900">{user.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col text-sm">
                                            <span className="text-gray-900">{user.phone}</span>
                                            {user.email && <span className="text-gray-500">{user.email}</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${user.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-700' :
                                            user.role === 'ADMIN' ? 'bg-blue-100 text-blue-700' :
                                                user.role === 'STAFF' ? 'bg-orange-100 text-orange-700' :
                                                    'bg-gray-100 text-gray-600'
                                            }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {new Date(user.createdAt).toLocaleDateString('tr-TR')}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold">
                                            {user._count.orders} Sipariş
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                                        <button
                                            onClick={() => openRoleModal(user)}
                                            className="text-gray-400 hover:text-purple-600 transition-colors"
                                            title="Rolü Düzenle"
                                        >
                                            <User size={20} />
                                        </button>
                                        <button
                                            onClick={() => handleViewOrders(user)}
                                            className="text-gray-400 hover:text-primary transition-colors"
                                            title="Sipariş Geçmişi"
                                        >
                                            <Eye size={20} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        Kullanıcı bulunamadı.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-4">
                    <button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                        className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed bg-white"
                    >
                        Önceki
                    </button>
                    <span className="text-gray-600">
                        Sayfa {pagination.page} / {pagination.totalPages}
                    </span>
                    <button
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.totalPages}
                        className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed bg-white"
                    >
                        Sonraki
                    </button>
                </div>
            )}


            {/* Order History Modal */}
            {selectedUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden animate-in zoom-in-95 flex flex-col">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <ShoppingBag className="text-primary" />
                                {selectedUser.name} - Sipariş Geçmişi
                            </h2>
                            <button onClick={() => setSelectedUser(null)} className="text-gray-400 hover:text-gray-600">
                                <span className="text-2xl">&times;</span>
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {ordersLoading ? (
                                <div className="flex justify-center py-8"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
                            ) : userOrders.length > 0 ? (
                                userOrders.map(order => (
                                    <div key={order.id} className="border border-gray-200 rounded-xl p-4 hover:border-primary/30 transition-colors">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <div className="font-bold text-gray-900">Sipariş #{order.id}</div>
                                                <div className="text-xs text-gray-500 flex items-center gap-1">
                                                    <Calendar size={12} />
                                                    {new Date(order.createdAt).toLocaleDateString('tr-TR')} {new Date(order.createdAt).toLocaleTimeString('tr-TR')}
                                                </div>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${order.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                                order.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                                                    'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {order.status === 'COMPLETED' ? 'Tamamlandı' :
                                                    order.status === 'PENDING' ? 'Bekliyor' :
                                                        order.status === 'PREPARING' ? 'Hazırlanıyor' :
                                                            order.status === 'READY' ? 'Hazır' : order.status}
                                            </span>
                                        </div>
                                        <div className="space-y-1 mb-3 bg-gray-50 p-3 rounded-lg text-sm">
                                            {order.items.map((item, idx) => (
                                                <div key={idx} className="flex justify-between text-gray-700">
                                                    <span>{item.quantity}x {item.product?.name || 'Ürün'}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="text-right font-bold text-primary">
                                            Toplam: {Number(order.totalAmount).toFixed(2)} ₺
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    Henüz sipariş bulunmuyor.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {isRoleModalOpen && selectedUser && (
                <UserRoleModal
                    isOpen={isRoleModalOpen}
                    onClose={() => setIsRoleModalOpen(false)}
                    currentRole={selectedUser.role}
                    userName={selectedUser.name}
                    onSave={handleRoleUpdate}
                />
            )}
        </div>
    );
}
