/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        sidebar:    '#F5F5F5',
        surface:    '#ffffff',
        elevated:   '#F5F5F5',
        border:     '#e5e7eb',
        muted:      '#6b7280',
        // Direct Assurance brand
        'da-blue':       '#E30613',
        'da-blue-hover': '#B0000A',
        'da-text':       '#2B2B2B',
      },
      keyframes: {
        blink: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0' } },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        blink:    'blink 1s step-start infinite',
        'fade-up':'fade-up 0.2s ease-out',
      },
    },
  },
  plugins: [],
}
