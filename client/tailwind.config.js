/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    /* ── Strict 4px Spacing Grid ── */
    spacing: {
      0: '0px',
      px: '1px',
      0.5: '2px',
      1: '4px',
      2: '8px',
      3: '12px',
      4: '16px',
      5: '20px',
      6: '24px',
      8: '32px',
      10: '40px',
      12: '48px',
      14: '56px',
      16: '64px',
      20: '80px',
      24: '96px',
    },

    /* ── Typography Scale ── */
    fontSize: {
      'xs':   ['11px', { lineHeight: '16px', letterSpacing: '0.02em' }],
      'sm':   ['13px', { lineHeight: '20px', letterSpacing: '0em' }],
      'base': ['15px', { lineHeight: '24px', letterSpacing: '-0.01em' }],
      'lg':   ['18px', { lineHeight: '28px', letterSpacing: '-0.015em' }],
      'xl':   ['24px', { lineHeight: '32px', letterSpacing: '-0.02em' }],
      '2xl':  ['32px', { lineHeight: '40px', letterSpacing: '-0.03em' }],
    },

    /* ── Border Radius Scale ── */
    borderRadius: {
      'none': '0px',
      'sm':   '4px',
      DEFAULT: '6px',
      'md':   '8px',
      'lg':   '12px',
      'xl':   '16px',
      'full': '9999px',
    },

    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },

      /* ── Semantic Color System ── */
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        primary: {
          DEFAULT: 'var(--primary)',
          hover: 'var(--primary-hover)',
          light: 'var(--primary-light)',
        },
        surface: {
          DEFAULT: 'var(--surface)',
          hover: 'var(--surface-hover)',
          border: 'var(--surface-border)',
        },
        muted: 'var(--muted)',
        border: 'var(--surface-border)',
        success: {
          DEFAULT: 'var(--color-success)',
          light: 'var(--color-success-light)',
          border: 'var(--color-success-border)',
        },
        warning: {
          DEFAULT: 'var(--color-warning)',
          light: 'var(--color-warning-light)',
          border: 'var(--color-warning-border)',
        },
        danger: {
          DEFAULT: 'var(--color-danger)',
          light: 'var(--color-danger-light)',
          border: 'var(--color-danger-border)',
        },
        info: {
          DEFAULT: 'var(--color-info)',
          light: 'var(--color-info-light)',
          border: 'var(--color-info-border)',
        },
      },

      /* ── Box Shadows ── */
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'sm': '0 1px 3px 0 rgba(0, 0, 0, 0.06)',
        'md': '0 4px 12px rgba(0, 0, 0, 0.08)',
        'lg': '0 8px 24px rgba(0, 0, 0, 0.12)',
        'glow': '0 0 12px rgba(79, 70, 229, 0.25)',
      },

      /* ── Z-Index ── */
      zIndex: {
        'dropdown': 'var(--z-dropdown)',
        'sticky': 'var(--z-sticky)',
        'overlay': 'var(--z-overlay)',
        'modal': 'var(--z-modal)',
        'command': 'var(--z-command)',
        'toast': 'var(--z-toast)',
      },

      /* ── Animations ── */
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-down': {
          from: { opacity: '0', transform: 'translateY(-16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%, 75%': { transform: 'translateX(-6px)' },
          '50%': { transform: 'translateX(6px)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        spin: {
          to: { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s var(--ease-out)',
        'slide-down': 'slide-down 0.25s var(--ease-out)',
        'shake': 'shake 0.2s ease-in-out',
        'shimmer': 'shimmer 2s infinite linear',
        'spin': 'spin 0.6s linear infinite',
      },
    },
  },
  plugins: [],
}
