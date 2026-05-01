export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        gold: '#f59e0b',
        'dark-bg': '#0a0a0a',
        'dark-card': '#111111',
        'dark-border': '#222222',
        'dark-hover': '#1a1a1a',
      },
      fontFamily: {
        bebas: ['"Bebas Neue"', 'cursive'],
        dm: ['"DM Sans"', 'sans-serif'],
      },
      animation: {
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
      },
      keyframes: {
        slideIn: { '0%': { transform: 'translateX(100%)', opacity: '0' }, '100%': { transform: 'translateX(0)', opacity: '1' } },
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
      }
    }
  },
  plugins: []
};
