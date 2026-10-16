/** @type {import('tailwindcss').Config} */
// 색·모서리 값은 docs/design/ios26-tokens.md (Apple iOS/iPadOS 26 UI Kit 실측값) 기준.
// 기존 클래스(blue-600, slate-500 …)를 그대로 쓰면서 iOS 시스템 컬러가 나오도록 팔레트를 덮어쓴다.
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Accents/Blue #0088FF
        blue: { 50: '#e8f4ff', 100: '#d1e9ff', 200: '#a3d3ff', 300: '#6bb9ff', 400: '#3aa2ff', 500: '#1a94ff', 600: '#0088ff', 700: '#0077e0', 800: '#005fb3', 900: '#004785' },
        // Accents/Red #FF383C
        red: { 50: '#fff0f0', 100: '#ffe0e0', 200: '#ffc2c3', 300: '#ff9496', 400: '#ff5c5f', 500: '#ff383c', 600: '#e62a2e', 700: '#c21f23' },
        // Accents/Green #34C759
        green: { 50: '#ebf9ef', 100: '#d6f4de', 500: '#34c759', 600: '#2fb350' },
        emerald: { 500: '#34c759', 600: '#2fb350' },
        // Accents/Orange #FF8D28
        amber: { 50: '#fff4e9', 100: '#ffe8d3', 200: '#ffd1a8', 400: '#ffa452', 500: '#ff8d28', 800: '#8a4300' },
        orange: { 500: '#ff8d28' },
        // Accents/Purple #CB30E0, Indigo #6155F5
        violet: { 100: '#f7e3fb', 400: '#d964ea', 500: '#cb30e0', 600: '#cb30e0' },
        purple: { 500: '#cb30e0', 600: '#cb30e0' },
        indigo: { 500: '#6155f5', 600: '#6155f5' },
        // Grays (Gray ~ Gray 6)
        slate: { 50: '#f7f7fa', 100: '#f2f2f7', 200: '#e5e5ea', 300: '#d1d1d6', 400: '#aeaeb2', 500: '#8e8e93', 600: '#636366', 700: '#48484a', 800: '#2c2c2e', 900: '#1c1c1e' },
      },
      borderRadius: {
        card: '22px',
        field: '26px',
        alert: '34px',
        sheet: '38px',
      },
      boxShadow: {
        glass: '0 8px 40px rgba(0,0,0,0.12)',
        sheet: '0 15px 75px rgba(0,0,0,0.18)',
        card: '0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)',
      },
      fontFamily: {
        // Apple 기기에서는 시스템 글꼴(SF)이, Windows에서는 Pretendard/맑은 고딕이 쓰인다. SF 폰트 파일은 포함하지 않는다.
        sans: ['-apple-system', 'BlinkMacSystemFont', 'system-ui', 'Pretendard', 'Apple SD Gothic Neo', 'Malgun Gothic', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
