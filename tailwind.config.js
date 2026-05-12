/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Mauve palette — same OKLCH values as Tailwind v4's native mauve
        mauve: {
          50:  'oklch(98.5% 0 0)',
          100: 'oklch(96% 0.003 325.6)',
          200: 'oklch(92.2% 0.005 325.62)',
          300: 'oklch(86.5% 0.012 325.68)',
          400: 'oklch(71.1% 0.019 323.02)',
          500: 'oklch(54.2% 0.034 322.5)',
          600: 'oklch(43.5% 0.029 321.78)',
          700: 'oklch(36.4% 0.029 323.89)',
          800: 'oklch(26.3% 0.024 320.12)',
          900: 'oklch(21.2% 0.019 322.12)',
          950: 'oklch(14.5% 0.008 326)',
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
