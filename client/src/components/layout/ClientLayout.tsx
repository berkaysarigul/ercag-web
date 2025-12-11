'use client';

import { usePathname } from 'next/navigation';
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAdmin = pathname?.startsWith('/admin');

    return (
        <>
            {!isAdmin && <Header />}
            <main className={!isAdmin ? "flex-grow py-8 min-h-[calc(100vh-160px)]" : ""}>
                {children}
            </main>
            {!isAdmin && <Footer />}
        </>
    );
}
