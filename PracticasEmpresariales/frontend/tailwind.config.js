/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        cue: {
          primary:   '#312e81',
          secondary: '#4338ca',
          accent:    '#4f46e5',
          light:     '#eef2ff',
          success:   '#059669',
          warning:   '#d97706',
          danger:    '#dc2626',
          dark:      '#1e1b4b',
        },
      },
    },
  },
  plugins: [],
}
