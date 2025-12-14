import type { Metadata } from "next";
import "./globals.css";
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});


import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import ClientLayout from "@/components/layout/ClientLayout";

export const metadata: Metadata = {
  title: {
    template: '%s | Erçağ Kırtasiye',
    default: 'Erçağ Kırtasiye - Okul, Ofis ve Sanat Malzemeleri',
  },
  description: "Erçağ Kırtasiye ile okul, ofis ve sanat malzemeleri ihtiyaçlarınızı hızlı ve güvenilir bir şekilde karşılayın. Geniş ürün yelpazesi ve uygun fiyatlar.",
  keywords: ['kırtasiye', 'okul malzemeleri', 'ofis malzemeleri', 'sanat malzemeleri', 'defter', 'kalem', 'boya'],
  authors: [{ name: 'Erçağ Kırtasiye' }],
  creator: 'Erçağ Kırtasiye',
  publisher: 'Erçağ Kırtasiye',
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={inter.variable}>
      <body className="font-sans antialiased text-gray-900 bg-gray-50">
        <AuthProvider>
          <CartProvider>
            <Toaster richColors position="top-right" />
            <ClientLayout>
              {children}
            </ClientLayout>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
