import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        brand: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          500: '#1D4ED8',
          600: '#1D4ED8',
          700: '#1E40AF',
          800: '#1E3A8A',
        },
        canvas: '#F8FAFC',
        ink: { DEFAULT: '#0F172A', deep: '#080D26' },
        muted: '#64748B',
        line: '#E8ECF2',
        success: { DEFAULT: '#059669', tint: '#ECFDF5' },
        warning: { DEFAULT: '#D97706', accent: '#F59E0B', tint: '#FFFBEB' },
        danger: { DEFAULT: '#DC2626', tint: '#FEF2F2' },
        purple: { DEFAULT: '#6D28D9', tint: '#F5F3FF' },
      },
      boxShadow: {
        card: '0 1px 3px rgba(15, 23, 42, 0.03), 0 1px 2px rgba(15, 23, 42, 0.02)',
        pop: '0 10px 30px -5px rgba(15, 23, 42, 0.12), 0 4px 12px -2px rgba(15, 23, 42, 0.06)',
      },
    },
  },
  plugins: [],
} satisfies Config
