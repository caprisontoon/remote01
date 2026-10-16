// 개발용: Vite 개발 서버를 띄우고 그 주소로 Electron을 실행한다.
import { spawn } from 'node:child_process';
import { createServer } from 'vite';

const server = await createServer({ server: { port: 3000, strictPort: true } });
await server.listen();
const url = `http://localhost:${server.config.server.port}/`;

await new Promise((resolve, reject) => {
  const p = spawn(process.execPath, ['scripts/build-electron.mjs'], { stdio: 'inherit' });
  p.on('exit', (code) => (code === 0 ? resolve() : reject(new Error('electron build failed'))));
});

const electron = (await import('electron')).default;
const app = spawn(electron, ['.'], { stdio: 'inherit', env: { ...process.env, VITE_DEV_SERVER_URL: url } });
app.on('exit', async (code) => {
  await server.close();
  process.exit(code ?? 0);
});
