/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        sidebar:    '#f4f5f7',
        surface:    '#ffffff',
        elevated:   '#f0f2f5',
        border:     '#e5e7eb',
        muted:      '#6b7280',
        // Direct Assurances brand (AXA blue)
        'da-blue':  '#00008F',
        'da-blue-hover': '#0000b8',
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
