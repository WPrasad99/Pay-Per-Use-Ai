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
                // Legacy brutal shadows for non-landing pages
                brutal: '9px 9px 0 #111111',
                'brutal-sm': '5px 5px 0 #111111',
                'brutal-lg': '14px 14px 0 #111111',
            },
            borderRadius: {
                'pill': '9999px',
            },
            animation: {
                'fade-in': 'fadeIn 0.6s ease-out forwards',
                'slide-up': 'slideUp 0.6s ease-out forwards',
                'ticker-scroll': 'ticker-scroll 30s linear infinite',
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
            }
        }
    },
    plugins: []
}
