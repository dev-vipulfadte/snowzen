/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        emerald: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#2f9e44',
          600: '#237635',
          700: '#15803d',
        },
        midnight: {
          50: '#f0f9ff',
          500: '#58a6ff',
          600: '#2f7bd3',
          700: '#1e3a8a',
        },
        sunset: {
          50: '#fff6f1',
          500: '#f26b3a',
          600: '#d85323',
          700: '#b4340e',
        },
        lavender: {
          50: '#f7f4ff',
          500: '#7c5cff',
          600: '#6447e1',
          700: '#5433b7',
        },
        ocean: {
          50: '#f0f8ff',
          500: '#0077b6',
          600: '#005f8a',
          700: '#00396f',
        },
        glass: {
          light: 'rgba(255, 255, 255, 0.25)',
          lighter: 'rgba(255, 255, 255, 0.15)',
          dark: 'rgba(0, 0, 0, 0.1)',
        },
      },
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        md: '12px',
        lg: '20px',
        xl: '40px',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.1), inset 0 0 0 1px rgba(255, 255, 255, 0.25)',
        'glass-lg': '0 16px 64px 0 rgba(31, 38, 135, 0.15), inset 0 0 0 1px rgba(255, 255, 255, 0.3)',
        'glass-sm': '0 4px 16px 0 rgba(31, 38, 135, 0.08), inset 0 0 0 1px rgba(255, 255, 255, 0.2)',
        'apple': '0 10px 40px rgba(0, 0, 0, 0.08)',
        'apple-lg': '0 20px 60px rgba(0, 0, 0, 0.12)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'spin-slow': 'spin 3s linear infinite',
        'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glass-shine': 'glassShine 3s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
        glassShine: {
          '0%': { backgroundPosition: '200% center' },
          '100%': { backgroundPosition: '-200% center' },
        },
      },
      fontFamily: {
        'sf-pro': ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', '"Segoe UI"', 'sans-serif'],
        'sf-mono': ['"SF Mono"', 'Monaco', 'Inconsolata', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        'glass': '20px',
        'ios': '16px',
      },
      spacing: {
        'safe-top': 'max(1rem, env(safe-area-inset-top))',
        'safe-bottom': 'max(1rem, env(safe-area-inset-bottom))',
        'safe-left': 'max(1rem, env(safe-area-inset-left))',
        'safe-right': 'max(1rem, env(safe-area-inset-right))',
      },
    },
  },
  plugins: [],
  darkMode: ['class', '[data-theme="midnight"]'],
}
