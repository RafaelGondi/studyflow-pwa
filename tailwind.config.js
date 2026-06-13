/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        app: {
          bg: 'var(--bg)',
          card: 'var(--bg-elevated)',
          elevated: 'var(--bg-soft)',
          border: 'var(--border)',
        },
      },
      textColor: {
        primary: 'var(--text)',
        secondary: 'var(--text-secondary)',
        muted: 'var(--text-tertiary)',
        faint: 'var(--text-tertiary)',
      },
      fontFamily: {
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        akoma: 'var(--radius-md)',
        'akoma-lg': 'var(--radius-lg)',
        pill: 'var(--radius-full)',
      },
      boxShadow: {
        akoma: 'var(--shadow-sm)',
        'akoma-md': 'var(--shadow-md)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
    },
  },
  plugins: [],
}
