/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "var(--background)",
                foreground: "var(--text-main)",
                primary: {
                    DEFAULT: "#1e3a8a", // Lacivert
                    light: "#2563eb",
                    dark: "#1e3a8a",
                },
                secondary: {
                    DEFAULT: "#fbbf24", // Altın
                    hover: "#f59e0b",
                },
                success: "#10b981",
                warning: "#f59e0b",
                danger: "#ef4444",
                info: "#3b82f6",
                surface: "var(--surface)",
                border: "var(--border)",
            },
        },
    },
    plugins: [
        require('@tailwindcss/typography'),
    ],
}
