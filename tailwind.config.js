import forms from '@tailwindcss/forms'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#4F46E5',
        accent: '#D97706',
        bg: '#F9FAFB',
        text: '#111827',
        muted: '#6B7280',
        border: '#E5E7EB',
        error: '#DC2626',
        success: '#059669',
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        card: '0 4px 12px rgba(0,0,0,0.05)',
      },
    },
  },
  plugins: [forms],
}
