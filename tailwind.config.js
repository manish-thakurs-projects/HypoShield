/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        body: ['DM Sans', 'sans-serif'],
      },
      colors: {
        bg: {
          deep: '#050810',
          base: '#080d1a',
          card: '#0d1425',
          elevated: '#111c30',
          border: '#1a2a45',
        },
        neon: {
          cyan: '#00e5ff',
          green: '#00ff88',
          amber: '#ffb300',
          red: '#ff3d5a',
          blue: '#4d9fff',
        },
        safe: '#00ff88',
        moderate: '#ffb300',
        danger: '#ff3d5a',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-safe': 'glowSafe 2s ease-in-out infinite alternate',
        'glow-danger': 'glowDanger 1.5s ease-in-out infinite alternate',
        'number-pop': 'numberPop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'scan-line': 'scanLine 4s linear infinite',
        'heartbeat': 'heartbeat 1s ease-in-out infinite',
      },
      keyframes: {
        glowSafe: {
          '0%': { boxShadow: '0 0 20px rgba(0, 255, 136, 0.2), 0 0 40px rgba(0, 255, 136, 0.1)' },
          '100%': { boxShadow: '0 0 30px rgba(0, 255, 136, 0.4), 0 0 60px rgba(0, 255, 136, 0.2)' },
        },
        glowDanger: {
          '0%': { boxShadow: '0 0 20px rgba(255, 61, 90, 0.3), 0 0 40px rgba(255, 61, 90, 0.1)' },
          '100%': { boxShadow: '0 0 35px rgba(255, 61, 90, 0.6), 0 0 70px rgba(255, 61, 90, 0.3)' },
        },
        numberPop: {
          '0%': { transform: 'scale(0.85)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(30px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scanLine: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        heartbeat: {
          '0%, 100%': { transform: 'scale(1)' },
          '15%': { transform: 'scale(1.15)' },
          '30%': { transform: 'scale(1)' },
          '45%': { transform: 'scale(1.08)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
