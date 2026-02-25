/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                // Ana Marka Renkleri (Eco Orman Yeşili)
                brand: {
                    50: '#f2f7f5',
                    100: '#e1efe8',
                    200: '#c5e0d4',
                    300: '#9bc9b6',
                    400: '#6bab92',
                    500: '#478f73',
                    600: '#34725a',
                    700: '#2c5d4b',
                    800: '#264a3d', // Ana eco-green
                    900: '#203d33',
                    DEFAULT: '#264a3d',
                },
                primary: {
                    DEFAULT: '#264a3d',
                    foreground: '#f4f4f0',
                    light: '#478f73',
                },
                // Başarı (Yeşil - Stokta için)
                success: {
                    50: '#f0fdf4',
                    100: '#dcfce7',
                    400: '#4ade80', // UI-07: eklendi
                    500: '#22c55e',
                    600: '#16a34a',
                    700: '#15803d',
                },
                // Uyarı
                warning: {
                    50: '#fffbeb',
                    400: '#fbbf24', // UI-07: eklendi (fill-warning-400 için)
                    500: '#f59e0b',
                    600: '#d97706',
                },
                // Hata
                danger: {
                    50: '#fef2f2',
                    400: '#f87171', // UI-07: eklendi
                    500: '#ef4444',
                    600: '#dc2626',
                    DEFAULT: '#ef4444',
                },
                background: '#F4F4F0', // Eco Bej / Kırık Beyaz
                surface: '#FFFFFF', // Kart vb için beyaz
                text: {
                    main: '#2D3748', // Kömür/Koyu Gri
                    secondary: '#4A5568',
                    light: '#A0AEC0',
                },
                border: '#E2E8F0',
            },
            boxShadow: {
                'soft': '0 2px 8px rgba(0, 0, 0, 0.04)',
                'card': '0 4px 12px rgba(0, 0, 0, 0.08)',
                'hover': '0 12px 24px rgba(0, 0, 0, 0.12)',
                'strong': '0 20px 40px rgba(0, 0, 0, 0.15)',
            },
            animation: {
                'fade-in': 'fadeIn 0.5s ease-in-out',
                'slide-up': 'slideUp 0.4s ease-out',
                'scale-in': 'scaleIn 0.3s ease-out',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                scaleIn: {
                    '0%': { transform: 'scale(0.95)', opacity: '0' },
                    '100%': { transform: 'scale(1)', opacity: '1' },
                }
            },
            fontFamily: {
                sans: ['var(--font-inter)', 'sans-serif'],
                serif: ['var(--font-playfair)', 'serif'],
            },
        },
        container: {
            center: true,
            padding: {
                DEFAULT: '1rem',
                sm: '2rem',
                lg: '4rem',
                xl: '5rem',
                '2xl': '6rem',
            },
            screens: {
                sm: '600px',
                md: '728px',
                lg: '984px',
                xl: '1240px',
                '2xl': '1496px',
            },
        },
    },
    plugins: [
        require('@tailwindcss/typography'),
    ],
}
