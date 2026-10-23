import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

// 관리자 웹은 리모컨(설치형 패키지에 들어가는 dist/)과 따로 dist-admin/에 만든다.
// 개발 중에는 리모컨 개발 서버(npm run dev)의 /admin/ 주소로도 열린다.
const root = fileURLToPath(new URL('./admin', import.meta.url));

export default defineConfig({
  root,
  base: './',
  plugins: [react()],
  server: { port: 3001, host: '0.0.0.0' },
  build: { outDir: fileURLToPath(new URL('./dist-admin', import.meta.url)), emptyOutDir: true },
});
