import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    colors: {
      primary: '#8B0000',
      secondary: '#00008B',
      accent: '#556B2F',
      'text-primary': '#3A241D',
      'text-muted': '#6F4E37',
      'bg-primary': '#F5DEB3',
      'bg-surface': '#D2B48C',
      'border-primary': '#855E42',
    },
    fontFamily: {
      heading: ['"IM Fell English SC"', 'serif'],
      body: ['Garamond', 'serif'],
    },
    backgroundImage: {
      'parchment': "url('/parchment-texture.jpg')",
      'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      'gradient-conic':
        'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
    },
    boxShadow: {
      'outline-primary': '0 0 0 4px #855E42',
    },
  },
  plugins: [],
}
export default config