/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                // Ana Marka Renkleri
                brand: {
                    50: '#eff6ff',
                    100: '#dbeafe',
                    200: '#bfdbfe',
                    300: '#93c5fd',
                    400: '#60a5fa',
                    500: '#3b82f6',  // Ana mavi
                    600: '#2563eb',  // Primary
                    700: '#1d4ed8',
                    800: '#1e40af',
                    900: '#1e3a8a',
                    DEFAULT: '#2563eb', // Default to brand-600
                },
                primary: { // Keep existing primary mapping for backward compatibility but map to new brand
                    DEFAULT: '#2563eb',
                    foreground: '#ffffff',
                },
                // Başarı (Yeşil - Stokta için)
                success: {
                    50: '#f0fdf4',
                    100: '#dcfce7',
                    500: '#22c55e',
                    600: '#16a34a',
                    700: '#15803d',
                },
                // Uyarı
                warning: {
                    50: '#fffbeb',
                    500: '#f59e0b',
                    600: '#d97706',
                },
                // Hata
                danger: {
                    50: '#fef2f2',
                    500: '#ef4444',
                    600: '#dc2626',
                    DEFAULT: '#ef4444',
                },
                background: '#F9FAFB', // Gray 50
                surface: '#FFFFFF',
                text: {
                    main: '#111827', // Gray 900
                    secondary: '#4B5563', // Gray 600
                    light: '#9CA3AF', // Gray 400
                },
                border: '#E5E7EB', // Gray 200
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
