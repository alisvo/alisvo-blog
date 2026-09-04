/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22',
        },
        dark: {
          bg: '#090d16',
          card: '#111827',
          cardBorder: '#1f293d',
          hover: '#1a2234',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      typography: () => ({
        DEFAULT: {
          css: {
            maxWidth: '100%',
            color: '#334155',
            a: {
              color: '#059669',
              textDecoration: 'none',
              fontWeight: '500',
              '&:hover': {
                color: '#10b981',
                textDecoration: 'underline',
              },
            },
            code: {
              color: '#0f766e',
              backgroundColor: '#f1f5f9',
              padding: '0.2rem 0.4rem',
              borderRadius: '0.25rem',
              fontWeight: '500',
            },
            'code::before': {
              content: '""',
            },
            'code::after': {
              content: '""',
            },
            pre: {
              backgroundColor: '#0f172a',
              color: '#e2e8f0',
              borderRadius: '0.5rem',
              padding: '1rem',
              border: '1px solid #1e293b',
            },
            'pre code': {
              backgroundColor: 'transparent',
              padding: '0',
              color: 'inherit',
            },
            h1: {
              color: '#0f172a',
              fontWeight: '800',
            },
            h2: {
              color: '#0f172a',
              fontWeight: '700',
              borderBottom: '1px solid #e2e8f0',
              paddingBottom: '0.5rem',
            },
            h3: {
              color: '#1e293b',
              fontWeight: '600',
            },
            blockquote: {
              borderLeftColor: '#10b981',
              color: '#475569',
              fontStyle: 'italic',
            },
          },
        },
        dark: {
          css: {
            color: '#94a3b8',
            a: {
              color: '#34d399',
              '&:hover': {
                color: '#6ee7b7',
              },
            },
            code: {
              color: '#34d399',
              backgroundColor: '#1e293b',
            },
            pre: {
              backgroundColor: '#090d16',
              border: '1px solid #1f293d',
            },
            h1: {
              color: '#f8fafc',
            },
            h2: {
              color: '#f1f5f9',
              borderBottomColor: '#1f293d',
            },
            h3: {
              color: '#e2e8f0',
            },
            strong: {
              color: '#f1f5f9',
            },
            blockquote: {
              borderLeftColor: '#059669',
              color: '#94a3b8',
            },
            hr: {
              borderColor: '#1f293d',
            },
          },
        },
      }),
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
