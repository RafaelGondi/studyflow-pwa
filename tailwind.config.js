/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Mist palette — same OKLCH values as Tailwind v4's native mist
        mist: {
          50:  'oklch(98.7% 0.002 197.1)',
          100: 'oklch(96.3% 0.002 197.1)',
          200: 'oklch(92.5% 0.005 214.3)',
          300: 'oklch(87.2% 0.007 219.6)',
          400: 'oklch(72.3% 0.014 214.4)',
          500: 'oklch(56%   0.021 213.5)',
          600: 'oklch(45%   0.017 213.2)',
          700: 'oklch(37.8% 0.015 216)',
          800: 'oklch(27.5% 0.011 216.9)',
          900: 'oklch(21.8% 0.008 223.9)',
          950: 'oklch(14.8% 0.004 228.8)',
        },
        // App structural colors (CSS-var driven, adapt per theme)
        app: {
          bg:       'rgb(var(--app-bg)       / <alpha-value>)',
          card:     'rgb(var(--app-card)     / <alpha-value>)',
          elevated: 'rgb(var(--app-elevated) / <alpha-value>)',
          border:   'rgb(var(--app-border)   / <alpha-value>)',
        },
      },
      textColor: {
        primary:   'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        muted:     'var(--text-muted)',
        faint:     'var(--text-faint)',
      },
      fontFamily: {
        sans: ['Satoshi', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow':  'spin 3s linear infinite',
      },
    },
  },
  plugins: [],
}
