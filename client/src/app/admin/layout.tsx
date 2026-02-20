'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';

import { AdminProvider, useAdmin } from '@/context/AdminContext';

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const { sidebarOpen, setSidebarOpen } = useAdmin();

    useEffect(() => {
        if (!loading && (!user || !['SUPER_ADMIN', 'STAFF', 'ADMIN'].includes(user.role))) {
            router.push('/auth');
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!user || !['SUPER_ADMIN', 'STAFF', 'ADMIN'].includes(user.role)) {
        return null; // Or redirect handled by useEffect
    }

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <AdminSidebar />

            {/* Overlay for mobile */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Main Content Area */}
            <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 md:ml-64`}>
                {/* Header */}
                <AdminHeader />

                {/* New Links */}
                <Link href="/admin/campaigns" className="block px-4 py-2 hover:bg-gray-800 rounded">Kampanyalar</Link>
                <Link href="/admin/analytics" className="block px-4 py-2 hover:bg-gray-800 rounded">Analitik & Rapor</Link>
                <Link href="/admin/audit-log" className="block px-4 py-2 hover:bg-gray-800 rounded">Denetim Günlüğü</Link>

                {/* Page Content */}
                <main className="flex-1 p-4 md:p-8 overflow-y-auto w-full">
                    {children}
                </main>
            </div>
        </div>
    );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <AdminProvider>
            <AdminLayoutContent>{children}</AdminLayoutContent>
        </AdminProvider>
    );
}
