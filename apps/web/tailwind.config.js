/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0B1020',
        card: '#111827',
        border: '#1F2937',
        primary: {
          DEFAULT: '#6366F1',
          hover: '#4F46E5',
          dark: '#4338CA',
          light: '#818CF8',
        },
        success: '#22C55E',
        warning: '#F59E0B',
        danger: '#EF4444',
        foreground: '#F8FAFC',
        muted: '#94A3B8',
        secondary: '#1E293B',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
