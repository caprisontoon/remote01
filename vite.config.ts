import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// base: './' — Electron(file://)과 웹 서버 하위 경로(toon.at/widget/controller/...) 모두에서 동작하도록 상대 경로로 빌드한다.
export default defineConfig({
  base: './',
  plugins: [react()],
  server: { port: 3000, host: '0.0.0.0' },
  build: { outDir: 'dist', emptyOutDir: true },
  test: { environment: 'node', include: ['src/**/*.test.ts', 'electron/**/*.test.ts'] },
});
