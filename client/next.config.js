// @ts-check

/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'http',
                hostname: 'localhost',
                port: '3001',
                pathname: '/uploads/**',
            },
            { protocol: 'https', hostname: 'placehold.co' },
            { protocol: 'https', hostname: 'via.placeholder.com' },
        ],
        // Allow unoptimized images in dev to bypass "resolved to private ip" error
        // In production (Vercel/Railway), images come from a real domain so this doesn't apply
        unoptimized: process.env.NODE_ENV === 'development',
    },
};

module.exports = nextConfig;
