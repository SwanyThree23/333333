import type { Config } from 'tailwindcss'

const config: Config = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                // Premium earth-tone theme with burgundy and golden accents
                primary: {
                    50: '#fdf8f6',
                    100: '#f2e8e5',
                    200: '#e5d1cb',
                    300: '#d1b1a7',
                    400: '#b38a7c',
                    500: '#946a5c',
                    600: '#7a5448',
                    700: '#614239',
                    800: '#4a332c',
                    900: '#382823',
                    950: '#1a1210',
                },
                accent: {
                    burgundy: '#800020',
                    gold: '#D4AF37',
                    earth: '#3b4a3a',
                    bronze: '#cd7f32',
                    clay: '#d2691e',
                    sage: '#87a96b',
                },
                surface: {
                    50: '#1c1c1a',
                    100: '#171715',
                    200: '#121210',
                    300: '#0d0d0c',
                    400: '#080807',
                    500: '#030303',
                },
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
                'glass-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                'earth-glow': 'linear-gradient(135deg, #800020 0%, #D4AF37 50%, #cd7f32 100%)',
            },
            animation: {
                'float': 'float 6s ease-in-out infinite',
                'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
                'slide-up': 'slide-up 0.5s ease-out',
                'fade-in': 'fade-in 0.3s ease-out',
                'shimmer': 'shimmer 2s linear infinite',
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-20px)' },
                },
                'pulse-glow': {
                    '0%, 100%': { opacity: '1', boxShadow: '0 0 20px rgba(128, 0, 32, 0.5)' },
                    '50%': { opacity: '0.8', boxShadow: '0 0 40px rgba(128, 0, 32, 0.8)' },
                },
                'slide-up': {
                    '0%': { transform: 'translateY(20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                'fade-in': {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                shimmer: {
                    '0%': { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' },
                },
            },
            boxShadow: {
                'neon-burgundy': '0 0 20px rgba(128, 0, 32, 0.5), 0 0 40px rgba(128, 0, 32, 0.3)',
                'neon-gold': '0 0 20px rgba(212, 175, 55, 0.5), 0 0 40px rgba(212, 175, 55, 0.3)',
                'neon-earth': '0 0 20px rgba(59, 74, 58, 0.5), 0 0 40px rgba(59, 74, 58, 0.3)',
                'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.5)',
            },
            backdropBlur: {
                xs: '2px',
            },
        },
    },
    plugins: [],
}

export default config
