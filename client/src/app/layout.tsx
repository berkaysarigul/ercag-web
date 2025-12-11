import type { Metadata } from "next";
import "./globals.css";
import "./globals.css";
import { Toaster } from 'react-hot-toast';

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

import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import ClientLayout from "@/components/layout/ClientLayout";


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body>
        <AuthProvider>
          <CartProvider>
            <Toaster position="top-right" toastOptions={{
              style: {
                background: '#333',
                color: '#fff',
              },
            }} />
            <ClientLayout>
              {children}
            </ClientLayout>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
