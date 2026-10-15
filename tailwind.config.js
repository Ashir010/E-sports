/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#050607',
          900: '#08090B',
          850: '#0C0E11',
          800: '#111418',
          750: '#161A1F',
          700: '#1C2128',
          600: '#272D36',
          500: '#3A424E',
        },
        lime: {
          DEFAULT: '#C6FF3D',
          300: '#DBFF85',
          400: '#C6FF3D',
          500: '#A8E61A',
          600: '#7FB80B',
        },
        violet: { DEFAULT: '#8B5CF6', 400: '#A78BFA', 500: '#8B5CF6', 600: '#7C3AED' },
        cyan: { DEFAULT: '#22D3EE', 400: '#22D3EE', 500: '#06B6D4' },
        mist: { 100: '#F2F4F7', 200: '#D5DAE1', 300: '#A9B1BD', 400: '#7D8794', 500: '#5B6470' },
        danger: '#FF4D6A',
        warn: '#FFB23F',
      },
      fontFamily: {
        display: ['"Chakra Petch"', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: { xl: '14px', '2xl': '20px' },
      boxShadow: {
        glow: '0 0 0 1px rgba(198,255,61,.35), 0 8px 40px -8px rgba(198,255,61,.35)',
        'glow-sm': '0 0 24px -6px rgba(198,255,61,.45)',
        violet: '0 8px 40px -10px rgba(139,92,246,.55)',
        card: '0 1px 0 rgba(255,255,255,.04) inset, 0 20px 40px -24px rgba(0,0,0,.8)',
      },
      backgroundImage: {
        grid: 'linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px)',
      },
      keyframes: {
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        pulseDot: { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.35 } },
        scan: { '0%': { transform: 'translateY(-100%)' }, '100%': { transform: 'translateY(100%)' } },
      },
      animation: {
        shimmer: 'shimmer 1.6s infinite',
        'pulse-dot': 'pulseDot 1.6s ease-in-out infinite',
        scan: 'scan 6s linear infinite',
      },
    },
  },
  plugins: [],
};
