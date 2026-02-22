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
    },
};

module.exports = nextConfig;
