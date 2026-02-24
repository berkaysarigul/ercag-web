'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { FileText, Search, User, Shield, AlertTriangle } from 'lucide-react';

export default function AuditLogPage() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filter, setFilter] = useState({ action: '', entityType: '' });

    const fetchLogs = async (p = 1) => {
        setLoading(true);
        try {
            const query = new URLSearchParams({
                page: p.toString(),
                limit: '50',
                ...filter
            }).toString();

            const res = await api.get(`/audit?${query}`);
            setLogs(res.data.logs);
            setTotalPages(res.data.totalPages);
            setPage(p);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFilter({ ...filter, [e.target.name]: e.target.value });
    };

    const applyFilter = (e: React.FormEvent) => {
        e.preventDefault();
        fetchLogs(1);
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Shield size={24} className="text-primary" />
                Sistem Kayıtları (Audit Log)
            </h1>

            {/* Filter */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <form onSubmit={applyFilter} className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <label className="text-sm font-medium text-gray-700 block mb-1">İşlem Ara</label>
                        <div className="relative">
                            <input
                                type="text"
                                name="action"
                                placeholder="Örn: login, update..."
                                value={filter.action}
                                onChange={handleFilterChange}
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                            <Search size={16} className="absolute left-3 top-3 text-gray-400" />
                        </div>
                    </div>
                    <div className="flex-1">
                        <label className="text-sm font-medium text-gray-700 block mb-1">Kayıt Türü</label>
                        <select
                            name="entityType"
                            value={filter.entityType}
                            onChange={handleFilterChange}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                        >
                            <option value="">Tümü</option>
                            <option value="User">Kullanıcı</option>
                            <option value="Product">Ürün</option>
                            <option value="Order">Sipariş</option>
                            <option value="Settings">Ayarlar</option>
                        </select>
                    </div>
                    <div className="flex items-end">
                        <button type="submit" className="btn btn-primary h-10 px-6">Filtrele</button>
                    </div>
                </form>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 font-semibold text-gray-700">Tarih</th>
                                <th className="px-6 py-3 font-semibold text-gray-700">Kullanıcı</th>
                                <th className="px-6 py-3 font-semibold text-gray-700">İşlem</th>
                                <th className="px-6 py-3 font-semibold text-gray-700">Hedef</th>
                                <th className="px-6 py-3 font-semibold text-gray-700">IP Adresi</th>
                                <th className="px-6 py-3 font-semibold text-gray-700">Detaylar</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan={6} className="p-8 text-center">Yükleniyor...</td></tr>
                            ) : logs.length === 0 ? (
                                <tr><td colSpan={6} className="p-8 text-center text-gray-500">Kayıt bulunamadı.</td></tr>
                            ) : logs.map((log: { id: number; createdAt: string; user?: { name?: string; email?: string }; userId?: number; action: string; targetResource: string; ipAddress: string; details: string; entityType?: string; entityId?: number }) => (
                                <tr key={log.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-3 text-gray-500 whitespace-nowrap">
                                        {new Date(log.createdAt).toLocaleString('tr-TR')}
                                    </td>
                                    <td className="px-6 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-600">
                                                {log.user?.name?.[0] || 'U'}
                                            </div>
                                            <div>
                                                <div className="font-medium text-gray-900">{log.user?.name || `User #${log.userId}`}</div>
                                                <div className="text-xs text-gray-500">{log.user?.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 text-gray-600">
                                        {log.entityType} #{log.entityId}
                                    </td>
                                    <td className="px-6 py-3 text-gray-500 font-mono text-xs">
                                        {log.ipAddress}
                                    </td>
                                    <td className="px-6 py-3 text-gray-500 max-w-xs truncate" title={log.details}>
                                        {log.details}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {/* Pagination Controls */}
                <div className="p-4 border-t flex justify-between items-center bg-gray-50">
                    <button
                        disabled={page <= 1}
                        onClick={() => fetchLogs(page - 1)}
                        className="px-4 py-2 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                    >
                        Önceki
                    </button>
                    <span className="text-sm text-gray-600">Sayfa {page} / {totalPages}</span>
                    <button
                        disabled={page >= totalPages}
                        onClick={() => fetchLogs(page + 1)}
                        className="px-4 py-2 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                    >
                        Sonraki
                    </button>
                </div>
            </div>
        </div>
    );
}
