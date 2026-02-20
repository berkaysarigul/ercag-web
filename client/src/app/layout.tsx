import type { Metadata } from "next";
import "./globals.css";
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import CookieConsent from '@/components/ui/CookieConsent';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});


import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import { SettingsProvider } from "@/context/SettingsContext";
import { SocketProvider } from "@/context/SocketContext";
import ClientLayout from "@/components/layout/ClientLayout";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/settings/public`, { next: { revalidate: 3600 } });
    const settings = await res.json();

    return {
      title: {
        template: `%s | ${settings.site_title || 'Erçağ Kırtasiye'}`,
        default: `${settings.site_title || 'Erçağ Kırtasiye'} - Okul, Ofis ve Sanat Malzemeleri`,
      },
      description: settings.site_description || "Erçağ Kırtasiye ile okul, ofis ve sanat malzemeleri ihtiyaçlarınızı hızlı ve güvenilir bir şekilde karşılayın.",
      keywords: ['kırtasiye', 'okul malzemeleri', 'ofis malzemeleri', 'sanat malzemeleri', 'defter', 'kalem'],
    };
  } catch (error) {
    return {
      title: {
        template: '%s | Erçağ Kırtasiye',
        default: 'Erçağ Kırtasiye - Okul, Ofis ve Sanat Malzemeleri',
      },
      description: "Erçağ Kırtasiye ile okul, ofis ve sanat malzemeleri ihtiyaçlarınızı hızlı ve güvenilir bir şekilde karşılayın.",
    };
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={inter.variable}>
      <body className="font-sans antialiased text-gray-900 bg-gray-50">
        <AuthProvider>
          <SettingsProvider>
            <CartProvider>
              <Toaster richColors position="top-right" />
              <CookieConsent />
              <SocketProvider>
                <ClientLayout>
                  {children}
                </ClientLayout>
              </SocketProvider>
            </CartProvider>
          </SettingsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
