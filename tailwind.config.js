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
        bg: 'var(--bg)',
        bg2: 'var(--bg2)',
        glass: 'var(--glass)',
        glass2: 'var(--glass2)',
        stroke: 'var(--stroke)',
        text: 'var(--text)',
        muted: 'var(--muted)',
        risk: {
          low: 'var(--risk-low)',
          med: 'var(--risk-med)',
          high: 'var(--risk-high)',
        }
      },
      backdropBlur: {
        glass: 'var(--blur)',
      },
      boxShadow: {
        glass: 'var(--shadow)',
        'glass-lg': '0 20px 50px rgba(30,20,10,0.15)',
      },
      fontFamily: {
        sans: ['Fraunces', 'ui-serif', 'Georgia', 'Cambria', 'Times New Roman', 'Times', 'serif'],
        display: ['Fraunces', 'ui-serif', 'Georgia', 'serif'],
        body: ['Sentient', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}