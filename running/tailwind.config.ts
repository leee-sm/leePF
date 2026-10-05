import type { Config } from 'tailwindcss'

export default {
  content: [
    './app.vue',
    './pages/**/*.{vue,ts}',
    './components/**/*.{vue,ts}',
    './composables/**/*.ts',
  ],
  theme: {
    extend: {
      colors: {
        ink: '#172033',
        muted: '#657386',
        running: '#0f766e',
        baby: '#be5b7b',
      },
      boxShadow: {
        soft: '0 10px 35px rgba(23, 32, 51, 0.08)',
      },
    },
  },
  plugins: [],
} satisfies Config
