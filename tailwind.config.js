/** @type {import('tailwindcss').Config} */
// 디자인 토큰: docs/design/toona-design-tokens.md (시안 2 · 투네이션 브랜드).
// 색은 src/index.css의 CSS 변수(:root = 라이트, .dark = 다크)로 정의하고 여기서는 토큰 이름만 연결한다.
// 기본 팔레트(slate, blue …)는 쓰지 않는다 — 화면에서 색이 필요하면 반드시 아래 토큰을 쓴다.
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      white: '#ffffff',
      black: '#000000',
      canvas: v('canvas'),
      surface: { DEFAULT: v('surface'), raised: v('surface-raised'), sunken: v('surface-sunken') },
      line: { DEFAULT: v('line'), subtle: v('line-subtle'), strong: v('line-strong'), control: v('line-control') },
      text: {
        DEFAULT: v('text'),
        body: v('text-body'),
        secondary: v('text-secondary'),
        tertiary: v('text-tertiary'),
        'on-brand': v('text-on-brand'),
        'on-warning': v('text-on-warning'),
      },
      link: v('link'),
      brand: { DEFAULT: v('brand'), hover: v('brand-hover'), tint: v('brand-tint'), 'tint-line': v('brand-tint-line') },
      live: v('live'),
      warning: v('warning'),
      danger: v('danger'),
    },
    extend: {
      borderRadius: {
        widget: '12px',
        card: '10px',
        control: '6px',
        'dock-item': '8px',
        tag: '4px',
        pill: '9999px',
      },
      // 겹침 순서: 캔버스 < Dock < 상단 바 < 팝오버 < 옆 패널·시트 < 모달 < 알림창 < 진입 화면 < 토스트
      zIndex: {
        dock: '9999',
        titlebar: '10000',
        popover: '12000',
        sheet: '15000',
        modal: '20000',
        alert: '21000',
        entry: '25000',
        toast: '30000',
      },
      boxShadow: {
        float: 'var(--shadow-float)',
      },
      fontFamily: {
        sans: ['"Pretendard Variable"', 'Pretendard', '"Malgun Gothic"', '"Apple SD Gothic Neo"', 'sans-serif'],
        num: ['"IBM Plex Mono"', '"Pretendard Variable"', 'Pretendard', 'monospace'],
      },
      // 글자 크기는 rem — 설정의 텍스트 크기(100/125/150%)를 html 글자 크기 하나로 적용한다 (16px 기준).
      fontSize: {
        'title-widget': ['0.875rem', { lineHeight: '1.25rem', fontWeight: '700' }],
        body: ['0.8125rem', { lineHeight: '1.25rem' }],
        caption: ['0.75rem', { lineHeight: '1rem', fontWeight: '500' }],
        micro: ['0.6875rem', { lineHeight: '1rem' }],
        badge: ['0.625rem', { lineHeight: '1rem', fontWeight: '700' }],
      },
    },
  },
  plugins: [],
};
