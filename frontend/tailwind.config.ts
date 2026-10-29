import { defineConfig, type Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['Roboto Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        brand: {
          50: '#EBF2FF',
          100: '#D9E7FF',
          200: '#C2D6FA',
          500: '#1F57E0',
          600: '#1F57E0',
          700: '#1848BF',
          800: '#153BA0',
        },
        canvas: '#F6F8FC',
        ink: { DEFAULT: '#1F293B', deep: '#14233B' },
        muted: '#6E7A8F',
        line: '#E3E8F0',
        success: { DEFAULT: '#149463', tint: '#E0F7EB' },
        warning: { DEFAULT: '#B56B21', accent: '#E88229', tint: '#FFF2DE' },
        danger: { DEFAULT: '#C73840', tint: '#FDECEE' },
        purple: { DEFAULT: '#6E4FCF', tint: '#F0EBFF' },
      },
      boxShadow: {
        card: '0 1px 2px rgba(16, 24, 40, 0.04), 0 1px 3px rgba(16, 24, 40, 0.06)',
        pop: '0 8px 24px rgba(16, 24, 40, 0.16)',
      },
    },
  },
  plugins: [],
} satisfies Config
