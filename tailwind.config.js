/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'labubu-pink': '#FF69B4',
        'labubu-purple': '#9370DB',
        'labubu-yellow': '#FFD700',
        'labubu-green': '#00FF7F',
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'bounce-slow': 'bounce 2s infinite',
        'pulse-fast': 'pulse 1s infinite',
      },
      fontFamily: {
        'game': ['Comic Sans MS', 'cursive'],
      },
    },
  },
  plugins: [],
}