/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        primary: {
          DEFAULT: '#4F46E5', // Electric Indigo
          hover: '#4338CA',
          light: '#EEF2FF'
        },
        brand: {
          indigo: '#3a1c71',
          rose: '#d76d77',
          peach: '#ffaf7b'
        },
        surface: {
          DEFAULT: 'var(--surface)',
          hover: 'var(--surface-hover)',
          border: 'var(--surface-border)'
        },
        muted: 'var(--muted)',
      },
      boxShadow: {
        'glass': '0 4px 30px rgba(0, 0, 0, 0.05)',
        'subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'glow': '0 0 15px rgba(79, 70, 229, 0.3)',
        'glow-sm': '0 0 8px rgba(79, 70, 229, 0.2)',
      },
      keyframes: {
        gradientBackground: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(-10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          from: { opacity: '0', transform: 'translateY(-30px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%, 75%': { transform: 'translateX(-8px)' },
          '50%': { transform: 'translateX(8px)' },
        }
      },
      animation: {
        gradientBackground: 'gradientBackground 15s ease infinite',
        fadeIn: 'fadeIn 0.7s ease-in-out',
        slideDown: 'slideDown 0.8s ease-in-out',
        shake: 'shake 0.5s ease-in-out',
      }
    },
  },
  plugins: [],
}
