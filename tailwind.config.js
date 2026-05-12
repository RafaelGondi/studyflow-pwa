/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        app: {
          bg:       'rgb(var(--app-bg)       / <alpha-value>)',
          card:     'rgb(var(--app-card)     / <alpha-value>)',
          elevated: 'rgb(var(--app-elevated) / <alpha-value>)',
          border:   'rgb(var(--app-border)   / <alpha-value>)',
        },
        accent: 'rgb(var(--color-accent) / <alpha-value>)',
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
        'spin-slow': 'spin 3s linear infinite',
      },
    },
  },
  plugins: [],
}
