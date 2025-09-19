/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // NetPilot Dark Theme Colors
        background: '#0a0a0a',
        foreground: '#ffffff',
        card: '#1a1a1a',
        'card-foreground': '#ffffff',
        popover: '#1a1a1a',
        'popover-foreground': '#ffffff',
        primary: '#22c55e',
        'primary-foreground': '#ffffff',
        secondary: '#262626',
        'secondary-foreground': '#ffffff',
        muted: '#262626',
        'muted-foreground': '#a3a3a3',
        accent: '#262626',
        'accent-foreground': '#ffffff',
        destructive: '#ef4444',
        'destructive-foreground': '#ffffff',
        border: '#262626',
        input: '#1a1a1a',
        ring: '#22c55e',
        sidebar: '#0f0f0f',
        'sidebar-foreground': '#ffffff',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}