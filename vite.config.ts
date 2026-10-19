import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { execSync } from 'node:child_process';

// 설치된 앱이 어느 빌드인지 정보 화면에서 확인할 수 있도록 커밋과 빌드 날짜를 넣는다.
function buildId(): string {
  let sha = (process.env.GITHUB_SHA ?? '').slice(0, 7);
  try {
    sha ||= execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    // git이 없는 환경
  }
  return [sha, new Date().toISOString().slice(0, 10)].filter(Boolean).join(' · ');
}
process.env.VITE_BUILD ??= buildId();

// base: './' — Electron(file://)과 웹 서버 하위 경로(toon.at/widget/controller/...) 모두에서 동작하도록 상대 경로로 빌드한다.
export default defineConfig({
  base: './',
  plugins: [react()],
  server: { port: 3000, host: '0.0.0.0' },
  build: { outDir: 'dist', emptyOutDir: true },
  test: { environment: 'node', include: ['src/**/*.test.ts', 'electron/**/*.test.ts'] },
});
