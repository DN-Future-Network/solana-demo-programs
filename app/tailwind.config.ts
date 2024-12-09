import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        reward: '#151E25',
        'stake-bg-from': '#82AC7E',
        'stake-bg-to': '#26454B',
      },
    },
  },
  plugins: [require('daisyui')],
}
export default config
