'use client';

import { usePathname } from 'next/navigation';
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

import MobileBottomNav from "@/components/layout/MobileBottomNav";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAdmin = pathname?.startsWith('/admin');

    return (
        <>
            {!isAdmin && <Header />}
            <main className={!isAdmin ? "flex-grow min-h-[calc(100vh-160px)] pb-24 md:pb-0" : ""}>
                {children}
            </main>
            {!isAdmin && <Footer />}
            {!isAdmin && <MobileBottomNav />}
        </>
    );
}
