/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#0F3330',
          light: '#1B4C47',
          dark: '#092220',
          50: '#EAF1EF',
        },
        gold: {
          DEFAULT: '#BE9B4E',
          light: '#E4C77D',
          dark: '#8F7233',
        },
        sand: {
          DEFAULT: '#F6F2E9',
          dark: '#EDE6D6',
        },
        charcoal: '#1E2422',
        slate: {
          DEFAULT: '#6B7570',
        },
        success: '#2F855A',
        danger: '#C0392B',
        info: '#2C6E8E',
      },
      fontFamily: {
        display: ['"Fraunces"', 'Georgia', 'serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      },
      boxShadow: {
        soft: '0 2px 8px rgba(15, 51, 48, 0.06), 0 1px 2px rgba(15, 51, 48, 0.04)',
        card: '0 8px 24px rgba(15, 51, 48, 0.08), 0 2px 6px rgba(15, 51, 48, 0.05)',
        lifted: '0 16px 40px rgba(15, 51, 48, 0.14), 0 4px 10px rgba(15, 51, 48, 0.08)',
        gold: '0 8px 24px rgba(190, 155, 78, 0.25)',
      },
      backgroundImage: {
        'ink-gradient': 'linear-gradient(135deg, #0F3330 0%, #1B4C47 55%, #0F3330 100%)',
        'gold-gradient': 'linear-gradient(135deg, #E4C77D 0%, #BE9B4E 100%)',
      },
    },
  },
  plugins: [],
}
