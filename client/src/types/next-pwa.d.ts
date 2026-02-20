// FIX-26: Type declaration for next-pwa (has no official @types package)
declare module 'next-pwa' {
    import { NextConfig } from 'next';
    interface PWAConfig {
        dest: string;
        register?: boolean;
        skipWaiting?: boolean;
        disable?: boolean;
        [key: string]: unknown;
    }
    function withPWA(pwaConfig: PWAConfig): (nextConfig: NextConfig) => NextConfig;
    export default withPWA;
}
