/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'Courier New', 'monospace'],
      },
      colors: {
        gold: {
          DEFAULT: '#F5C200',
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F5C200',
          600: '#E6B000',
          700: '#D09700',
          800: '#B07D00',
          900: '#8A6100',
        },
        navy: {
          DEFAULT: '#1A0A5E',
          50: '#EEF0FF',
          100: '#D9DCFF',
          200: '#B3BAFF',
          300: '#8D97FF',
          400: '#6675FF',
          500: '#4052FF',
          600: '#2D3FE6',
          700: '#1A2DCC',
          800: '#1A0A5E',
          900: '#100640',
        },
        brand: {
          red: '#CC0000',
          'red-dark': '#AA0000',
          gold: '#F5C200',
          'gold-dark': '#E6B000',
          navy: '#1A0A5E',
        },
        border: 'hsl(var(--border))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0,0,0,0.08), 0 1px 2px -1px rgba(0,0,0,0.06)',
        'card-hover': '0 4px 12px 0 rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
        gold: '0 4px 14px 0 rgba(245,194,0,0.35)',
        navy: '0 4px 14px 0 rgba(26,10,94,0.25)',
      },
      fontWeight: {
        600: '600',
        700: '700',
        800: '800',
      },
    },
  },
  plugins: [],
};