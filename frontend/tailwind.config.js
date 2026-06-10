/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,jsx}"],
    theme: {
        extend: {
            colors: {
                background: '#f5f5f0',
                foreground: '#0a0a0a',
                muted: {
                    DEFAULT: '#737373',
                    foreground: '#a3a3a3',
                },
                accent: {
                    DEFAULT: '#8b7355',
                    light: '#b8a088',
                    glow: 'rgba(139, 115, 85, 0.15)',
                },
                border: {
                    DEFAULT: 'rgba(10,10,10,0.1)',
                    strong: 'rgba(10,10,10,0.2)',
                },
                card: {
                    DEFAULT: '#edede8',
                    hover: '#e5e5e0',
                },
                // Keep brand colors for potential use elsewhere
                brand: {
                    purple: '#7c3aed',
                    violet: '#6366f1',
                    indigo: '#818cf8',
                    light: '#a78bfa',
                },
                // Legacy neo colors kept for non-landing pages (dashboard, workspace, etc.)
                neo: {
                    ink: '#111111',
                    cream: '#fff7df',
                    yellow: '#fff06a',
                    pink: '#ff5ea8',
                    blue: '#5f4bff',
                    green: '#a7f3d0',
                    muted: '#4b5563',
                },
                surface: {
                    DEFAULT: '#000000',
                    card: 'rgba(255, 255, 255, 0.03)',
                    elevated: 'rgba(255, 255, 255, 0.06)',
                }
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
                display: ['Inter', 'system-ui', 'sans-serif'],
                mono: ['JetBrains Mono', 'SF Mono', 'Courier New', 'monospace'],
                // Keep legacy font for dashboard pages
                grotesk: ['Space Grotesk', 'Inter', 'system-ui', 'sans-serif'],
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
            },
            borderWidth: {
                3: '3px',
            },
            boxShadow: {
                'subtle': '0 1px 3px rgba(0,0,0,0.04)',
                'card': '0 4px 20px rgba(0,0,0,0.03)',
                'card-hover': '0 8px 40px rgba(0,0,0,0.06)',
                'glow': '0 0 60px rgba(0,0,0,0.04)',
                'glow-accent': '0 0 40px rgba(139, 115, 85, 0.15)',
                'glow-accent-lg': '0 0 80px rgba(139, 115, 85, 0.2)',
                'inner-glow': 'inset 0 1px 0 rgba(255,255,255,0.6)',
                'elevated': '0 20px 60px rgba(0,0,0,0.08), 0 4px 20px rgba(0,0,0,0.04)',
                // Legacy brutal shadows for non-landing pages
                brutal: '9px 9px 0 #111111',
                'brutal-sm': '5px 5px 0 #111111',
                'brutal-lg': '14px 14px 0 #111111',
            },
            borderRadius: {
                'pill': '9999px',
                '4xl': '2rem',
                '5xl': '2.5rem',
            },
            transitionTimingFunction: {
                'spring': 'cubic-bezier(0.16, 1, 0.3, 1)',
                'smooth': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
            },
            animation: {
                'fade-in': 'fadeIn 0.6s ease-out forwards',
                'slide-up': 'slideUp 0.6s ease-out forwards',
                'ticker-scroll': 'ticker-scroll 40s linear infinite',
                'gradient-x': 'gradient-shift 6s ease infinite',
                'pulse-ring': 'pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'shimmer': 'shimmer 2s ease-in-out infinite',
                'border-glow': 'border-glow 3s ease-in-out infinite',
                'float': 'float 6s ease-in-out infinite',
                'aurora': 'aurora-drift 20s ease-in-out infinite alternate',
                'orbit': 'orbit var(--orbit-duration, 20s) linear infinite',
                'orbit-reverse': 'orbit-reverse var(--orbit-duration, 25s) linear infinite',
                'draw-line': 'draw-line 1s ease-out forwards',
                'blink': 'blink-cursor 1s step-end infinite',
            },
            keyframes: {
                fadeIn: {
                    from: { opacity: '0' },
                    to: { opacity: '1' },
                },
                slideUp: {
                    from: { opacity: '0', transform: 'translateY(20px)' },
                    to: { opacity: '1', transform: 'translateY(0)' },
                },
                'ticker-scroll': {
                    from: { transform: 'translateX(0)' },
                    to: { transform: 'translateX(-50%)' },
                },
                'gradient-shift': {
                    '0%': { backgroundPosition: '0% 50%' },
                    '50%': { backgroundPosition: '100% 50%' },
                    '100%': { backgroundPosition: '0% 50%' },
                },
                'pulse-ring': {
                    '0%': { boxShadow: '0 0 0 0 rgba(139, 115, 85, 0.4)' },
                    '70%': { boxShadow: '0 0 0 10px rgba(139, 115, 85, 0)' },
                    '100%': { boxShadow: '0 0 0 0 rgba(139, 115, 85, 0)' },
                },
                shimmer: {
                    '0%': { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' },
                },
                'border-glow': {
                    '0%, 100%': { borderColor: 'rgba(139, 115, 85, 0.15)' },
                    '50%': { borderColor: 'rgba(139, 115, 85, 0.35)' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
                'aurora-drift': {
                    '0%': { transform: 'translate(0, 0) rotate(0deg)' },
                    '50%': { transform: 'translate(5%, -3%) rotate(2deg)' },
                    '100%': { transform: 'translate(-3%, 5%) rotate(-1deg)' },
                },
                orbit: {
                    from: { transform: 'rotate(0deg) translateX(var(--orbit-radius, 120px)) rotate(0deg)' },
                    to: { transform: 'rotate(360deg) translateX(var(--orbit-radius, 120px)) rotate(-360deg)' },
                },
                'orbit-reverse': {
                    from: { transform: 'rotate(360deg) translateX(var(--orbit-radius, 120px)) rotate(-360deg)' },
                    to: { transform: 'rotate(0deg) translateX(var(--orbit-radius, 120px)) rotate(0deg)' },
                },
                'draw-line': {
                    from: { width: '0' },
                    to: { width: '100%' },
                },
                'blink-cursor': {
                    '0%, 100%': { opacity: '1' },
                    '50%': { opacity: '0' },
                },
            },
        }
    },
    plugins: []
}
