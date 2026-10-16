// Electron 메인/프리로드를 CommonJS 단일 파일로 번들한다 (sandbox 프리로드는 단일 CJS여야 한다).
import { build } from 'esbuild';

const common = { bundle: true, platform: 'node', format: 'cjs', target: 'node20', external: ['electron'], sourcemap: true, logLevel: 'info' };

await Promise.all([
  build({ ...common, entryPoints: ['electron/main.ts'], outfile: 'dist-electron/main.cjs' }),
  build({ ...common, entryPoints: ['electron/preload.ts'], outfile: 'dist-electron/preload.cjs' }),
]);
