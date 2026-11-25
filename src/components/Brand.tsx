// 투네이션 로고 (토큰 문서 §6 [v1.2]).
// 원본(docs/design/brand/)은 5000px 안팎이라, 앱에는 높이 64px·96px로 줄인 사본(src/assets/brand/)을 쓴다.
// 테마가 다크면 -dark 파일, 라이트면 일반 파일. CSS로 로고를 그리지 않는다.
import { useSettings } from '../lib/hooks';
import logoEn64 from '../assets/brand/toonation-logo-primary-64.png';
import logoEn96 from '../assets/brand/toonation-logo-primary-96.png';
import logoEnDark64 from '../assets/brand/toonation-logo-primary-dark-64.png';
import logoEnDark96 from '../assets/brand/toonation-logo-primary-dark-96.png';
import logoKr64 from '../assets/brand/toonation-logo-primary-kr-64.png';
import logoKr96 from '../assets/brand/toonation-logo-primary-kr-96.png';
import logoKrDark64 from '../assets/brand/toonation-logo-primary-kr-dark-64.png';
import logoKrDark96 from '../assets/brand/toonation-logo-primary-kr-dark-96.png';
import symbol64 from '../assets/brand/toonation-symbol-64.png';

const FILES = {
  en: { light: [logoEn64, logoEn96], dark: [logoEnDark64, logoEnDark96] },
  kr: { light: [logoKr64, logoKr96], dark: [logoKrDark64, logoKrDark96] },
} as const;

/** 로고 이미지. 상단 바 20px(영문), 스플래시·로그인 32px. 높이가 21px 이상이면 96px 사본을 쓴다. */
export function Logo({ height = 20, lang = 'en', className = '' }: { height?: number; lang?: 'en' | 'kr'; className?: string }) {
  const theme = useSettings((s) => s.theme);
  const [small, large] = FILES[lang][theme];
  return <img src={height > 20 ? large : small} alt="toonation" style={{ height }} className={`block w-auto select-none ${className}`} draggable={false} />;
}

/** 심볼(＋○○)만. 위젯 독립창 제목처럼 작은 자리에 쓴다. 왼쪽 원이 반투명이라 다크·라이트 공용. */
export function Symbol({ height = 12, className = '' }: { height?: number; className?: string }) {
  return <img src={symbol64} alt="toonation" style={{ height }} className={`block w-auto select-none ${className}`} draggable={false} />;
}
