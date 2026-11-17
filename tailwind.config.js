const tokens = require('./tailwind.tokens.cjs');
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    colors: tokens.colors,
    fontSize: tokens.fontSize,
    borderRadius: { none: '0', ...tokens.borderRadius, full: 'var(--radius-pill)' },
    fontFamily: { sans: 'var(--font-sans)', mono: 'var(--font-mono)' },
    boxShadow: { none: 'none', pop: 'var(--shadow-pop)', selected: 'var(--shadow-clip-selected)' },
    extend: { spacing: { rail: 'var(--rail)', panel: 'var(--panel)', inspector: 'var(--inspector)', topbar: 'var(--topbar)', track: 'var(--track-height)' } },
  },
  plugins: [],
};
