/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        surface: {
          DEFAULT: 'rgb(var(--surface) / <alpha-value>)',
          elevated: 'rgb(var(--surface-elevated) / <alpha-value>)',
        },
        ink: {
          DEFAULT: 'rgb(var(--ink) / <alpha-value>)',
          muted: 'rgb(var(--ink-muted) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
          soft: 'rgb(var(--accent-soft) / <alpha-value>)',
        },
        ringline: 'rgb(var(--ringline) / <alpha-value>)',
      },
      backgroundImage: {
        'mesh-light':
          'radial-gradient(at 0% 0%, rgb(224 242 254 / 0.9) 0px, transparent 52%), radial-gradient(at 100% 0%, rgb(237 233 254 / 0.5) 0px, transparent 48%), radial-gradient(at 100% 100%, rgb(241 245 249) 0px, transparent 55%)',
        'mesh-dark':
          'linear-gradient(180deg, #050816 0%, #0b1120 45%, #111827 100%), radial-gradient(ellipse 80% 50% at 50% -20%, rgb(56 189 248 / 0.12), transparent), radial-gradient(ellipse 60% 40% at 100% 0%, rgb(139 92 246 / 0.08), transparent)',
      },
      boxShadow: {
        glass: '0 8px 32px rgb(15 23 42 / 0.08)',
        'glass-dark': '0 8px 40px rgb(0 0 0 / 0.45)',
      },
      animation: {
        'fade-up': 'fadeUp 0.6s ease-out forwards',
        shimmer: 'shimmer 2.2s linear infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      },
    },
  },
  plugins: [],
};
