import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--color-bg)',
        foreground: 'var(--color-text)',

        brand:            'var(--color-brand)',
        'brand-light':    'var(--color-brand-light)',
        'brand-dark':     'var(--color-brand-dark)',
        'brand-mid':      'var(--color-brand-mid)',

        surface:          'var(--color-surface)',
        'surface-active': 'var(--color-surface-active)',
        'surface-input':  'var(--color-surface-input)',

        'border-color':   'var(--color-border)',
        'border-strong':  'var(--color-border-strong)',

        'accent-blue':    'var(--color-accent-blue)',
        'accent-sky':     'var(--color-accent-sky)',
        'accent-red':     'var(--color-accent-red)',

        'text-base':      'var(--color-text)',
        'text-muted':     'var(--color-text-muted)',
        'text-dim':       'var(--color-text-dim)',
      },
    },
  },
  plugins: [],
};
export default config;
