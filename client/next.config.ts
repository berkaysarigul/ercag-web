import withPWA from 'next-pwa';
import type { NextConfig } from "next";

// FIX-26: PWA aktifleştirildi
// FIX-27: Hardcoded IP'ler kaldırıldı, environment variable tabanlı hostname kullanılıyor
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: (process.env.NODE_ENV === 'production' ? 'https' : 'http') as 'http' | 'https',
        hostname: process.env.NEXT_PUBLIC_API_HOSTNAME || 'localhost',
        port: process.env.NODE_ENV === 'production' ? '' : '3001',
        pathname: '/uploads/**',
      },
      { protocol: 'https', hostname: 'placehold.co' },
      { protocol: 'https', hostname: 'via.placeholder.com' },
    ],
  },
};

export default withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development'
})(nextConfig);
